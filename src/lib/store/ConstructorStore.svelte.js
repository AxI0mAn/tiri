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
import nameWebp from '$lib/assets/iconPic/128/name.webp';
import namePng from '$lib/assets/iconPic/128/name.png';

import timeWebp from '$lib/assets/iconPic/128/time.webp';
import timePng from '$lib/assets/iconPic/128/time.png';
import todayWebp from '$lib/assets/iconPic/128/today.webp';
import todayPng from '$lib/assets/iconPic/128/today.png';

import myPercWebp from '$lib/assets/iconPic/128/myPerc.webp';
import myPercPng from '$lib/assets/iconPic/128/myPerc.png';
import tipsWebp from '$lib/assets/iconPic/128/tips.webp';
import tipsPng from '$lib/assets/iconPic/128/tips.png';
import sumWebp from '$lib/assets/iconPic/128/sum.webp';
import sumPng from '$lib/assets/iconPic/128/sum.png';





const STORAGE_KEY_NOTES = 'card_constructor_notes_v1';
const STORAGE_KEY_REMINDS = 'card_constructor_reminds_v1';

// Наша статическая схема со всеми доступными полями
const baseSchema = {
  gender: {
    choose: true,  // true - подключено поле,  false - отключено
    required: false, //  true - Обязательное для заполнения
    fieldClass: '', // класс для стилизации в форме, но не в свойствах
    label: "Стрижка", // Название поля с опциями
    title: "текстовое описание поля", // описание поля
    options: { // опции для этого поля
      male: {
        label: "Мужская", // название опции
        required: false,  // false - не обязательно для выбора
        optionClass: '', // класс для стилизации в форме, но не в свойствах
        select: true, // true - подключен этот вариант для поля,  false - отключено
        formView: ['BtnImg'], // что отобразить в форме создания заметки
        iconWebp: maleWebp, // изображение для иконки
        iconPng: malePng, //  изображение для иконки
      },
      male_bearded: {
        label: "Борода",
        required: false,
        optionClass: '',
        select: true,
        formView: ['BtnImg'],
        iconWebp: male_beardeWebp,
        iconPng: male_beardedPng,
      },
      female: {
        label: "Женская",
        required: false,
        optionClass: '',
        select: true,
        formView: ['BtnImg'],
        iconWebp: femaleWebp,
        iconPng: femalePng,
      },
      colorist: {
        label: "Окрашивание",
        required: false,
        optionClass: '',
        select: false,
        formView: ['BtnImg'],
        iconWebp: coloristWebp,
        iconPng: coloristPng,
      },
      child: {
        label: "Детская",
        required: false,
        optionClass: '',
        select: false,
        formView: ['BtnImg'],
        iconWebp: childWebp,
        iconPng: childPng,
      },
    },
  },
  percent: {
    choose: true,
    required: true,
    fieldClass: '',
    label: "Настройки оплаты",
    title: "текстовое описание поля",
    options: {
      myPercent: {
        label: "Мой процент",
        required: true,
        optionClass: '',
        select: true,
        formView: ['BtnImg', 'InputNumber'],
        num: 50,
        min: 0,
        max: 100,
        step: 5,
        iconWebp: myPercWebp,
        iconPng: myPercPng,
      },
      sum: {
        label: "Стандартный чек",
        required: true,
        optionClass: '',
        select: true,
        formView: ['BtnImg', 'InputNumber'],
        num: 300,
        min: 0,
        // max: 1000,
        step: 10,
        iconWebp: sumWebp,
        iconPng: sumPng,
      },
      tips: {
        label: "Чаевые",
        required: false,
        optionClass: '',
        select: true,
        formView: ['BtnImg', 'InputNumber'],
        num: 0,
        min: 0,
        // max: 1000,
        step: 5,
        iconWebp: tipsWebp,
        iconPng: tipsPng,
      },
    }


  },
  pay: {
    choose: true,
    required: false,
    fieldClass: '',
    label: "Тип оплаты",
    title: "текстовое описание поля",
    options: {
      cash: {
        label: "Наличные",
        required: true,
        optionClass: '',
        select: true,
        formView: ['BtnImg'],
        iconWebp: cashWebp,
        iconPng: cashPng,
      },
      card1: {
        label: "Карта1",
        required: true,
        optionClass: '',
        select: true,
        formView: ['BtnImg'],
        iconWebp: cardBWebp,
        iconPng: cardBPng,
      },
      card2: {
        label: "Карта2",
        required: false,
        optionClass: '',
        select: false,
        formView: ['BtnImg'],
        iconWebp: cardGWebp,
        iconPng: cardGPng,
      },
      crypto: {
        label: "Счёт",
        required: false,
        optionClass: '',
        select: false,
        formView: ['BtnImg'],
        iconWebp: cryptoWebp,
        iconPng: cryptoPng,
      },
    }
  },
  notes: {
    choose: true,
    required: false,
    fieldClass: 'notesInForm',
    label: "Заметки",
    title: "текстовое описание поля",
    options: {
      name: {
        label: "Имя",
        required: false,
        optionClass: '',
        select: true,
        formView: ['BtnImg', 'InputText'],
        iconWebp: nameWebp,
        iconPng: namePng,
      },
      phone: {
        label: "Тел",
        required: false,
        optionClass: '',
        select: true,
        formView: ['BtnImg', 'InputTel'],
        iconWebp: phoneWebp,
        iconPng: phonePng,
      },
      text: {
        label: "Заметки",
        required: true,
        optionClass: '',
        select: true,
        formView: ['BtnImg', 'Textarea'],
        iconWebp: notesWebp,
        iconPng: notesPng,
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
      choose: true,
      required: true,
      optionClass: '',
      label: "Время и дата события",
      title: "текстовое описание поля",
      options: {
        time: {
          label: "Время",
          required: true,
          select: true,
          formView: ['BtnImg', 'InputTime'],
          iconWebp: timeWebp,
          iconPng: timePng,
        },
        date: {
          label: "Дата",
          required: true,
          select: true,
          formView: ['BtnImg', 'InputDate'],
          iconWebp: todayWebp,
          iconPng: todayPng,
        },
      }
    }
  }
}


// Экспортируем два готовых экземпляра
export const constructorStore = new ConstructorStore();
export const constructorReminder = new ReminderConstructorStore();




