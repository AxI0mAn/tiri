// src/lib/services/reportGuard.js

import { getReport_Z_date, getAllThisDayRecords } from '$lib/utils/db.js';
import { getTodayDate } from '$lib/utils/dateHelpers.js';

/**
 * Проверяет, есть ли Z-отчет за указанную дату
 * @param {string} dateStr - дата в формате "YYYY-MM-DD"
 * @returns {Promise<boolean>}
 */
export async function hasZReport(dateStr) {
  const report = await getReport_Z_date(dateStr);
  return !!report;
}

/**
 * Проверяет, можно ли редактировать заметку
 * Правила:
 * - Редактировать можно ТОЛЬКО заметки за СЕГОДНЯ
 * - И только если НЕТ Z-отчета за сегодня
 * - Напоминания можно редактировать ВСЕГДА
 * @param {Object} entry - запись (заметка или напоминание)
 * @param {string} dateStr - дата записи
 * @returns {Promise<boolean>}
 */
export async function canEditEntry(entry, dateStr) {
  const isReminder = entry.types === 'reminder' || entry.type === 'reminder';
  if (isReminder) return true; // Напоминания можно редактировать всегда

  const today = getTodayDate();
  if (dateStr !== today) return false; // Заметки НЕ сегодняшнего дня — нельзя

  const report = await getReport_Z_date(today);
  return !report; // Можно только если нет Z-отчета за сегодня
}

/**
 * Проверяет, можно ли добавить новую заметку (newNote) за сегодня
 * @param {string} dateStr - дата в формате "YYYY-MM-DD"
 * @returns {Promise<boolean>}
 */
export async function canAddNote(dateStr) {
  // === -📝=TODO=📝- 3у сентября=== убери return  и раскоментируй ниже
  return true; // Временно — всегда можно
  // === -📝=TODO=📝- 3у сентября===
  /*
  const today = getTodayDate();
  if (dateStr !== today) return false; // Только сегодня

  const report = await getReport_Z_date(today);
  return !report; // Можно только если нет Z-отчета за сегодня
  */
}

/**
 * Проверяет, можно ли добавить новое напоминание (newReminder) за сегодня
 * @param {string} dateStr - дата в формате "YYYY-MM-DD"
 * @returns {Promise<boolean>}
 */
export async function canAddReminder(dateStr) {
  const today = getTodayDate();
  if (dateStr !== today) return false; // Только сегодня
  return true; // Напоминания можно добавлять всегда
}

/**
 * Проверяет, можно ли создать Z-отчет за сегодня
 * - Нельзя если уже есть Z-отчет
 * - Нельзя если есть напоминания за сегодня
 * @param {string} dateStr - дата в формате "YYYY-MM-DD"
 * @returns {Promise<{ allowed: boolean, reason: string | null }>}
 */
export async function canCreateZReport(dateStr) {
  const today = getTodayDate();
  if (dateStr !== today) {
    return { allowed: false, reason: 'Z-отчет можно создать только за сегодня' };
  }

  const report = await getReport_Z_date(today);
  if (report) {
    return { allowed: false, reason: 'Z-отчет за сегодня уже существует' };
  }

  const records = await getAllThisDayRecords(today);
  const hasReminders = records.some(r => r.types === 'reminder' || r.type === 'reminder');

  if (hasReminders) {
    return { allowed: false, reason: 'Есть напоминания. Перенесите или удалите их.' };
  }

  return { allowed: true, reason: null };
}

/**
 * Проверяет, можно ли выполнить напоминание (превратить в заметку)
 * - Нельзя если есть Z-отчет за сегодня
 * @param {string} dateStr - дата в формате "YYYY-MM-DD"
 * @returns {Promise<boolean>}
 */
export async function canCompleteReminder(dateStr) {
  const today = getTodayDate();
  if (dateStr !== today) return true; // Не сегодня — можно

  const report = await getReport_Z_date(today);
  return !report; // Можно только если нет Z-отчета за сегодня
}