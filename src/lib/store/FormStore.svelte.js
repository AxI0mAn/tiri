/* eslint-disable svelte/prefer-svelte-reactivity */
// src/lib/store/FormStore.svelte.js
import { saveEntry } from '$lib/utils/db.js';
import { createLocalTimestamp, formatDateISOLocal } from '$lib/utils/dateHelpers.js';

export class FormDraftManager {
  // 1. $state объявляется строго как поле класса на верхнем уровне
  /**
  * Состояние черновика формы
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
   * @param {'note' | 'reminder'} types
   * @param {Object} constructorStore - экземпляр constructorStore или constructorReminder
   */
  constructor(types, constructorStore) {
    this.types = types;
    this.constructorStore = constructorStore;
    this.storageKey = 'draft_entry';

    const savedDraft = this.loadDraft();
    const now = Date.now(); //  локальное время



    // 2. Наполняем уже объявленное поле draft значениями
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

    // 3. Автосохранение черновика при изменении draft
    if (typeof window !== 'undefined') {
      $effect.root(() => {
        $effect(() => {
          const snapshot = $state.snapshot(this.draft);
          localStorage.setItem(this.storageKey, JSON.stringify(snapshot));
        });
      });
    }
  }

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

  initDefaultValues() {
    const schema = this.constructorStore.schema || {};
    const initialValue = {};

    for (const [fieldKey, field] of Object.entries(schema)) {
      if (fieldKey === 'dateTime' || field.choose === false) continue;

      const validOptions = Object.entries(field.options || {}).filter(
        ([, opt]) => opt.select === true
      );

      if (validOptions.length === 0) continue;

      // Проверяем, содержит ли хотя бы одна опция элементы ввода
      const hasInputs = validOptions.some(([, opt]) => {
        const views = Array.isArray(opt.formView) ? opt.formView : [opt.formView || 'BtnImg'];
        return views.some((v) => v !== 'BtnImg' && v !== 'btnIcon');
      });

      // ВАЖНО: Если у поля НЕСКОЛЬКО активных опций и есть инпуты (включая InputTime и InputDate)
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
            // Для time, date, text, tel устанавливаем пустую строку
            initialValue[fieldKey][optKey] = '';
          }
        });
      } else {
        // Одиночные опции
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

  selectOption(fieldKey, optionKey) {
    const currentValue = this.draft.value[fieldKey];

    // Если поле является объектом (содержит вложенные поля, такие как time и date),
    // мы НЕ перезаписываем весь объект строкой, а сохраняем существующую структуру!
    if (typeof currentValue === 'object' && currentValue !== null) {
      // Оставляем объект как есть или обновляем только если нужно
      if (!(optionKey in currentValue)) {
        this.draft.value[fieldKey][optionKey] = '';
      }
    } else {
      // Для одиночных кнопок (BtnImg) без вложенных инпутов
      this.draft.value[fieldKey] = optionKey;
    }
  }

  updateNumericValue(fieldKey, optionKey, val) {
    if (!this.draft.value[fieldKey] || typeof this.draft.value[fieldKey] !== 'object') {
      this.draft.value[fieldKey] = {};
    }
    this.draft.value[fieldKey][optionKey] = Number(val);
  }

  /**
   * Сохраняет запись в базу данных
   * Для reminder: timestamp и id формируются на основе данных из поля remind
   * Для note: используется текущее время создания
   * @returns {Promise<void>}
   */
  async save() {
    const record = $state.snapshot(this.draft);

    // ====== СПЕЦИАЛЬНАЯ ОБРАБОТКА ДЛЯ REMINDER ======
    if (this.types === 'reminder') {
      const remindData = record.value?.remind;

      if (remindData && typeof remindData === 'object' && remindData.date && remindData.time) {
        const { date, time } = remindData;

        // ✅ Создаем timestamp в ЛОКАЛЬНОМ времени
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

  clearDraft() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Возвращает массив текстовых ошибок/подсказок для незаполненных обязательных полей
   * Комбинированная валидация:
   * 1. Проверка обязательных полей (field.required === true)
   * 2. Проверка секций только с кнопками (BtnImg) — выбор должен быть сделан
   * 3. Проверка даты напоминания (для reminder) — должна быть после даты создания
   * @returns {string[]}
   */
  getValidationErrors() {
    const schema = this.constructorStore.schema || {};
    const errors = [];

    // ====== ПРОВЕРКА ДАТЫ НАПОМИНАНИЯ (только для reminder) ======
    if (this.types === 'reminder') {
      const draftTimestamp = this.draft.timestamp || Date.now();

      // Получаем данные из поля remind
      const remindData = this.draft.value.remind;

      // Проверяем, что remind существует и это объект с полями date и time
      if (remindData && typeof remindData === 'object' && remindData.date && remindData.time) {
        const { date, time } = remindData;

        // Парсим дату и время
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);

        // Используем Date.UTC для получения timestamp в миллисекундах
        const reminderDateTime = Date.UTC(year, month - 1, day, hours, minutes);

        // Сравниваем с timestamp создания черновика
        if (reminderDateTime <= draftTimestamp) {
          errors.push('Проверьте дату и время напоминания.');
        }
      }
      // Если поле remind существует, но пустое - не добавляем ошибку
      // (валидация на обязательность заполнения обрабатывается отдельно через field.required)
    }

    // ====== ОСТАЛЬНАЯ ЛОГИКА ВАЛИДАЦИИ  ======
    for (const [fieldKey, field] of Object.entries(schema)) {
      // Игнорируем отключенные поля и служебные
      if (field.choose === false || fieldKey === 'dateTime') continue;

      // Для reminder поле pay не обязательное, даже если оно состоит из BtnImg
      if (this.types === 'reminder' && fieldKey === 'pay') continue;

      // Получаем все активные опции
      const validOptions = Object.entries(field.options || {}).filter(
        ([, opt]) => opt.select === true
      );
      if (validOptions.length === 0) continue;

      // Проверяем, есть ли в поле инпуты (числа, текст, даты)
      const hasInputs = validOptions.some(([, opt]) => {
        const views = Array.isArray(opt.formView) ? opt.formView : [opt.formView || 'BtnImg'];
        return views.some((v) => v !== 'BtnImg' && v !== 'btnIcon');
      });

      const val = this.draft.value[fieldKey];

      // Секция ТОЛЬКО с кнопками (BtnImg)
      if (!hasInputs) {
        if (val === null || val === undefined) {
          errors.push(`Сделайте выбор в поле: ${field.label || fieldKey}`);
        }
        continue;
      }

      // Поле с инпутами и required: true
      if (field.required) {
        if (typeof val === 'object' && val !== null) {
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
        }
        else if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
          errors.push(`Сделайте выбор в поле: ${field.label || fieldKey}`);
        }
      }
    }

    return errors;
  }

  /**
   * Флаг валидности формы для блокировки кнопки
   * @returns {boolean}
   */
  get isValid() {
    return this.getValidationErrors().length === 0;
  }
}