// src/lib/utils/modalHelpers.js

/**
 * Открывает модалку с поддержкой кнопки "Назад"
 * @param {Function} openModal - функция, которая открывает модалку (устанавливает состояние в true)
 * @param {Function} closeModal - функция, которая закрывает модалку (устанавливает состояние в false)
 * @param {string} [stateKey='modal'] - ключ для state
 */
export function openModalWithBack(openModal, closeModal, stateKey = 'modal') {
  // Добавляем состояние в историю
  if (typeof window !== 'undefined' && window.history) {
    window.history.pushState({ [stateKey]: true }, '');
  }

  // Открываем модалку
  openModal();

  // Обработчик события "Назад"
  function handlePopState(event) {
    // Если состояние с модалкой отсутствует — закрываем
    if (!event.state || !event.state[stateKey]) {
      closeModal();
      // Удаляем обработчик после закрытия
      window.removeEventListener('popstate', handlePopState);
    }
  }

  // Добавляем обработчик
  window.addEventListener('popstate', handlePopState);
}