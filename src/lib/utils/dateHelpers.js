// src/lib/utils/dateHelpers.js

/**
 * Форматирует дату в строку "YYYY-MM-DD"
 * @param {Date} date - объект даты
 * @returns {string} - дата в формате "YYYY-MM-DD"
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Возвращает сегодняшнюю дату в формате "YYYY-MM-DD"
 * @returns {string} - сегодняшняя дата
 */
export function getTodayDate() {
  return formatDate(new Date());
}

/**
 * Возвращает дату со смещением
 * @param {string} dateStr - исходная дата "YYYY-MM-DD"
 * @param {number} offset - смещение в днях (отрицательное = в прошлое)
 * @returns {string} - новая дата в формате "YYYY-MM-DD"
 */
export function getDateOffset(dateStr, offset) {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + offset);
  return formatDate(date);
}

/**
 * Форматирует timestamp в время ЧЧ:ММ
 * @param {number} timestamp - метка времени в миллисекундах
 * @returns {string} - время в формате "ЧЧ:ММ"
 */
export function formatTime(timestamp) {
  if (!timestamp) return '--:--';
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Возвращает текущую дату и время в формате ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
 * @returns {string}
 * // console.log(getCurrentISODate()); 
 * // Пример вывода: "2026-05-08T14:54:13.000Z"
 */

export function getCurrentISODate() {
  return new Date().toISOString();
}

