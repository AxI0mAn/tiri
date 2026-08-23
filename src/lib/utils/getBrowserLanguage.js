// src/lib/utils/getBrowserLanguage.js
// проверяет язык системы/браузера и сопоставляет его с вашими поддерживаемыми кодами

import { appStore } from "$lib/store/appStore.svelte";

/**
 * Определяет язык браузера на основе списка поддерживаемых опций
 * @param {Array<{value: string, label: string}>} options 
 * @param {string} [fallback='EN'] 
 * @returns {string}
 */
export function getBrowserLanguage(options = appStore.langOptions, fallback = 'EN') {
  if (typeof window === 'undefined' || !navigator) return fallback;

  // Извлекаем поддерживаемые коды (['RU', 'EN', 'UA', 'PT', 'ES'])
  const supportedLangs = options.map((opt) => opt.value);

  // Собираем языки пользователя из браузера
  const userLangs = navigator.languages || [navigator.language || ''];

  for (const lang of userLangs) {
    if (!lang) continue;

    let code = lang.slice(0, 2).toUpperCase();
    if (code === 'UK') code = 'UA'; // Корректировка для украинского языка (uk -> UA)

    if (supportedLangs.includes(code)) {
      return code;
    }
  }

  return fallback;
}