// src/lib/services/reportGenerator.js

// Импорты существующих функций
import {
  getAllThisDayRecords,
  getReport_Z_date,
  getReportsByMonth
} from '$lib/utils/db.js';

import { CalculationsDay } from '$lib/components/services/calculationsOneDay.js';
import { CalculationsPeriod } from '$lib/components/services/calculationsPeriod.js';

import { appStore } from '$lib/store/appStore.svelte.js';

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

/**
 * Построить список дат между start и end (включительно)
 * @param {string} start - "YYYY-MM-DD"
 * @param {string} end - "YYYY-MM-DD"
 * @param {'forward' | 'backward'} direction
 * @returns {string[]}
 */
function buildDatesList(start, end, direction = 'forward') {
  const dates = [];
  const startDate = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');

  if (direction === 'forward') {
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(formatDate(d));
    }
  } else {
    for (let d = new Date(endDate); d >= startDate; d.setDate(d.getDate() - 1)) {
      dates.push(formatDate(d));
    }
  }
  return dates;
}

/**
 * Форматировать Date в "YYYY-MM-DD"
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Проверить, есть ли Z-отчёт за день
 */
async function hasReport(dateStr) {
  const report = await getReport_Z_date(dateStr);
  return !!report;
}

/**
 * Классифицировать день: создать отчёт или пропустить
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {Promise<{ action: 'create' | 'skip-no-notes' | 'skip-has-reminders' | 'skip-exists', records: Array }>}
 */
async function classifyDay(dateStr) {
  // 1. Уже есть Z-отчёт?
  if (await hasReport(dateStr)) {
    return { action: 'skip-exists', records: [] };
  }

  // 2. Загружаем записи
  const records = await getAllThisDayRecords(dateStr);
  const notes = records.filter(r => r.type === 'note' || r.types === 'note');
  const reminders = records.filter(r => r.type === 'reminder' || r.types === 'reminder');

  // 3. Нет заметок?
  if (notes.length === 0) {
    return { action: 'skip-no-notes', records };
  }

  // 4. Есть напоминания?
  if (reminders.length > 0) {
    return { action: 'skip-has-reminders', records };
  }

  // 5. Можно создавать
  return { action: 'create', records };
}

// ===== ОСНОВНЫЕ ФУНКЦИИ =====

/**
 * Создать все Z-отчёты за период (универсальная функция)
 * @param {Object} options
 * @param {string} options.startDate - "YYYY-MM-DD"
 * @param {string} options.endDate - "YYYY-MM-DD"
 * @param {'forward' | 'backward'} [options.direction='forward']
 * @param {Function} [options.onProgress] - колбэк прогресса (current, total, dateStr)
 * @param {Function} [options.onLog] - колбэк логов (message, isError)
 * @param {Function} [options.shouldStop] - колбэк проверки прерывания (возвращает boolean)
 * @param {boolean} [options.createMonthly=true] - создавать ли месячные отчёты
 * @returns {Promise<Object>} - статистика { created, skippedNoNotes, skippedHasReminders, skippedExists, errors, months }
 */
