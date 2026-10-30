/* eslint-disable svelte/prefer-svelte-reactivity */
/**
 * @file src/lib/store/FormStore.svelte.js
 * @module FormStore
 *
 * Менеджер черновика формы: хранит состояние заполнения, автосохраняет
 * его в `localStorage` и умеет финализировать запись в IndexedDB.
 *
 * Поддерживает два режима, переключаемых через `types`:
 * - `'note'` — обычная заметка: `id`/`timestamp`/дата берутся из момента создания;
 * - `'reminder'` — напоминание: `id`/`timestamp`/дата берутся из поля `remind`
 *   (дата + время), чтобы сортировка и напоминания работали от целевого времени,
 *   а не от времени создания черновика.
 *
 * Жизненный цикл:
 * 1. `new FormDraftManager(types, constructorStore)` — загружает сохранённый
 *    черновик из `localStorage` (если он того же `types`), иначе создаёт новый.
 * 2. Пользователь правит поля через `selectOption` / `updateNumericValue`.
 * 3. `$effect.root` внутри конструктора автоматически сохраняет черновик
 *    в `localStorage` с debounce 500 мс после последнего изменения.
 * 4. `save()` финализирует запись в IndexedDB и очищает черновик.
 * 5. `destroy()` — опционально: уничтожает корневой эффект автосохранения.
 *    Вызывать при размонтировании компонента, где живёт менеджер, чтобы
 *    эффекты не накапливались при пересоздании менеджера.
 *
 * Реактивность:
 * - Состояние формы — `$state` (поле класса `draft`).
 * - Автосохранение — `$effect.root` + `$effect`, потому что менеджер
 *   создаётся вне Svelte-компонента и вне его дерева эффектов.
 * - `$state.snapshot` используется везде, где значение уходит из реактивного
 *   контекста: в `localStorage` и в IndexedDB. Без него в хранилище попал бы
 *   `Proxy`, который нельзя сериализовать.
 *
 * Служебные поля (`dateStr`, `year`, `yearMonth`) — для индексов и запросов,
 * а не для отображения. Для показа пользователю используйте `timestamp`
 * и функции из `dateHelpers.js` (`formatTime`, `formatDateFromTimestamp`) —
 * это единственный источник правды для форматирования даты/времени.
 *
 * ⚠️ Файл требует `.svelte.js`-расширения: runes (`$state`, `$effect`,
 * `$effect.root`) не работают в обычных `.js`-модулях.
 *
 * ⚠️ В `localStorage` всегда лежит **один** черновик под ключом `'draft_entry'`.
 * Если на странице одновременно открыты формы разных типов (`note` и `reminder`),
 * они будут перетирать друг друга — ключ стоит сделать зависимым от `types`,
 * если это станет проблемой.
 */

import { saveEntry } from '$lib/utils/db.js';
import { createLocalTimestamp, formatDateISOLocal } from '$lib/utils/dateHelpers.js';

export class FormDraftManager {
  /**
   * Состояние черновика формы. Единственное реактивное поле класса.
   *
   * Форма `value` зависит от `types`:
   * - `'note'`: `{ [fieldKey]: string | number | object | null }` — плоская
   *   структура, где значения соответствуют выбранным опциям полей;
   * - `'reminder'`: то же плюс `value.remind = { date: 'YYYY-MM-DD', time: 'HH:MM' }`,
   *   из которого при `save()` вычисляются `id`/`timestamp`/`dateStr`.
   *
   * Поле `draft` объявлено на верхнем уровне класса — этого требуют runes
   * в `.svelte.js`-модулях (нельзя объявить `$state` внутри конструктора
   * как локальную переменную, если хотите, чтобы она была полем).
   *
   * @type {{
   *   id: string;
   *   timestamp: number;
   *   types: 'note' | 'reminder';
   *   value: Record<string, any>;
   *   dateStr?: string;
   *   dateCreate?: string;
   *   year?: number;
   *   yearMonth?: string;
   * }}
   */
  draft = $state({
    id: '',
    timestamp: Date.now(),
    types: 'note',
    value: {}
  });

  /**
   * Cleanup-функция, возвращённая `$effect.root`.
   * `null`, если эффект не создавался (SSR) или уже уничтожен через `destroy()`.
   * @type {(() => void) | null}
   */
  _effectCleanup = null;

