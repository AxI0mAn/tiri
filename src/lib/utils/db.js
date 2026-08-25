// src/lib/utils/db.js


const DB_NAME = 'LiveTiriDB';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('entries')) {
        const store = db.createObjectStore('entries', { keyPath: 'id' });

        // Индексы для мгновенного поиска по периодам
        store.createIndex('by_date', 'dateStr', { unique: false });
        store.createIndex('by_month', 'yearMonth', { unique: false });
        store.createIndex('by_type', 'type', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Сохранить или обновить карточку (Заметка / Напоминание)
export async function saveEntry(entry) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readwrite');
    const store = tx.objectStore('entries');

    // Формируем служебные поля времени для быстрых выборок
    const eventDate = new Date(entry.timestamp);
    const dateStr = eventDate.toISOString().split('T')[0]; // "2026-08-19"
    const yearMonth = dateStr.slice(0, 7);                // "2026-08"

    const record = {
      ...entry,
      dateStr,
      yearMonth,
      year: eventDate.getFullYear()
    };

    const req = store.put(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Получить все записи за конкретный день (по индексу)
export async function getEntriesByDate(dateStr, type = 'note') {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readonly');
    const store = tx.objectStore('entries');
    const index = store.index('by_date');
    const req = index.getAll(IDBKeyRange.only(dateStr));

    req.onsuccess = () => {
      const results = req.result.filter(item => item.type === type);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

// Получить все записи за месяц для аналитики периода
export async function getEntriesByMonth(yearMonth, type = 'note') {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readonly');
    const store = tx.objectStore('entries');
    const index = store.index('by_month');
    const req = index.getAll(IDBKeyRange.only(yearMonth));

    req.onsuccess = () => {
      const results = req.result.filter(item => item.type === type);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

// Очистить абсолютно все записи приложения из IndexedDB
export async function crashData() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readwrite');
    const store = tx.objectStore('entries');
    const req = store.clear();

    req.onsuccess = () => {
      console.log('[LiveTiriDB] Все данные успешно удалены.');
      resolve(true);
    };
    req.onerror = () => {
      console.error('[LiveTiriDB] Ошибка при сбросе данных:', req.error);
      reject(req.error);
    };
  });
}

