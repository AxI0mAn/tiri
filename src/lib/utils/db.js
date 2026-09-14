// src/lib/utils/db.js

import { formatDateISOLocal } from '$lib/utils/dateHelpers.js';

const DB_NAME = 'LiveTiriDB';
const DB_VERSION = 4;

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      const tx = request.transaction;

      // ===== entries =====
      if (!db.objectStoreNames.contains('entries')) {
        const store = db.createObjectStore('entries', { keyPath: 'id' });
        store.createIndex('by_date', 'dateStr', { unique: false });
        store.createIndex('by_month', 'yearMonth', { unique: false });
        store.createIndex('by_type', 'type', { unique: false });
      } else {
        // ✅ ДОБАВИТЬ by_type, если нет (для миграции с версии 3)
        const store = tx.objectStore('entries');
        if (!store.indexNames.contains('by_type')) {
          store.createIndex('by_type', 'type', { unique: false });
        }
      }

      // ===== report_day =====
      if (!db.objectStoreNames.contains('report_day')) {
        const store = db.createObjectStore('report_day', { keyPath: 'dateStr' });
        store.createIndex('by_month', 'yearMonth', { unique: false });
      }

      // ===== report_month =====
      if (!db.objectStoreNames.contains('report_month')) {
        db.createObjectStore('report_month', { keyPath: 'yearMonth' });
      }

      // ===== services =====
      if (!db.objectStoreNames.contains('services')) {
        const store = db.createObjectStore('services', { keyPath: 'id' });
        store.createIndex('by_date', 'dateStr', { unique: false });
        store.createIndex('by_type', 'type', { unique: false });
      }

      // ===== owner_booker =====
      if (!db.objectStoreNames.contains('owner_booker')) {
        const store = db.createObjectStore('owner_booker', { keyPath: 'id' });
        store.createIndex('by_date', 'dateStr', { unique: false });
        store.createIndex('by_month', 'yearMonth', { unique: false });
        store.createIndex('by_year', 'year', { unique: false });
        store.createIndex('by_type', 'type', { unique: false });
      }

      // ===== owner_worker =====
      if (!db.objectStoreNames.contains('owner_worker')) {
        const store = db.createObjectStore('owner_worker', { keyPath: 'id' });
        store.createIndex('by_date', 'dateStr', { unique: false });
        store.createIndex('by_month', 'yearMonth', { unique: false });
        store.createIndex('by_worker', 'master', { unique: false });
        store.createIndex('by_type', 'type', { unique: false });
      }

      // ===== other =====
      if (!db.objectStoreNames.contains('other')) {
        const store = db.createObjectStore('other', { keyPath: 'id' });
        store.createIndex('by_date', 'dateStr', { unique: false });
        store.createIndex('by_type', 'type', { unique: false });
        store.createIndex('by_parent', 'parentId', { unique: false });
        store.createIndex('by_parent_type', 'parentType', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Сохранить запись и отправить событие об успешном сохранении
 * @param {Object} entry - запись для сохранения
 * @returns {Promise<any>} - результат операции
 */
export async function saveEntry(entry) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readwrite');
    const store = tx.objectStore('entries');

    const eventDate = new Date(entry.timestamp);
    const dateStr = formatDateISOLocal(entry.timestamp);
    const yearMonth = dateStr.slice(0, 7);

    const record = {
      ...entry,
      type: entry.types || entry.type,
      dateStr,
      yearMonth,
      year: eventDate.getFullYear()
    };

    const req = store.put(record);

    req.onsuccess = () => {
      // Отправляем событие только в браузере
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('db:entry_saved', {
            detail: record,
            bubbles: false,
            cancelable: false
          })
        );
      }
      resolve(req.result);
    };

    req.onerror = () => {
      // Событие НЕ отправляется при ошибке
      reject(req.error);
    };
  });
}

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

/**
 * Получить все записи (заметки и напоминания) за конкретный день
 * @param {string} dateStr - дата в формате "YYYY-MM-DD"
 * @returns {Promise<Array>} - массив записей за указанный день
 */