  /**
   * @param {'note' | 'reminder'} types - тип создаваемой записи; определяет
   *   и структуру `draft.value`, и логику `save()`
   * @param {Object} constructorStore - экземпляр `constructorStore` (для `note`)
   *   или `constructorReminder` (для `reminder`). Содержит `schema`, по которой
   *   строятся дефолтные значения и валидируется форма.
   */
  constructor(types, constructorStore) {
    /** @type {'note' | 'reminder'} */
    this.types = types;

    /** @type {Object} */
    this.constructorStore = constructorStore;

    /** @type {string} */
    this.storageKey = 'draft_entry';

    const savedDraft = this.loadDraft();
    const now = Date.now(); // локальное время создания черновика

    // Восстанавливаем сохранённый черновик, только если он того же типа.
    // Иначе — создаём новый: черновик 'note' бессмысленно открывать в 'reminder'.
    if (savedDraft && savedDraft.types === types) {
      this.draft = savedDraft;
    } else {
      this.draft = {
        id: `${types}_${now}`,
        timestamp: now,
        types: types,
        value: this.initDefaultValues()
      };
    }

    // Автосохранение черновика при изменении draft (с debounce 500 мс).
    // $effect.root нужен, потому что менеджер живёт вне компонента и вне
    // его дерева эффектов — обычный $effect здесь не сработает.
    // typeof window — защита от SSR: localStorage на сервере нет.
    if (typeof window !== 'undefined') {
      /** @type {ReturnType<typeof setTimeout> | null} */
      let saveTimeout = null;

      // Сохраняем cleanup, чтобы destroy() мог уничтожить корневой эффект.
      // Без этого при пересоздании менеджера эффекты накапливались бы,
      // а старые debounce-таймеры продолжали писать в localStorage.
      this._effectCleanup = $effect.root(() => {
        $effect(() => {
          // $state.snapshot читает draft → эффект подписывается на изменения.
          // Без snapshot в localStorage попал бы Proxy, который не сериализуется.
          const snapshot = $state.snapshot(this.draft);

          if (saveTimeout) {
            clearTimeout(saveTimeout);
          }

          // Сохраняем через 500 мс после последнего изменения,
          // чтобы не писать в localStorage на каждое нажатие клавиши.
          saveTimeout = setTimeout(() => {
            localStorage.setItem(this.storageKey, JSON.stringify(snapshot));
            saveTimeout = null;
          }, 500);
        });
      });
    }
  }

  /**
   * Уничтожает корневой эффект автосохранения, созданный в конструкторе.
   *
   * Вызывать при размонтировании компонента, где живёт менеджер (например,
   * в `onDestroy` в Svelte). Без этого при пересоздании менеджера
   * (переключение между `note` и `reminder`, повторное открытие модалки и т.п.)
   * `$effect.root`-эффекты накапливаются: старые debounce-таймеры продолжают
   * срабатывать и писать устаревшие `draft` в `localStorage`, а сами эффекты
   * не собираются сборщиком мусора, пока жива ссылка на корень.
   *
   * Идемпотентен: повторный вызов — no-op. После `destroy()` менеджер можно
   * использовать дальше (методы `save`, `selectOption` и т.п. работают),
   * но автосохранение в `localStorage` больше не выполняется — только явный
   * `saveDraft()`.
   *
   * @returns {void}
   */
  destroy() {
    if (this._effectCleanup) {
      this._effectCleanup();
      this._effectCleanup = null;
    }
  }

