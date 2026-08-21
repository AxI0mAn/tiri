// '$lib/store/ConstructorStore.svelte.js

// конструктор - образец для создания карточек заказа и напоминания
// использует baseSchema - для заказа и дополнения remind и about - для напоминания
// хранится в localStorage 
// при изменении свойства - автоматически перезаписывается в localStorage
// для переключения свойства использовать toggleField toggleOption


// Вместо import { browser } from '$app/environment';
// Используем это:
const browser = typeof window !== 'undefined' && typeof document !== 'undefined';


// импорты иконок
import maleWebp from '$lib/assets/iconPic/128/male.webp';
import malePng from '$lib/assets/iconPic/128/male.png';
import male_beardeWebp from '$lib/assets/iconPic/128/male_bearded.webp';
import male_beardedPng from '$lib/assets/iconPic/128/male_bearded.png';

import femaleWebp from '$lib/assets/iconPic/128/female.webp';
import femalePng from '$lib/assets/iconPic/128/female.png';
import coloristWebp from '$lib/assets/iconPic/128/colorist.webp';
import coloristPng from '$lib/assets/iconPic/128/colorist.png';

import childWebp from '$lib/assets/iconPic/128/child.webp';
import childPng from '$lib/assets/iconPic/128/child.png';

import cardBWebp from '$lib/assets/iconPic/128/cardB.webp';
import cardBPng from '$lib/assets/iconPic/128/cardB.png';
import cardGWebp from '$lib/assets/iconPic/128/cardG.webp';
import cardGPng from '$lib/assets/iconPic/128/cardG.png';
import cashWebp from '$lib/assets/iconPic/128/cash.webp';
import cashPng from '$lib/assets/iconPic/128/cash.png';
import cryptoWebp from '$lib/assets/iconPic/128/crypto.webp';
import cryptoPng from '$lib/assets/iconPic/128/crypto.png';

import notesWebp from '$lib/assets/iconPic/128/notes.webp';
import notesPng from '$lib/assets/iconPic/128/notes.png';
import phoneWebp from '$lib/assets/iconPic/128/phone.webp';
import phonePng from '$lib/assets/iconPic/128/phone.png';
import timeWebp from '$lib/assets/iconPic/128/time.webp';
import timePng from '$lib/assets/iconPic/128/time.png';
import todayWebp from '$lib/assets/iconPic/128/today.webp';
import todayPng from '$lib/assets/iconPic/128/today.png';

import nameWebp from '$lib/assets/iconPic/128/name.webp';
import namePng from '$lib/assets/iconPic/128/name.png';
import paymentWebp from '$lib/assets/iconPic/128/payment.webp';
import paymentPng from '$lib/assets/iconPic/128/payment.png';



const STORAGE_KEY_NOTES = 'card_constructor_notes_v1';
const STORAGE_KEY_REMINDS = 'card_constructor_reminds_v1';

// Наша статическая схема со всеми доступными полями
const baseSchema = {
  gender: {
    choose: true,  // true - подключено поле,  false - отключено
    required: false, //  true - Обязательное для заполнения
    label: "Стрижка",
    title: "текстовое описание поля",
    options: {
      male: {
        label: "Мужская",
        required: false,
        select: true, // true - подключен этот вариант для поля,  false - отключено
        iconWebp: maleWebp,
        iconPng: malePng,
      },
      male_bearded: {
        label: "Борода",
        required: false,
        select: true,
        iconWebp: male_beardeWebp,
        iconPng: male_beardedPng,
      },
      female: {
        label: "Женская",
        required: false,
        select: true,
        iconWebp: femaleWebp,
        iconPng: femalePng,
      },
      colorist: {
        label: "Окрашивание",
        required: false,
        select: false,
        iconWebp: coloristWebp,
        iconPng: coloristPng,
      },
      child: {
        label: "Детская",
        required: false,
        select: false,
        iconWebp: childWebp,
        iconPng: childPng,
      },
    },
  },
  percent: {
    choose: true,
    required: true,
    label: "Настройки оплаты",
    title: "текстовое описание поля",
    options: {
      myPercent: {
        label: "Мой процент",
        required: true,
        select: true,
        num: 50,
        min: 0,
        max: 100,
        step: 1,
      },
      sum: {
        label: "Стандартный чек",
        required: true,
        select: true,
        num: 300,
        min: 50,
        // max: 10000,
        step: 5,
        iconWebp: paymentWebp,
        iconPng: paymentPng,
      }
    }


  },
  pay: {
    choose: true,
    required: false,
    label: "Тип оплаты",
    title: "текстовое описание поля",
    options: {
      cash: {
        label: "Наличные",
        required: true,
        select: true,
        iconWebp: cashWebp,
        iconPng: cashPng,
      },
      card1: {
        label: "Карта1",
        required: true,
        select: true,
        iconWebp: cardBWebp,
        iconPng: cardBPng,
      },
      card2: {
        label: "Карта2",
        required: false,
        select: false,
        iconWebp: cardGWebp,
        iconPng: cardGPng,
      },
      crypto: {
        label: "Счёт",
        required: false,
        select: false,
        iconWebp: cryptoWebp,
        iconPng: cryptoPng,
      },
    }
  },
  notes: {
    choose: true,
    required: false,
    label: "Заметки",
    title: "текстовое описание поля",
    options: {
      text: {
        label: "Заметки",
        required: true,
        select: true,
        iconWebp: notesWebp,
        iconPng: notesPng,
      },
      phone: {
        label: "Тел",
        required: false,
        select: true,
        iconWebp: phoneWebp,
        iconPng: phonePng,
      },
      name: {
        label: "Имя",
        required: false,
        select: true,
        iconWebp: nameWebp,
        iconPng: namePng,
      },
    }
  },
  date: {
    choose: true,
    required: true,
    label: "Время и дата",
    title: "текстовое описание поля",
    options: {
      time: {
        label: "Время",
        required: true,
        select: true,
        iconWebp: timeWebp,
        iconPng: timePng,
      },
      date: {
        label: "Дата",
        required: true,
        select: true,
        iconWebp: todayWebp,
        iconPng: todayPng,
      },
    }
  }
};


