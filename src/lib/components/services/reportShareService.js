// src/lib/services/reportShareService.js

/**
 * Сервис для отправки Z-отчетов
 */
export class ReportShareService {
  /**
   * Генерирует текстовое содержимое отчета
   * @param {Object} reportData - данные Z-отчета
   * @param {string} dateStr - дата в формате "YYYY-MM-DD"
   * @param {string} master - имя мастера
   * @returns {string} - текст отчета
   */
  static generateReportText(reportData, dateStr, master = '') {
    const lines = [];

    // Заголовок
    lines.push(`Z-отчет за ${dateStr}`);
    lines.push(`мастер: ${master || 'Raccon'}.`);
    lines.push('=====================');
    lines.push('');

    // 1. Аренда
    lines.push('Аренда:');
    lines.push(`  Уже оплачено: ${reportData.payments.nowGive}`);
    lines.push(`  Доплатить: ${reportData.payments.moreGive}`);
    lines.push(`  Всего: ${reportData.payments.allGive}`);
    lines.push('');

    // 2. Доход (БЕЗ строки "Чаевые")
    lines.push('Доход:');
    lines.push(`  Валовый: ${reportData.payments.gross}`);
    lines.push(`  Работа: ${reportData.payments.my}`);
    // ⚠️ Пропускаем строку "Чаевые"
    lines.push(`  Итого: ${reportData.payments.allMy}`);
    lines.push('');

    // 3. Клиенты (только те, что > 0)
    lines.push('Клиенты:');
    const clients = reportData.clients;
    if (clients.male > 0) lines.push(`  Мужчины: ${clients.male}`);
    if (clients.male_bearded > 0) lines.push(`  Бородачи: ${clients.male_bearded}`);
    if (clients.colorist > 0) lines.push(`  Окрашивания: ${clients.colorist}`);
    if (clients.female > 0) lines.push(`  Женщины: ${clients.female}`);
    if (clients.child > 0) lines.push(`  Дети: ${clients.child}`);
    lines.push(`  Всего: ${clients.heads}`);
    lines.push('');

    // 4. Подвал
    lines.push('=====================');
    lines.push('Создано с tiri');

    return lines.join('\n');
  }

  /**
   * Создает Blob-файл с отчетом
   * @param {string} text - текст отчета
   * @param {string} dateStr - дата для имени файла
   * @returns {File} - файл для отправки
   */
  static createReportFile(text, dateStr) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const fileName = `z-report_${dateStr}.txt`;
    return new File([blob], fileName, { type: 'text/plain' });
  }

  /**
   * Отправляет отчет через Web Share API (мобильные) или скачивает (ПК)
   * @param {Object} reportData - данные Z-отчета
   * @param {string} dateStr - дата в формате "YYYY-MM-DD"
   * @param {string} master - имя мастера
   * @returns {Promise<Object>} - { success: boolean, message: string }
   */
  static async shareReport(reportData, dateStr, master = '') {
    try {
      // 1. Проверка интернета
      if (!navigator.onLine) {
        return {
          success: false,
          message: 'Нет сети. Попробуйте отправить позже.'
        };
      }

      // 2. Генерируем текст отчета
      const text = this.generateReportText(reportData, dateStr, master);

      // 3. Создаем файл
      const file = this.createReportFile(text, dateStr);

      // 4. Проверка поддержки Web Share API (только мобильные)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Z-отчет за ${dateStr}`,
            text: `Лови файл с z-отчётом за ${dateStr}:`,
            files: [file]
          });

          return {
            success: true,
            message: 'Отчет успешно отправлен!'
          };
        } catch (shareError) {
          if (shareError.name === 'AbortError' || shareError.message?.includes('abort')) {
            return {
              success: false,
              message: 'Отправка отменена'
            };
          }
          throw shareError;
        }
      }

      // 5. FALLBACK ДЛЯ ПК — скачивание файла
      return this.downloadFallback(text, dateStr);

    } catch (error) {
      console.error('[ReportShareService] Ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при отправке. Попробуйте позже.'
      };
    }
  }

  /**
   * Запасной вариант: скачивание файла (для ПК)
   * @param {string} text - текст отчета
   * @param {string} dateStr - дата для имени файла
   * @returns {Object} - { success: boolean, message: string }
   */
  static downloadFallback(text, dateStr) {
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `z-report_${dateStr}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'Файл скачан на устройство'
      };
    } catch (error) {
      console.error('[ReportShareService] Ошибка скачивания:', error);
      return {
        success: false,
        message: 'Не удалось скачать файл'
      };
    }
  }
}