  /**
   * Загружает сохранённый черновик из `localStorage`.
   *
   * На сервере (`typeof window === 'undefined'`) возвращает `null` —
   * `localStorage` там недоступен.
   *
   * Ошибки парсинга JSON не пробрасываются: битый черновик трактуется как
   * отсутствующий, чтобы форма могла открыться с дефолтными значениями.
   *
   * @returns {Object | null} объект черновика или `null`, если его нет / он битый
   */
  loadDraft() {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Ошибка загрузки черновика:', e);
      return null;
    }
  }

  /**
   * Строит начальное значение `draft.value` по схеме `constructorStore.schema`.
   *
   * Логика зависит от поля:
   * - `dateTime` и `field.choose === false` — пропускаются (служебные/отключённые);
   * - поле без активных опций — пропускается;
   * - поле с несколькими активными опциями и хотя бы одним инпутом —
   *   становится объектом `{ [optKey]: '' | 0 }` (по одной записи на опцию);
   * - одиночная опция с инпутом — `''` для текста/дат/времени, `0` для чисел;
   * - одиночная опция-кнопка (`BtnImg`/`btnIcon`) — `null` (значит «не выбрано»).
   *
   * «Инпут» здесь — любой `formView`, кроме `BtnImg`/`btnIcon`.
   * «Числовой инпут» — `InputNumber`/`inputNumber`/`InputRange`/`inputRange`.
   *
   * @returns {Record<string, any>} начальное значение для `draft.value`
   */
  initDefaultValues() {
    const schema = this.constructorStore.schema || {};
    const initialValue = {};

    for (const [fieldKey, field] of Object.entries(schema)) {
      if (fieldKey === 'dateTime' || field.choose === false) continue;

      const validOptions = Object.entries(field.options || {}).filter(
        ([, opt]) => opt.select === true
      );

      if (validOptions.length === 0) continue;

      // Есть ли среди активных опций хотя бы одна с настоящим инпутом
      const hasInputs = validOptions.some(([, opt]) => {
        const views = Array.isArray(opt.formView) ? opt.formView : [opt.formView || 'BtnImg'];
        return views.some((v) => v !== 'BtnImg' && v !== 'btnIcon');
      });

      // Несколько активных опций + есть инпуты (включая InputTime/InputDate):
      // поле — объект, где по каждой опции лежит её значение.
      if (validOptions.length > 1 && hasInputs) {
        initialValue[fieldKey] = {};
        validOptions.forEach(([optKey, opt]) => {
          const views = Array.isArray(opt.formView) ? opt.formView : [opt.formView || 'BtnImg'];
          const isNumeric = views.some((v) =>
            ['InputNumber', 'inputNumber', 'InputRange', 'inputRange'].includes(v)
          );

          if (isNumeric) {
            initialValue[fieldKey][optKey] = typeof opt.num === 'number' ? opt.num : 0;
          } else {
            // time, date, text, tel — пустая строка
            initialValue[fieldKey][optKey] = '';
          }
        });
      } else {
        // Одиночная опция: значение — скаляр
        const firstOpt = validOptions[0];
        const views = Array.isArray(firstOpt[1].formView)
          ? firstOpt[1].formView
          : [firstOpt[1].formView || 'BtnImg'];

        const isNumeric = views.some((v) =>
          ['InputNumber', 'inputNumber', 'InputRange', 'inputRange'].includes(v)
        );
        const isInput = views.some((v) => v !== 'BtnImg' && v !== 'btnIcon');

        if (isNumeric) {
          initialValue[fieldKey] = typeof firstOpt[1].num === 'number' ? firstOpt[1].num : 0;
        } else if (isInput) {
          initialValue[fieldKey] = '';
        } else {
          initialValue[fieldKey] = null;
        }
      }
    }

    return initialValue;
  }

  /**
   * Выбирает опцию в поле.
   *
   * Поведение зависит от текущей структуры `draft.value[fieldKey]`:
   * - если поле — объект (несколько опций с инпутами), выбор опции не
   *   перезаписывает весь объект, а лишь гарантирует наличие ключа `optionKey`
   *   (чтобы последующий `updateNumericValue` / ввод текста не упал);
   * - если поле — скаляр (одиночная кнопка `BtnImg`), просто записывает
   *   `optionKey` как значение.
   *
   * @param {string} fieldKey - ключ поля в `draft.value`
   * @param {string} optionKey - ключ выбранной опции внутри `field.options`
   * @returns {void}
   */
  selectOption(fieldKey, optionKey) {
    const currentValue = this.draft.value[fieldKey];

    // Поле-объект (несколько опций с инпутами): сохраняем структуру,
    // не затираем объект строкой.
    if (typeof currentValue === 'object' && currentValue !== null) {
      if (!(optionKey in currentValue)) {
        this.draft.value[fieldKey][optionKey] = '';
      }
    } else {
      // Одиночная кнопка (BtnImg) без вложенных инпутов
      this.draft.value[fieldKey] = optionKey;
    }
  }

  /**
   * Записывает числовое значение для опции внутри поля-объекта.
   *
   * Если поле ещё не объект (например, `null` или строка) — заменяет его
   * на пустой объект, чтобы запись `this.draft.value[fieldKey][optionKey]`
   * не упала. Это защищает от гонок: пользователь мог успеть ввести число
   * до того, как `selectOption` инициализировал структуру.
   *
   * @param {string} fieldKey - ключ поля в `draft.value`
   * @param {string} optionKey - ключ опции внутри поля
   * @param {string | number} val - значение; приводится к числу через `Number()`
   * @returns {void}
   */
  updateNumericValue(fieldKey, optionKey, val) {
    if (!this.draft.value[fieldKey] || typeof this.draft.value[fieldKey] !== 'object') {
      this.draft.value[fieldKey] = {};
    }
    this.draft.value[fieldKey][optionKey] = Number(val);
  }

  /**
   * Принудительно сохраняет черновик в `localStorage`, минуя debounce.
   *
   * Используется при `blur` на полях ввода — чтобы не потерять значение,
   * если пользователь сразу закроет вкладку. Работает и после `destroy()`
   * (в отличие от автосохранения, которое `destroy()` отключает).
   *
   * TODO: подключить как `onblur={() => manager.saveDraft()}` для InputText,
   * InputTel, InputNumber, InputRange, Textarea, InputDate, InputTime.
   *
   * @returns {void}
   */
  saveDraft() {
    if (typeof window !== 'undefined') {
      // snapshot обязателен: Proxy из $state не сериализуется JSON.stringify
      const snapshot = $state.snapshot(this.draft);
      localStorage.setItem(this.storageKey, JSON.stringify(snapshot));
    }
  }

  /**
   * Финализирует черновик: вычисляет служебные поля и сохраняет запись в IndexedDB.
   *
   * Для `'reminder'`:
   * - `id`/`timestamp`/`dateStr`/`year`/`yearMonth` берутся из `value.remind`
   *   (дата + время напоминания), чтобы запись сортировалась по целевому
   *   времени, а не по времени создания черновика;
   * - `dateCreate` — время создания черновика (`draft.timestamp`) в ISO-формате.
   *   Если `remind` пуст или неполон — служебные поля **не** пересчитываются,
   *   запись сохраняется как есть (валидация должна была отсечь этот случай).
   *
   * Для `'note'`:
   * - `id`/`timestamp`/`dateStr`/`year`/`yearMonth`/`dateCreate` берутся
   *   из текущего момента (`Date.now()`), дата — в UTC.
   *   ⚠️ `dateStr` в UTC (не локальная): используется для индексов `by_date`/
   *   `by_month` и для запросов по датам. Для отображения пользователю
   *   используйте `timestamp` + `formatDateFromTimestamp()` из `dateHelpers.js`.
   *
   * После успешного сохранения вызывает `clearDraft()`.
   *
   * @returns {Promise<void>}
   * @throws {Error} если `saveEntry` завершился ошибкой (пробрасывается наружу)
   */
  async save() {
    const record = $state.snapshot(this.draft);

    // ====== СПЕЦИАЛЬНАЯ ОБРАБОТКА ДЛЯ REMINDER ======
    if (this.types === 'reminder') {
      const remindData = record.value?.remind;

      if (remindData && typeof remindData === 'object' && remindData.date && remindData.time) {
        const { date, time } = remindData;

        // timestamp в ЛОКАЛЬНОМ времени (не UTC), чтобы «напомнить в 09:00»
        // сработало именно в 09:00 по часовому поясу пользователя
        const reminderTimestamp = createLocalTimestamp(date, time);

        record.id = `${this.types}_${reminderTimestamp}`;
        record.timestamp = reminderTimestamp;
        record.dateStr = date;
        record.year = parseInt(date.split('-')[0], 10);
        record.yearMonth = date.slice(0, 7);

        const createTimestamp = this.draft.timestamp || Date.now();
        record.dateCreate = formatDateISOLocal(createTimestamp);
      }
    } else {
      // ====== ДЛЯ NOTE: используем текущий timestamp ======
      const now = Date.now();
      record.id = `${this.types}_${now}`;
      record.timestamp = now;
      const dateObj = new Date(now);
      const year = dateObj.getUTCFullYear();
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getUTCDate()).padStart(2, '0');
      record.dateStr = `${year}-${month}-${day}`;
      record.dateCreate = record.dateStr;
      record.year = year;
      record.yearMonth = `${year}-${month}`;
    }

    await saveEntry(record);
    this.clearDraft();
  }

  /**
   * Удаляет черновик из `localStorage`.
   *
   * На сервере — no-op (там нет `localStorage`).
   *
   * @returns {void}
   */
  clearDraft() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Возвращает список текстовых ошибок валидации формы.
   *
   * Комбинированная валидация:
   * 1. **Дата напоминания** (только `'reminder'`): `value.remind` должен быть
   *    в будущем относительно `Date.now()` и относительно `draft.timestamp`
   *    (времени создания черновика).
   * 2. **Обязательные поля** (`field.required === true`): пустая строка,
   *    `null` или `undefined` дают ошибку. Для полей-объектов проверяется
   *    каждая активная опция, у которой `opt.required !== false`.
   * 3. **Секции только с кнопками** (`BtnImg`/`btnIcon` без инпутов): значение
   *    `null`/`undefined` значит «выбор не сделан» → ошибка.
   *
   * Исключения:
   * - `dateTime` и `field.choose === false` — пропускаются;
   * - для `'reminder'` поле `pay` не проверяется на обязательность;
   * - пустой, но существующий `remind` не даёт ошибки — обязательность
   *   `remind` обрабатывается через `field.required` в общем цикле.
   *
   * @returns {string[]} массив человекочитаемых сообщений; пустой, если форма валидна
   */
  getValidationErrors() {
    const schema = this.constructorStore.schema || {};
    const errors = [];

    // ====== ПРОВЕРКА ДАТЫ НАПОМИНАНИЯ (только для reminder) ======
    if (this.types === 'reminder') {
      const draftTimestamp = this.draft.timestamp || Date.now();

      const remindData = this.draft.value.remind;
      if (remindData?.date && remindData?.time) {
        const newTimestamp = createLocalTimestamp(remindData.date, remindData.time);
        if (newTimestamp <= Date.now()) {
          errors.push('Дата и время напоминания должны быть в будущем');
        }
      }

      // Проверка относительно времени создания черновика.
      // ВАЖНО (сознательная несогласованность, не баг):
      // здесь используется Date.UTC, а в save() — createLocalTimestamp
      // (локальное время). Это две разные задачи:
      //   - валидация сравнивает «наивное» UTC-время напоминания со
      //     временем создания черновика (draft.timestamp);
      //   - save() строит timestamp так, чтобы напоминание сработало в
      //     локальное время пользователя.
      // Для типичных напоминаний (часы/дни вперёд) разница в смещении
      // часового пояса не пересекает границу «прошлое/будущее», поэтому
      // поведение на практике предсказуемо. Менять только вместе с
      // изменением save() — иначе можно получить регресс.
      if (remindData && typeof remindData === 'object' && remindData.date && remindData.time) {
        const { date, time } = remindData;

        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);

        const reminderDateTime = Date.UTC(year, month - 1, day, hours, minutes);

        if (reminderDateTime <= draftTimestamp) {
          errors.push('Проверьте дату и время напоминания.');
        }
      }
    }

    // ====== ОСТАЛЬНАЯ ЛОГИКА ВАЛИДАЦИИ ======
    for (const [fieldKey, field] of Object.entries(schema)) {
      // Служебные и отключённые поля
      if (field.choose === false || fieldKey === 'dateTime') continue;

      // Для reminder поле pay не обязательное, даже если состоит из BtnImg
      if (this.types === 'reminder' && fieldKey === 'pay') continue;

      const validOptions = Object.entries(field.options || {}).filter(
        ([, opt]) => opt.select === true
      );
      if (validOptions.length === 0) continue;

      const hasInputs = validOptions.some(([, opt]) => {
        const views = Array.isArray(opt.formView) ? opt.formView : [opt.formView || 'BtnImg'];
        return views.some((v) => v !== 'BtnImg' && v !== 'btnIcon');
      });

      const val = this.draft.value[fieldKey];

      // Секция только с кнопками: null/undefined = выбор не сделан
      if (!hasInputs) {
        if (val === null || val === undefined) {
          errors.push(`Сделайте выбор в поле: ${field.label || fieldKey}`);
        }
        continue;
      }

      // Поле с инпутами и required: true
      if (field.required) {
        if (typeof val === 'object' && val !== null) {
          // Поле-объект: проверяем каждую активную опцию отдельно
          for (const [optKey, opt] of validOptions) {
            const optVal = val[optKey];
            const isOptRequired = opt.required !== false && field.required;

            if (isOptRequired) {
              const isStringEmpty = typeof optVal === 'string' && optVal.trim() === '';
              const isUndefined = optVal === undefined || optVal === null;

              if (isStringEmpty || isUndefined) {
                const optLabel = opt.label ? ` (${opt.label})` : '';
                errors.push(`Сделайте выбор в поле: ${field.label || fieldKey}${optLabel}`);
              }
            }
          }
        } else if (
          val === null ||
          val === undefined ||
          (typeof val === 'string' && val.trim() === '')
        ) {
          // Скаляр: пустая строка / null / undefined
          errors.push(`Сделайте выбор в поле: ${field.label || fieldKey}`);
        }
      }
    }

    return errors;
  }

  /**
   * Флаг валидности формы — для блокировки кнопки «Сохранить».
   *
   * Геттер, а не метод: в шаблоне можно писать `{#if manager.isValid}`,
   * и Svelte будет пересчитывать его при изменении `draft` (через
   * `getValidationErrors`, который читает `draft.value`).
   *
   * @returns {boolean} `true`, если ошибок валидации нет
   */
  get isValid() {
    return this.getValidationErrors().length === 0;
  }
}