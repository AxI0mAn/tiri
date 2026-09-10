// src/lib/services/scheduleService.js
// Работа с расписанием (рабочие дни)

/**
 * Получить рабочие дни за месяц
 * @param {Object} workDays - объект расписания { "2026-07": [1, 2, 5], ... }
 * @param {string} yearMonth - "YYYY-MM"
 * @returns {number[]} - массив дней месяца
 */
export function getWorkDays(workDays, yearMonth) {
  return workDays?.[yearMonth] || [];
}

/**
 * Переключить рабочий день (добавить/убрать)
 * @param {Object} workDays - объект расписания
 * @param {string} yearMonth - "YYYY-MM"
 * @param {number} day - день месяца
 * @returns {Object} - новый объект расписания
 */
export function toggleWorkDay(workDays, yearMonth, day) {
  const days = workDays?.[yearMonth] || [];
  const index = days.indexOf(day);

  if (index === -1) {
    // ✅ Добавляем без дубликатов + сортировка
    const uniqueDays = [...new Set([...days, day])].sort((a, b) => a - b);
    return {
      ...workDays,
      [yearMonth]: uniqueDays
    };
  }

  // Удаляем
  return {
    ...workDays,
    [yearMonth]: days.filter((d) => d !== day)
  };
}

/**
 * Проверить, рабочий ли день
 * @param {Object} workDays - объект расписания
 * @param {string} yearMonth - "YYYY-MM"
 * @param {number} day - день месяца
 * @returns {boolean}
 */
export function isWorkDay(workDays, yearMonth, day) {
  return (workDays?.[yearMonth] || []).includes(day);
}