// src/routes/(date)/stickers/stores/stickersStore.svelte.js 
import { getTodayDate } from '$lib/utils/dateHelpers.js';

// Палитра цветов для стикеров (по датам)
const COLOR_PALETTE = [
  'rgb(246, 250, 252)',
  'rgb(126, 231, 229)',
  'rgb(255, 230, 238)',
  'rgb(134, 237, 242)'
];

/**
 * Получить цвет для даты (стабильный, одинаковый для одной даты)
 */
function getColorForDate(dateStr) {
  const hash = dateStr.split('-').join('');
  const index = parseInt(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

/**
 * Загрузить все стикеры из IndexedDB
 */
export async function loadAllStickers() {
  try {
    const db = await new Promise((resolve) => {
      const req = indexedDB.open('LiveTiriDB', 3);
      req.onsuccess = () => resolve(req.result);
    });

    const tx = db.transaction('entries', 'readonly');
    const store = tx.objectStore('entries');

    const allRecords = await new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
    });

    // ✅ Фильтруем: только записи с заполненным value.notes.text
    const stickers = allRecords
      .filter(record => {
        const text = record.value?.notes?.text;
        return text && text.trim().length > 0;
      })
      .map(record => ({
        id: record.id,
        dateStr: record.dateStr,
        name: record.value?.notes?.name || '',
        phone: record.value?.notes?.phone || '',
        text: record.value?.notes?.text || '',
        type: record.type || record.types || 'note',
        timestamp: record.timestamp,
        color: getColorForDate(record.dateStr)
      }))
      .sort((a, b) => {
        // Сортировка по дате: сегодняшние вверху
        const today = getTodayDate();
        const aIsToday = a.dateStr === today;
        const bIsToday = b.dateStr === today;
        if (aIsToday && !bIsToday) return -1;
        if (!aIsToday && bIsToday) return 1;
        return b.dateStr.localeCompare(a.dateStr); // новые сверху
      });

    console.log('[stickersStore] Загружено стикеров:', stickers.length);
    return stickers;
  } catch (error) {
    console.error('[stickersStore] Ошибка загрузки:', error);
    return [];
  }
}

/**
 * Фильтрация стикеров
 */
export function filterStickers(stickers, filters) {
  const { dateFrom, dateTo, search } = filters;

  return stickers.filter(sticker => {
    // Фильтр по диапазону дат
    if (dateFrom && sticker.dateStr < dateFrom) return false;
    if (dateTo && sticker.dateStr > dateTo) return false;

    // Живой поиск (по name или phone)
    if (search && search.trim().length > 0) {
      const query = search.trim().toLowerCase();
      const nameMatch = sticker.name.toLowerCase().includes(query);
      const phoneMatch = sticker.phone.toLowerCase().includes(query);
      if (!nameMatch && !phoneMatch) return false;
    }

    return true;
  });
}