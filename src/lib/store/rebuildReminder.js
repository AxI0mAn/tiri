import { browser, STORAGE_KEY_NOTES, STORAGE_KEY_REMINDS, REMIND_FIELD, constructorReminder } from '$lib/store/ConstructorStore.svelte.js';


/**
 * Пересобирает схему reminder на основе актуальной схемы note
 * Вызывать только когда пользователь изменил настройки и уходит со страницы настроек!
 */


export function rebuildReminderSchema() {
  // console.log('🔧 rebuildReminderSchema() ВЫЗВАНА!');

  if (!browser) return;

  try {
    // 1. Загружаем note схему
    const noteRaw = localStorage.getItem(STORAGE_KEY_NOTES);
    if (!noteRaw) {
      console.warn('⚠️ Note схема не найдена');
      return;
    }
    const noteSchema = JSON.parse(noteRaw);

    // 2. Загружаем текущую reminder схему (сохраняем уникальные настройки)
    let reminderSettings = {};
    const remindRaw = localStorage.getItem(STORAGE_KEY_REMINDS);
    if (remindRaw) {
      try {
        const remindSchema = JSON.parse(remindRaw);
        // Сохраняем ТОЛЬКО те поля, которых нет в note схеме
        // (например, системные поля или уникальные настройки reminder)
        for (const key of Object.keys(remindSchema)) {
          if (!noteSchema[key] && key !== 'remind') {
            reminderSettings[key] = remindSchema[key];
          }
        }
        // console.log('📦 Сохранены уникальные настройки reminder:', Object.keys(reminderSettings));
        // eslint-disable-next-line no-unused-vars
      } catch (e) {
        console.warn('⚠️ Не удалось загрузить reminder схему для сохранения настроек');
      }
    }

    // 3. Собираем новую reminder схему
    const reminderSchema = {
      ...noteSchema,           // Все поля из note
      ...reminderSettings,     // Уникальные настройки reminder (если есть)
      remind: REMIND_FIELD     // Системное поле
    };

    // 1. Сохраняем в localStorage
    localStorage.setItem(STORAGE_KEY_REMINDS, JSON.stringify(reminderSchema));

    // 2. ОБНОВЛЯЕМ ЭКЗЕМПЛЯР В ПАМЯТИ!!!
    if (constructorReminder) {
      constructorReminder.schema = reminderSchema;
      // console.log('✅ Экземпляр constructorReminder обновлен в памяти');
    }

    // console.log('✅ Reminder схема пересобрана');

  } catch (e) {
    console.error('❌ Ошибка пересборки reminder:', e);
  }
}