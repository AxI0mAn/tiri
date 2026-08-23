// src/lib/store/FormStore.svelte.js
import { saveEntry } from '$lib/utils/db.js';

export class FormDraftManager {
  // 1. $state объявляется строго как поле класса на верхнем уровне
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
    const now = Date.now();

    // 2. Наполняем уже объявленное поле draft значeниями
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

      const validOptions = Object.values(field.options || {}).filter(
        (opt) => opt.select === true
      );

      if (validOptions.length === 0) continue;

      const hasInputs = validOptions.some((opt) => typeof opt.num === 'number');

      if (hasInputs) {
        initialValue[fieldKey] = {};
        Object.entries(field.options || {}).forEach(([optKey, opt]) => {
          if (opt.select === true && typeof opt.num === 'number') {
            initialValue[fieldKey][optKey] = opt.num;
          }
        });
      } else {
        initialValue[fieldKey] = null;
      }
    }

    return initialValue;
  }

  selectOption(fieldKey, optionKey) {
    this.draft.value[fieldKey] = optionKey;
  }

  updateNumericValue(fieldKey, optionKey, val) {
    if (!this.draft.value[fieldKey]) {
      this.draft.value[fieldKey] = {};
    }
    this.draft.value[fieldKey][optionKey] = Number(val);
  }

  async save() {
    const record = $state.snapshot(this.draft);
    await saveEntry(record);
    this.clearDraft();
  }

  clearDraft() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }
}