export class ConstructorStore {
  /** @type {Record<string, any>} */

  constructor(storageKey = STORAGE_KEY_NOTES) {
    this.storageKey = storageKey;
    this.schema = $state(JSON.parse(JSON.stringify(baseSchema)));

    if (browser) {
      this.initFromStorage();

      // Авто-сохранение по твоему паттерну
      $effect.root(() => {
        $effect(() => {
          const data = this.serialize();
          localStorage.setItem(this.storageKey, JSON.stringify(data));
        });
      });
    }
  }

  /** Инициализация настроек из локального хранилища */
  initFromStorage() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) {
      console.log(`[${this.storageKey}]: Настройки не найдены, использую значения по умолчанию`);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        this.schema = parsed;
        console.log(`[${this.storageKey}]: Схема успешно загружена из localStorage`);
      }
    } catch (err) {
      console.error(`[${this.storageKey}]: Ошибка чтения localStorage, сброс на дефолт`, err);
    }
  }

  /** 
   * Сериализация состояния для сохранения 
   * $state.snapshot делает снимки вложенных объектов, чтобы $effect глубоко отслеживал изменения
   */
  serialize() {
    return $state.snapshot(this.schema);
  }

  /** Переключение состояния поля (Включено/Отключено) */
  toggleField(fieldKey) {
    if (this.schema[fieldKey] && !this.schema[fieldKey].required) {
      this.schema[fieldKey].choose = !this.schema[fieldKey].choose;
    }
  }

  /** Переключение выбора опции через SelectStatus или клик */
  setOptionSelect(fieldKey, optionKey, selectValue) {
    const opt = this.schema[fieldKey]?.options?.[optionKey];
    if (opt && !opt.required) {
      opt.select = selectValue;
    }
  }

  /** Изменение числового значения опции */
  setOptionNum(fieldKey, optionKey, value) {
    const opt = this.schema[fieldKey]?.options?.[optionKey];
    if (opt && typeof opt.num !== 'undefined') {
      opt.num = value;
    }
  }

  // Цикличная кнопка для вариантов (Опций)
  // Переключает его состояния по кругу испольовался с SelectStatus:
  // Выключен (select: false) --> Включен (select: true, required: false) --> Обязателен (select: true, required: true) --> Выключен.

  toggleOptionWithRequired(fieldKey, optionKey) {
    const opt = this.schema[fieldKey]?.options?.[optionKey];
    if (!opt) return;

    if (!opt.select) {
      // 1. Был выключен (✗) -> Включаем (✓)
      opt.select = true;
      opt.required = false;
    } else if (opt.select && !opt.required) {
      // 2. Был включен (✓) -> Делаем обязательным (!)
      opt.required = true;
    } else {
      // 3. Был обязательным (!) -> Выключаем (✗)
      opt.select = false;
      opt.required = false;
    }
  }
}


// Наследуем класс и добавляем специфичные поля для Напоминания
export class ReminderConstructorStore extends ConstructorStore {

  constructor(storageKey = STORAGE_KEY_REMINDS) {
    super(storageKey);
    this.addReminderSystemFields();
  }

  addReminderSystemFields() {
    // Вшиваем системные обязательные поля для напоминаний
    this.schema.remind = {
      type: true,
      required: true,
      label: "Когда напомнить",
      options: {
        time: { label: "Время", select: true },
        date: { label: "Дата", select: true },
      }
    };
    this.schema.about = {
      type: true,
      required: false,
      label: "Что напомнить",
    };
  }
}

// Экспортируем два готовых экземпляра
export const constructorStore = new ConstructorStore();
export const constructorReminder = new ReminderConstructorStore();