export async function createReportsInRange(options) {
  const {
    startDate,
    endDate,
    direction = 'forward',
    onProgress = () => { },
    onLog = () => { },
    shouldStop = () => false,
    createMonthly = true
  } = options;

  // Сохраняем в appStore для восстановления после прерывания
  appStore.processFrom = startDate;
  appStore.processTo = endDate;
  appStore.isProcessingReports = true;

  const dates = buildDatesList(startDate, endDate, direction);
  const stats = {
    created: 0,
    skippedNoNotes: 0,
    skippedHasReminders: 0,
    skippedExists: 0,
    errors: 0,
    problemDays: [], // дни с напоминаниями
    months: new Set()
  };

  let processed = 0;

  for (const dateStr of dates) {
    // ✅ Проверка прерывания
    if (shouldStop()) {
      onLog('🛑 Процесс прерван пользователем', true);
      break;
    }

    // ✅ Завершаем текущий день перед остановкой
    try {
      const { action, records } = await classifyDay(dateStr);

      switch (action) {
        case 'create': {
          const calc = new CalculationsDay(records);
          await calc.saveReport_Z(dateStr);
          stats.created++;
          stats.months.add(dateStr.slice(0, 7));
          break;
        }
        case 'skip-no-notes':
          stats.skippedNoNotes++;
          break;
        case 'skip-has-reminders':
          stats.skippedHasReminders++;
          stats.problemDays.push(dateStr);
          break;
        case 'skip-exists':
          stats.skippedExists++;
          break;
      }

      // ✅ Сохраняем последнюю обработанную дату
      appStore.lastProcessedDate = dateStr;
    } catch (err) {
      stats.errors++;
      onLog(`❌ Ошибка за ${dateStr}: ${err.message}`, true);
    }

    processed++;
    onProgress(processed, dates.length, dateStr, 'Дневные Z-отчёты');

    // ✅ Даём браузеру обновить UI
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // ===== МЕСЯЧНЫЕ ОТЧЁТЫ =====
  if (createMonthly && stats.months.size > 0 && !shouldStop()) {
    const monthsArray = [...stats.months];
    let monthsProcessed = 0;

    onProgress(0, monthsArray.length, '', 'Месячные X/Z-отчёты');
    onLog(`📊 Создаём месячные отчёты для ${monthsArray.length} месяцев...`);

    for (const yearMonth of monthsArray) {
      if (shouldStop()) break;

      try {
        const dayReports = await getReportsByMonth(yearMonth);
        if (dayReports.length === 0) {
          onLog(`⚠️ За ${yearMonth} нет дневных отчётов`, true);
          monthsProcessed++;
          onProgress(monthsProcessed, monthsArray.length, yearMonth, 'Месячные X/Z-отчёты');
          await new Promise((resolve) => setTimeout(resolve, 0));
          continue;
        }

        const period = new CalculationsPeriod(yearMonth);
        await period.generateAndSaveMonthReports(dayReports);
        monthsProcessed++;
        onProgress(monthsProcessed, monthsArray.length, yearMonth, 'Месячные X/Z-отчёты');
        onLog(`✅ X- и Z-отчёты за ${yearMonth} созданы`);
      } catch (err) {
        stats.errors++;
        onLog(`❌ Ошибка за ${yearMonth}: ${err.message}`, true);
      }

      // ✅ Одна пауза в конце итерации
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // ===== ЗАВЕРШЕНИЕ =====
  appStore.isProcessingReports = false;
  appStore.processFrom = '';
  appStore.processTo = '';

  return stats;
}

/**
 * Автоматическое создание дневных Z-отчётов в обратном порядке
 * Останавливается при обнаружении дня с Z-отчётом или при достижении firstInput
 * @param {Object} options
 * @param {string} options.startFrom - "YYYY-MM-DD" (обычно вчера)
 * @param {Function} [options.onLog]
 * @param {Function} [options.shouldStop]
 * @returns {Promise<Object>} - статистика
 */
export async function createDailyReportsBackward(options) {
  const {
    startFrom,
    onLog = () => { },
    shouldStop = () => false
  } = options;

  const stats = {
    created: 0,
    skippedNoNotes: 0,
    skippedHasReminders: 0,
    errors: 0,
    problemDays: [],
    months: new Set(),
    stoppedAt: null,
    stopReason: null
  };

  // ✅ Получаем firstInput из appStore (формат YYYY.MM.DD → YYYY-MM-DD)
  let stopDate = null;
  if (appStore.firstInput && typeof appStore.firstInput === 'string') {
    stopDate = appStore.firstInput.replace(/\./g, '-');
  }

  // Идём назад от startFrom
  const currentDate = new Date(startFrom + 'T00:00:00');
  const stopDateObj = stopDate ? new Date(stopDate + 'T00:00:00') : null;

  while (true) {
    if (shouldStop()) {
      onLog('🛑 Процесс прерван пользователем', true);
      break;
    }

    const dateStr = formatDate(currentDate);

    // ✅ Проверка: дошли до firstInput?
    if (stopDateObj && currentDate < stopDateObj) {
      stats.stopReason = 'firstInput';
      stats.stoppedAt = dateStr;
      onLog(`⏹️ Дошли до даты первой записи (${dateStr}), останавливаем поиск`);
      break;
    }

    // ✅ Проверка: есть Z-отчёт?
    if (await hasReport(dateStr)) {
      stats.stopReason = 'hasReport';
      stats.stoppedAt = dateStr;
      onLog(`⏹️ Найден Z-отчёт за ${dateStr}, останавливаем поиск`);
      break;
    }

    // ✅ Обработка дня
    try {
      const { action, records } = await classifyDay(dateStr);

      switch (action) {
        case 'create': {
          const calc = new CalculationsDay(records);
          await calc.saveReport_Z(dateStr);
          stats.created++;
          stats.months.add(dateStr.slice(0, 7));
          break;
        }
        case 'skip-no-notes':
          stats.skippedNoNotes++;
          break;
        case 'skip-has-reminders':
          stats.skippedHasReminders++;
          stats.problemDays.push(dateStr);
          break;
        case 'skip-exists':
          // Не должно случиться, т.к. проверка выше
          break;
      }
    } catch (err) {
      stats.errors++;
      onLog(`❌ Ошибка за ${dateStr}: ${err.message}`, true);
    }

    // Идём назад
    currentDate.setDate(currentDate.getDate() - 1);

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Месячные отчёты (для затронутых месяцев)
  if (stats.months.size > 0) {
    onLog(`📊 Создаём месячные отчёты для ${stats.months.size} месяцев...`);
    for (const yearMonth of stats.months) {
      try {
        const dayReports = await getReportsByMonth(yearMonth);
        if (dayReports.length === 0) continue;

        const period = new CalculationsPeriod(yearMonth);
        await period.generateAndSaveMonthReports(dayReports);
        onLog(`✅ X- и Z-отчёты за ${yearMonth} созданы`);
      } catch (err) {
        stats.errors++;
        onLog(`❌ Ошибка за ${yearMonth}: ${err.message}`, true);
      }
    }
  }

  return stats;
}