export async function getAllThisDayRecords(dateStr) {
  // Валидация входного параметра
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.warn('[getAllThisDayRecords] Невалидный формат даты:', dateStr);
    return [];
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('entries', 'readonly');
      const store = tx.objectStore('entries');
      const index = store.index('by_date');
      const req = index.getAll(IDBKeyRange.only(dateStr));

      req.onsuccess = () => {
        // Возвращаем все записи (и note, и reminder) без фильтрации по типу
        resolve(req.result);
      };
      req.onerror = () => {
        console.error('[getAllThisDayRecords] Ошибка выборки:', req.error);
        reject(req.error);
      };
    });
  } catch (error) {
    console.error('[getAllThisDayRecords] Критическая ошибка:', error);
    return [];
  }
}

/**
 * Получить Z-отчет за конкретный день
 * @param {string} dateStr - дата в формате "YYYY-MM-DD"
 * @returns {Promise<Object|null>} - объект отчета или null
 */
export async function getReport_Z_date(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.warn('[getReport_Z_date] Невалидный формат даты:', dateStr);
    return null;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('report_day', 'readonly');
      const store = tx.objectStore('report_day');
      const req = store.get(dateStr);

      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => {
        console.error('[getReport_Z_date] Ошибка получения отчета:', req.error);
        reject(req.error);
      };
    });
  } catch (error) {
    console.error('[getReport_Z_date] Критическая ошибка:', error);
    return null;
  }
}

/**
 * Получить Z-отчет за конкретный месяц
 * @param {string} yearMonth - месяц в формате "YYYY-MM"
 * @returns {Promise<Object|null>} - объект отчета или null
 */
export async function getReport_Z_month(yearMonth) {
  if (typeof yearMonth !== 'string' || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    console.warn('[getReport_Z_month] Невалидный формат месяца:', yearMonth);
    return null;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('report_month', 'readonly');
      const store = tx.objectStore('report_month');
      const req = store.get(yearMonth);

      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => {
        console.error('[getReport_Z_month] Ошибка получения отчета:', req.error);
        reject(req.error);
      };
    });
  } catch (error) {
    console.error('[getReport_Z_month] Критическая ошибка:', error);
    return null;
  }
}

/**
 * Получить месячный отчёт по полному ключу (X или Z)
 * @param {string} key - "2026-09_X" или "2026-09_Z"
 * @returns {Promise<Object|null>} - объект отчета или null
 */
export async function getReport_month_byKey(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}_[XZ]$/.test(key)) {
    console.warn('[getReport_month_byKey] Невалидный ключ:', key);
    return null;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('report_month', 'readonly');
      const store = tx.objectStore('report_month');
      const req = store.get(key);

      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => {
        console.error('[getReport_month_byKey] Ошибка:', req.error);
        reject(req.error);
      };
    });
  } catch (error) {
    console.error('[getReport_month_byKey] Критическая ошибка:', error);
    return null;
  }
}

/**
 * Получить все Z-отчеты за конкретный год
 * @param {number|string} year - год (например, 2026)
 * @returns {Promise<Array>} - массив отчетов за год
 */
export async function getReport_Z_year(year) {
  const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;

  if (!Number.isInteger(yearNum) || yearNum < 2000 || yearNum > 2100) {
    console.warn('[getReport_Z_year] Невалидный год:', year);
    return [];
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('report_month', 'readonly');
      const store = tx.objectStore('report_month');

      // Получаем все ключи в хранилище
      const keysReq = store.getAllKeys();

      keysReq.onsuccess = () => {
        const allKeys = keysReq.result;
        const yearPrefix = String(yearNum);

        // Фильтруем ключи, начинающиеся с года
        const yearKeys = allKeys.filter(key =>
          typeof key === 'string' && key.startsWith(yearPrefix)
        );

        // Если нет ключей за год, возвращаем пустой массив
        if (yearKeys.length === 0) {
          resolve([]);
          return;
        }

        // Получаем все отчеты за год
        const reports = [];
        let completed = 0;

        if (yearKeys.length === 0) {
          resolve([]);
          return;
        }

        yearKeys.forEach((key) => {
          const getReq = store.get(key);
          getReq.onsuccess = () => {
            if (getReq.result) {
              reports.push(getReq.result);
            }
            completed++;
            if (completed === yearKeys.length) {
              // Сортируем по ключу (yearMonth)
              reports.sort((a, b) => (a.yearMonth || '').localeCompare(b.yearMonth || ''));
              resolve(reports);
            }
          };
          getReq.onerror = () => {
            console.error('[getReport_Z_year] Ошибка получения отчета для ключа:', key);
            completed++;
            if (completed === yearKeys.length) {
              resolve(reports);
            }
          };
        });
      };

      keysReq.onerror = () => {
        console.error('[getReport_Z_year] Ошибка получения ключей:', keysReq.error);
        reject(keysReq.error);
      };
    });
  } catch (error) {
    console.error('[getReport_Z_year] Критическая ошибка:', error);
    return [];
  }
}

