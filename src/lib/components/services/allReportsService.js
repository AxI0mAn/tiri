// src/lib/services/allReportsService.js

/**
 * Сгруппировать дневные отчёты по месяцам
 * @param {string[]} keys - ['2026-09-13', '2026-09-12', '2026-08-31', ...]
 * @returns {Array<{ yearMonth: string, days: string[] }>}
 *   [{ yearMonth: '2026-09', days: ['2026-09-13', '2026-09-12'] }, ...]
 */
export function groupDayReportsByMonth(keys) {
  const map = {};
  for (const dateStr of keys) {
    const yearMonth = dateStr.slice(0, 7);
    if (!map[yearMonth]) map[yearMonth] = [];
    map[yearMonth].push(dateStr);
  }
  // Сортируем месяцы: новые сверху
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([yearMonth, days]) => ({ yearMonth, days }));
}