/**
 * src/lib/store/appState.svelte.js - текущее состояние приложения
 */
import { openModalWithBack } from "$lib/utils/modalHelpers";

class AppState {
  /** @type {string} */
  now_mode = $state('tiri');        // Текущий режим приложения: 'tiri' | 'z_report' | 'edit' | 'calendar'. Определяет, какая страница/режим сейчас активны: 'tiri' (главный), 'z_report' (страница Z-отчета), 'edit' (форма редактирования), 'calendar' (календарь). Используется для навигации и условного рендеринга.

  /** @type {string} */
  now_date = $state('');            // Текущая выбранная дата для отчетов и навигации. Хранит дату, с которой работает пользователь (например, для Z-отчета). Позволяет синхронизировать состояние между компонентами.

  /** @type {string|null} */
  editEntryId = $state(null);       // ID редактируемой записи (для перехода в форму редактирования). Идентификатор записи, которую пользователь редактирует. Используется при переходе на страницу редактирования для загрузки данных.

  /** @type {string|null} */
  editEntryDate = $state(null);     // Дата редактируемой записи (для возврата на страницу дня). Дата редактируемой записи. Нужна для возврата на страницу дня после сохранения/отмены редактирования.

  /** @type {boolean} */
  modal_xReportDay = $state(false);  // Модалка с Х-отчётом за день. true - открыта и false - закрыта.

  /** @type {string} */
  modal_xReportDate = $state('');  // строка с датой, для которой открывается модалка X-отчета.

  /** @type {boolean} */
  modal_zReportSaved = $state(false);  // флаг для модалки сохранения z-отчёта

  /** @type {Function} */
  onSendZReport = $state(() => {
    console.log('[appState] onSendZReport не переопределен');
  });

  setMode(mode) {
    this.now_mode = mode;
  }

  setDate(date) {
    this.now_date = date;
  }

  // ✅ X-отчет — с поддержкой кнопки "Назад"
  openXReport(date) {
    this.modal_xReportDate = date;

    openModalWithBack(
      () => { this.modal_xReportDay = true; },
      () => { this.modal_xReportDay = false; },
      'xReportModal'
    );
  }

  // ✅ Z-отчет сохранен — с поддержкой кнопки "Назад"
  openZReportSaved() {
    openModalWithBack(
      () => { this.modal_zReportSaved = true; },
      () => { this.modal_zReportSaved = false; },
      'zReportSavedModal'
    );
  }

  closeZReportSaved() {
    this.modal_zReportSaved = false;
  }

  /** @param {Function} fn - функция отправки */
  setOnSendZReport(fn) {
    this.onSendZReport = fn;
  }
}

export const appState = new AppState();
