// src/lib/components/services/recipeService.js

/**
 * Отправка рецепта через Web Share API
 * @param {string} title - заголовок рецепта
 * @param {string} message - текст рецепта
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function shareRecipe(title, message) {
  // 1. Проверка интернета
  if (!navigator.onLine) {
    return { success: false, message: 'Нет сети. Попробуйте позже.' };
  }

  // 2. Проверка Web Share API
  if (!navigator.share) {
    return { success: false, message: 'Отправка недоступна на этом устройстве' };
  }

  // 3. Формирование текста
  const text = `${title}\n\n${message}`;

  try {
    await navigator.share({ title, text });
    return { success: true, message: 'Рецепт отправлен!' };
  } catch (error) {
    if (error.name === 'AbortError' || error.message?.includes('abort')) {
      return { success: false, message: 'Отправка отменена' };
    }
    console.error('[shareRecipe] Ошибка:', error);
    return { success: false, message: 'Ошибка при отправке' };
  }
}