/**
 * Сохраняет отчет в IndexedDB
 * @param {'day' | 'month'} type - тип отчета (дневной или месячный)
 * @param {string} key - ключ (dateStr для дня, yearMonth с префиксом для месяца)
 * @param {Object} data - данные отчета
 * @returns {Promise<void>}
 */
export async function saveReport(type, key, data) {
  try {
    const db = await openDB();

    const storeName = type === 'day' ? 'report_day' : 'report_month';

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      const record = {
        ...data,
        [type === 'day' ? 'dateStr' : 'yearMonth']: key
      };

      // Для дневных отчетов добавляем yearMonth для индекса
      if (type === 'day' && !record.yearMonth) {
        record.yearMonth = key.slice(0, 7);
      }

      const req = store.put(record);

      req.onsuccess = () => {
        console.log(`[saveReport] Отчет сохранен в ${storeName} по ключу ${key}`);
        resolve(req.result);
      };

      req.onerror = () => {
        console.error(`[saveReport] Ошибка сохранения в ${storeName}:`, req.error);
        reject(req.error);
      };
    });
  } catch (error) {
    console.error('[saveReport] Критическая ошибка:', error);
    throw error;
  }
}

/**
 * Получает все дневные отчеты за месяц из report_day
 * @param {string} yearMonth - месяц в формате "YYYY-MM"
 * @returns {Promise<Array>} - массив дневных отчетов
 */
export async function getReportsByMonth(yearMonth) {
  if (typeof yearMonth !== 'string' || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    console.warn('[getReportsByMonth] Невалидный формат месяца:', yearMonth);
    return [];
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('report_day', 'readonly');
      const store = tx.objectStore('report_day');
      const index = store.index('by_month');
      const req = index.getAll(IDBKeyRange.only(yearMonth));

      req.onsuccess = () => {
        resolve(req.result);
      };
      req.onerror = () => {
        console.error('[getReportsByMonth] Ошибка получения отчетов:', req.error);
        reject(req.error);
      };
    });
  } catch (error) {
    console.error('[getReportsByMonth] Критическая ошибка:', error);
    return [];
  }
}

/**
 * Экспортирует все данные из IndexedDB в объект
 * @returns {Promise<Object>} - { entries: [...], report_day: [...], report_month: [...] }
 */
