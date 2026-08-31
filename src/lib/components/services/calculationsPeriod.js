// src/lib/components/services/calculationsPeriod.js

import { saveReport } from '$lib/utils/db.js';

/**
 * Класс для расчетов по отчетам за период (месяц)
 */
export class CalculationsPeriod {
  /**
   * @param {string} yearMonth - месяц в формате "YYYY-MM"
   */
  constructor(yearMonth) {
    if (typeof yearMonth !== 'string' || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      throw new Error(`[CalculationsPeriod] Невалидный формат месяца: ${yearMonth}`);
    }

    this.yearMonth = yearMonth;
    this.year = parseInt(yearMonth.split('-')[0], 10);
    this.month = parseInt(yearMonth.split('-')[1], 10);
    this.daysInMonth = this._getDaysInMonth(this.year, this.month);
  }

  /**
   * Возвращает количество дней в месяце
   * @param {number} year - год
   * @param {number} month - месяц (1-12)
   * @returns {number} - количество дней в месяце
   */
  _getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  /**
   * Создает пустой объект дня для отчета
   * @param {string} dateStr - дата в формате "YYYY-MM-DD"
   * @returns {Object} - пустой день с нулевыми значениями
   */
  _createEmptyDay(dateStr) {
    return {
      date: dateStr,
      payments: {
        gross: 0, summary: 0, allGive: 0, nowGive: 0,
        moreGive: 0, changeGive: 0, tips: 0, my: 0, allMy: 0
      },
      clients: {
        heads: 0, pass: 0, male: 0, male_bearded: 0,
        female: 0, colorist: 0, child: 0
      }
    };
  }

  /**
   * Создает пустой объект totals (суммы за месяц)
   * @returns {Object} - пустые totals
   */
  _createEmptyTotals() {
    return {
      payments: {
        gross: 0, summary: 0, allGive: 0, nowGive: 0,
        moreGive: 0, changeGive: 0, tips: 0, my: 0, allMy: 0
      },
      clients: {
        heads: 0, pass: 0, male: 0, male_bearded: 0,
        female: 0, colorist: 0, child: 0
      }
    };
  }

  /**
   * Суммирует два объекта отчетов (для агрегации)
   * @param {Object} target - целевой объект (сумма)
   * @param {Object} source - источник (добавляемые значения)
   * @returns {Object} - обновленный target
   */
  _sumReports(target, source) {
    for (const key of Object.keys(target.payments)) {
      target.payments[key] += source.payments?.[key] || 0;
    }
    for (const key of Object.keys(target.clients)) {
      target.clients[key] += source.clients?.[key] || 0;
    }
    return target;
  }

  /**
   * Создает массив дней месяца с данными из дневных отчетов
   * @param {Array} dayReports - массив дневных Z-отчетов
   * @returns {Array} - массив дней (включая пустые)
   */
  _buildDaysArray(dayReports) {
    const days = [];
    const reportMap = {};

    for (const report of dayReports) {
      if (report.dateStr) {
        reportMap[report.dateStr] = report;
      }
    }

    for (let day = 1; day <= this.daysInMonth; day++) {
      const dateStr = `${this.yearMonth}-${String(day).padStart(2, '0')}`;

      if (reportMap[dateStr]) {
        const report = reportMap[dateStr];
        days.push({
          date: dateStr,
          payments: { ...report.payments },
          clients: { ...report.clients }
        });
      } else {
        days.push(this._createEmptyDay(dateStr));
      }
    }

    return days;
  }

  /**
   * Рассчитывает X-отчет за месяц
   * @param {Array} dayReports - массив дневных Z-отчетов
   * @returns {Object} - X-отчет за месяц { days: [...], totals: {...} }
   */
  report_X_month(dayReports) {
    try {
      console.log(`[report_X_month] Расчет X-отчета за ${this.yearMonth}`);

      const days = this._buildDaysArray(dayReports);
      const totals = this._createEmptyTotals();

      for (const day of days) {
        this._sumReports(totals, day);
      }

      return {
        yearMonth: `${this.yearMonth}_X`,
        days: days,
        totals: totals
      };
    } catch (error) {
      console.error('[report_X_month] Ошибка:', error);
      throw error;
    }
  }

  /**
   * Рассчитывает Z-отчет за месяц
   * @param {Array} dayReports - массив дневных Z-отчетов
   * @returns {Object} - Z-отчет за месяц { payments: {...}, clients: {...} }
   */
  report_Z_month(dayReports) {
    try {
      console.log(`[report_Z_month] Расчет Z-отчета за ${this.yearMonth}`);

      const totals = this._createEmptyTotals();

      for (const report of dayReports) {
        this._sumReports(totals, report);
      }

      return {
        yearMonth: `${this.yearMonth}_Z`,
        payments: totals.payments,
        clients: totals.clients
      };
    } catch (error) {
      console.error('[report_Z_month] Ошибка:', error);
      throw error;
    }
  }

  /**
   * Сохраняет месячный X-отчет в IndexedDB
   * @param {Object} xReport - X-отчет от report_X_month()
   * @returns {Promise<void>}
   */
  async save_X_month(xReport) {
    await saveReport('month', xReport.yearMonth, {
      days: xReport.days,
      totals: xReport.totals
    });
    console.log(`[save_X_month] X-отчет за ${this.yearMonth} сохранен`);
  }

  /**
   * Сохраняет месячный Z-отчет в IndexedDB
   * @param {Object} zReport - Z-отчет от report_Z_month()
   * @returns {Promise<void>}
   */
  async save_Z_month(zReport) {
    await saveReport('month', zReport.yearMonth, {
      payments: zReport.payments,
      clients: zReport.clients
    });
    console.log(`[save_Z_month] Z-отчет за ${this.yearMonth} сохранен`);
  }

  /**
   * Полный цикл: расчет и сохранение X- и Z-отчетов за месяц
   * @param {Array} dayReports - массив дневных Z-отчетов
   * @returns {Promise<{ xReport: Object, zReport: Object }>}
   */
  async generateAndSaveMonthReports(dayReports) {
    const xReport = this.report_X_month(dayReports);
    const zReport = this.report_Z_month(dayReports);

    await this.save_X_month(xReport);
    await this.save_Z_month(zReport);

    return { xReport, zReport };
  }
}