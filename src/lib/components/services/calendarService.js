// src/lib/services/calendarService.js
// Загрузка данных для календаря (окраска дней)

import { getReportsByMonth, getEntriesByMonth } from '$lib/utils/db.js';

/**
 * Загрузить данные для окраски дней месяца
 * @param {string} yearMonth - "YYYY-MM"
 * @returns {Promise<Object.<string, { hasReport: boolean, hasReminder: boolean }>>}
 */
export async function loadMonthCalendarData(yearMonth) {
  if (typeof yearMonth !== 'string' || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    console.warn('[loadMonthCalendarData] Невалидный формат месяца:', yearMonth);
    return {};
  }

  /** @type {Object.<string, { hasReport: boolean, hasReminder: boolean }>} */
  const daysMap = {};  // ← явный тип

  try {
    // 1. Загружаем Z-отчёты за месяц
    const reports = await getReportsByMonth(yearMonth);
    for (const report of reports) {
      // ✅ Пропускаем пустые отчёты (если они есть)
      if (!report?.dateStr) continue;

      // Проверяем, что отчёт не «пустой» (не все нули)
      const hasRealData = report.payments &&
        Object.values(report.payments).some(v => v > 0);

      if (hasRealData) {
        if (!daysMap[report.dateStr]) {
          daysMap[report.dateStr] = { hasReport: false, hasReminder: false };
        }
        daysMap[report.dateStr].hasReport = true;
      }
    }

    // 2. Загружаем напоминания за месяц
    const reminders = await getEntriesByMonth(yearMonth, 'reminder');
    for (const reminder of reminders) {
      if (!reminder?.dateStr) continue;

      if (!daysMap[reminder.dateStr]) {
        daysMap[reminder.dateStr] = { hasReport: false, hasReminder: false };
      }
      daysMap[reminder.dateStr].hasReminder = true;
    }

    console.log(`[loadMonthCalendarData] ${yearMonth}: ${reports.length} отчётов, ${reminders.length} напоминаний`);
    return daysMap;
  } catch (error) {
    console.error('[loadMonthCalendarData] Ошибка:', error);
    return {};
  }
}