export async function exportAllData() {
  const db = await openDB();
  const result = {};

  const storeNames = [
    'entries',
    'report_day',
    'report_month',
    'services',
    'owner_booker',
    'owner_worker',
    'other'
  ];

  for (const storeName of storeNames) {
    if (!db.objectStoreNames.contains(storeName)) continue;

    result[storeName] = await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  return result;
}

/**
 * Создаёт и скачивает JSON-файл с бэкапом
 * @returns {Promise<{ success: boolean, message: string, stats?: Object }>}
 */
export async function downloadBackup() {
  try {
    const data = await exportAllData();

    // Статистика
    const stats = {};
    for (const [storeName, records] of Object.entries(data)) {
      stats[storeName] = records.length;
    }

    // Формируем JSON
    const backup = {
      version: DB_VERSION,
      createdAt: new Date().toISOString(),
      stats,
      data
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    // Скачивание
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `tiri-backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: `Бэкап создан: ${Object.entries(stats).map(([k, v]) => `${k}: ${v}`).join(', ')}`,
      stats
    };
  } catch (error) {
    console.error('[downloadBackup] Ошибка:', error);
    return {
      success: false,
      message: `Ошибка создания бэкапа: ${error.message}`
    };
  }
}

/**
 * Восстанавливает данные из JSON-объекта бэкапа
 * @param {Object} backup - объект бэкапа (с полями version, data)
 * @returns {Promise<{ success: boolean, message: string, stats?: Object }>}
 */
export async function restoreFromBackup(backup) {
  try {
    // Валидация
    if (!backup || typeof backup !== 'object') {
      throw new Error('Невалидный формат бэкапа');
    }
    if (!backup.data || typeof backup.data !== 'object') {
      throw new Error('В бэкапе нет данных (поле "data")');
    }

    const db = await openDB();
    const stats = {};

    const storeNames = [
      'entries',
      'report_day',
      'report_month',
      'services',
      'owner_booker',
      'owner_worker',
      'other'
    ];

    for (const storeName of storeNames) {
      if (!backup.data[storeName]) continue;
      if (!db.objectStoreNames.contains(storeName)) {
        console.warn(`[restoreFromBackup] Хранилище ${storeName} отсутствует, пропускаем`);
        continue;
      }

      const records = backup.data[storeName];

      // Очищаем текущие данные
      await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Загружаем из бэкапа
      await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        let loaded = 0;

        if (records.length === 0) {
          resolve();
          return;
        }

        for (const record of records) {
          const req = store.put(record);
          req.onsuccess = () => {
            loaded++;
            if (loaded === records.length) resolve();
          };
          req.onerror = () => reject(req.error);
        }
      });

      stats[storeName] = records.length;
    }

    return {
      success: true,
      message: `Данные восстановлены: ${Object.entries(stats).map(([k, v]) => `${k}: ${v}`).join(', ')}`,
      stats
    };
  } catch (error) {
    console.error('[restoreFromBackup] Ошибка:', error);
    return {
      success: false,
      message: `Ошибка восстановления: ${error.message}`
    };
  }
}

/**
 * Удаляет запись из IndexedDB по id
 * @param {string} id - идентификатор записи
 * @returns {Promise<void>}
 */
export async function deleteEntry(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('entries', 'readwrite');
      const store = tx.objectStore('entries');
      const req = store.delete(id);

      req.onsuccess = () => {
        console.log(`[deleteEntry] Запись ${id} удалена`);
        resolve();
      };
      req.onerror = () => {
        console.error(`[deleteEntry] Ошибка удаления ${id}:`, req.error);
        reject(req.error);
      };
    });
  } catch (error) {
    console.error('[deleteEntry] Критическая ошибка:', error);
    throw error;
  }
}

/**
 * Удаляет отчёт из хранилища report_day или report_month
 * @param {'day' | 'month'} type - тип отчёта
 * @param {string} key - ключ (dateStr для дня, yearMonth для месяца)
 * @returns {Promise<boolean>} - true если удалён, false если не найден
 */
export async function deleteReport(type, key) {
  try {
    const db = await openDB();
    const storeName = type === 'day' ? 'report_day' : 'report_month';

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      // Сначала проверяем, существует ли запись
      const getReq = store.get(key);
      getReq.onsuccess = () => {
        if (!getReq.result) {
          console.log(`[deleteReport] Отчёт ${type} по ключу ${key} не найден`);
          resolve(false);
          return;
        }

        // Удаляем
        const deleteReq = store.delete(key);
        deleteReq.onsuccess = () => {
          console.log(`[deleteReport] Отчёт ${type} по ключу ${key} удалён`);
          resolve(true);
        };
        deleteReq.onerror = () => {
          console.error(`[deleteReport] Ошибка удаления ${key}:`, deleteReq.error);
          reject(deleteReq.error);
        };
      };
      getReq.onerror = () => {
        console.error(`[deleteReport] Ошибка проверки ${key}:`, getReq.error);
        reject(getReq.error);
      };
    });
  } catch (error) {
    console.error('[deleteReport] Критическая ошибка:', error);
    throw error;
  }
}

/**
 * Получить все ключи дневных отчётов (dateStr)
 * @returns {Promise<string[]>} - отсортированный массив ["2026-09-13", ...]
 */
export async function getAllReportKeysDay() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('report_day', 'readonly');
      const store = tx.objectStore('report_day');
      const req = store.getAllKeys();

      req.onsuccess = () => {
        // Сортируем: новые сверху
        const keys = req.result.sort().reverse();
        resolve(keys);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('[getAllReportKeysDay] Ошибка:', error);
    return [];
  }
}

/**
 * Получить все ключи месячных отчётов (yearMonth)
 * @returns {Promise<string[]>} - отсортированный массив ["2026-09_X", "2026-09_Z", ...]
 */
export async function getAllReportKeysMonth() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('report_month', 'readonly');
      const store = tx.objectStore('report_month');
      const req = store.getAllKeys();

      req.onsuccess = () => {
        // Сортируем: новые сверху
        const keys = req.result.sort().reverse();
        resolve(keys);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('[getAllReportKeysMonth] Ошибка:', error);
    return [];
  }
}

// ===== SERVICES (рецепты, alarm, achievement) =====

/**
 * Сохранить запись в services
 * @param {Object} entry - запись
 * @returns {Promise<any>}
 */
export async function saveService(entry) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('services', 'readwrite');
    const store = tx.objectStore('services');
    const req = store.put(entry);

    req.onsuccess = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('db:service_saved', { detail: entry }));
      }
      resolve(req.result);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Получить все записи типа 'recipe'
 * @returns {Promise<Array>}
 */
export async function getAllRecipes() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('services', 'readonly');
      const store = tx.objectStore('services');
      const index = store.index('by_type');
      const req = index.getAll(IDBKeyRange.only('recipe'));

      req.onsuccess = () => {
        // Сортировка: dateStr (новые сверху), при равенстве — timestamp (новые сверху)
        const sorted = req.result.sort((a, b) => {
          const dateCompare = (b.dateStr || '').localeCompare(a.dateStr || '');
          if (dateCompare !== 0) return dateCompare;
          return (b.timestamp || 0) - (a.timestamp || 0);
        });
        resolve(sorted);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('[getAllRecipes] Ошибка:', error);
    return [];
  }
}

/**
 * Получить запись из services по id
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getServiceById(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('services', 'readonly');
      const store = tx.objectStore('services');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('[getServiceById] Ошибка:', error);
    return null;
  }
}

/**
 * Удалить запись из services по id
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteService(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('services', 'readwrite');
      const store = tx.objectStore('services');
      const req = store.delete(id);
      req.onsuccess = () => {
        console.log(`[deleteService] Запись ${id} удалена`);
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('[deleteService] Ошибка:', error);
    throw error;
  }
}

/**
 * Полностью очищает все данные приложения из IndexedDB
 * Удаляет: entries, report_day, report_month, services, owner_booker, owner_worker, other
 * @returns {Promise<boolean>}
 */
export async function crashData() {
  try {
    const db = await openDB();
    const storeNames = [
      'entries',
      'report_day',
      'report_month',
      'services',
      'owner_booker',
      'owner_worker',
      'other'
    ];

    for (const storeName of storeNames) {
      if (db.objectStoreNames.contains(storeName)) {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        await new Promise((resolve, reject) => {
          const req = store.clear();
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });

        console.log(`[crashData] Хранилище ${storeName} очищено`);
      }
    }

    console.log('[crashData] Все данные успешно удалены');
    return true;
  } catch (error) {
    console.error('[crashData] Ошибка при сбросе данных:', error);
    return false;
  }
}

// === -📝=TODO=📝- ===
// ВРЕМЕННО: для ручного тестирования (удалить после проверки)
// if (typeof window !== 'undefined') {
//   // @ts-ignore
//   window.testEvaluate = function (expr) {
//     try {
//       const result = getAllThisDayRecords(expr);
//       return result;
//     } catch (e) {
//       console.error('Ошибка:', e.message);
//       return null;
//     }
//   };
// }
