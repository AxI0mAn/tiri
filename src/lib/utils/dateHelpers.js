// src/lib/utils/dateHelpers.js

/**
 * Форматирует дату в строку "YYYY-MM-DD" (локальное время)
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
 * Форматирует timestamp в время ЧЧ:ММ (локальное время)
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
 * Форматирует timestamp в дату "DD.MM.YYYY" (локальное время)
 * @param {number} timestamp - метка времени в миллисекундах
 * @returns {string} - дата в формате "DD.MM.YYYY"
 */
export function formatDateFromTimestamp(timestamp) {
  if (!timestamp) return '--.--.----';
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Форматирует timestamp в дату "YYYY-MM-DD" (локальное время)
 * @param {number} timestamp - метка времени в миллисекундах
 * @returns {string} - дата в формате "YYYY-MM-DD"
 */
export function formatDateISOLocal(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return formatDate(date);
}

/**
 * Возвращает текущую дату в формате "YYYY-MM-DD" (локальное время)
 * @returns {string} - сегодняшняя дата
 */
export function getTodayDate() {
  return formatDate(new Date());
}

/**
 * Возвращает дату со смещением (локальное время)
 * @param {string} dateStr - исходная дата "YYYY-MM-DD"
 * @param {number} offset - смещение в днях
 * @returns {string} - новая дата в формате "YYYY-MM-DD"
 */
export function getDateOffset(dateStr, offset) {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + offset);
  return formatDate(date);
}

/**
 * Создает timestamp из локальных даты и времени
 * @param {string} dateStr - дата в формате "YYYY-MM-DD"
 * @param {string} timeStr - время в формате "HH:MM"
 * @returns {number} - timestamp в миллисекундах
 */
export function createLocalTimestamp(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  // ✅ Создаем timestamp в ЛОКАЛЬНОМ времени
  return new Date(year, month - 1, day, hours, minutes).getTime();
}

/**
 * Форматирует дату в строку "YYYY.MM.DD" (локальное время)
 * @param {Date} date - объект даты
 * @returns {string} - дата в формате "YYYY.MM.DD"
 */
export function formatDateDotted(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

/**
 * Форматирует дату в строку "YYYY.MM.DD" из timestamp (локальное время)
 * @param {number} timestamp - метка времени в миллисекундах
 * @returns {string} - дата в формате "YYYY.MM.DD"
 */
export function formatDateDottedFromTimestamp(timestamp) {
  if (!timestamp) return '....';
  return formatDateDotted(new Date(timestamp));
}

/**
 * Возвращает текущую дату и время в формате ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
 * @param {Date} [date] - опционально, дата для форматирования
 * @returns {string} - строка в формате ISO
 */
export function getCurrentISODate(date) {
  const d = date || new Date();
  return d.toISOString();
}