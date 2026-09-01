// src/lib/store/toastStore.svelte.js 

/**
 * Глобальное состояние для уведомлений (Toast)
 */
class ToastStore {
  /** @type {boolean} */
  visible = $state(false);

  /** @type {string} */
  message = $state('');

  /** @type {'success' | 'error' | 'info' | 'warning'} */
  type = $state('info');

  /**
   * Показать уведомление
   * @param {string} message - текст уведомления
   * @param {'success' | 'error' | 'info' | 'warning'} type - тип уведомления
   */
  show(message, type = 'info') {
    this.message = message;
    this.type = type;
    this.visible = true;
  }

  /** Скрыть уведомление */
  hide() {
    this.visible = false;
  }
}

export const toastStore = new ToastStore();