// src/lib/components/services/calculationsOneDay.js

/**
 * Класс для расчетов по записям за один день
 * Выполняет фильтрацию заметок и базовые вычисления
 */
export class CalculationsDay {
  /**
   * @param {Array<Object>} allThisDayRecords - массив всех записей за день (заметки + напоминания)
   */
  constructor(allThisDayRecords) {
    // Проверка входных данных
    if (!Array.isArray(allThisDayRecords)) {
      console.warn('[CalculationsDay] Передан не массив, инициализация с пустым массивом');
      allThisDayRecords = [];
    }

    /**
     * Фильтрованный массив только с заметками (notes)
     * @type {Array<Object>}
     */
    this.allThisDayRecords = allThisDayRecords;
    this.allThisDayNotes_dateStr = allThisDayRecords.filter(
      (entry) => entry && (entry.type === 'note' || entry.types === 'note')
    );

    console.log(`[CalculationsDay] Инициализирован: ${this.allThisDayNotes_dateStr.length} заметок из ${allThisDayRecords.length} записей`);
  }

  /**
   * Возвращает сумму (percent.sum) из заметки
   * @param {Object} entry - запись заметки
   * @returns {number} - значение суммы или 0
   */
  cardSum(entry) {
    try {
      if (!entry || typeof entry !== 'object') {
        return 0;
      }

      const sum = entry.value?.percent?.sum;

      if (typeof sum === 'number' && !isNaN(sum) && isFinite(sum)) {
        return sum;
      }

      return 0;
    } catch (error) {
      console.warn('[cardSum] Ошибка при получении суммы:', error.message);
      return 0;
    }
  }

  /**
   * Вычисляет значение не комиссии, а моего зароботка для заметки (округленно до целого)
   * sum - то что заплатил клиент (без чаевых)
   * give - комиссия (sum * myPercent / 100)
   * my - то что моё (sum - (sum * myPercent / 100))
   * @param {Object} entry - запись заметки
   * @returns {number} - значение (sum - (sum * myPercent / 100)), округленное до целого
   */
  cardPercent(entry) {
    try {
      if (!entry || typeof entry !== 'object') {
        return 0;
      }

      const percent = entry.value?.percent;
      if (!percent || typeof percent !== 'object') {
        return 0;
      }

      const sum = typeof percent.sum === 'number' && !isNaN(percent.sum) ? percent.sum : 0;
      const myPercent = typeof percent.myPercent === 'number' && !isNaN(percent.myPercent) ? percent.myPercent : 0;

      const result = Math.round(sum - (sum * myPercent / 100)); // TODO было (sum * myPercent)/ 100

      if (!isFinite(result)) {
        return 0;
      }

      return result;
    } catch (error) {
      console.warn('[cardPercent] Ошибка при вычислении комиссии:', error.message);
      return 0;
    }
  }

  /**
   * Получает чаевые из заметки
   * @param {Object} entry - запись заметки
   * @returns {number} - значение чаевых или 0
   */
  cardTips(entry) {
    try {
      if (!entry || typeof entry !== 'object') {
        return 0;
      }

      const tips = entry.value?.percent?.tips;

      if (typeof tips === 'number' && !isNaN(tips) && isFinite(tips)) {
        return tips;
      }

      return 0;
    } catch (error) {
      console.warn('[cardTips] Ошибка при получении чаевых:', error.message);
      return 0;
    }
  }

  /**
   * Получает тип оплаты из заметки
   * @param {Object} entry - запись заметки
   * @returns {string|null} - тип оплаты или null
   */
  cardPay(entry) {
    try {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const pay = entry.value?.pay;

      if (typeof pay === 'string' && pay) {
        return pay;
      }

      return null;
    } catch (error) {
      console.warn('[cardPay] Ошибка при получении типа оплаты:', error.message);
      return null;
    }
  }

  /**
   * Получает гендер из заметки
   * @param {Object} entry - запись заметки
   * @returns {string|null} - гендер или null
   */
  cardGender(entry) {
    try {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const gender = entry.value?.gender;

      if (typeof gender === 'string' && gender) {
        return gender;
      }

      return null;
    } catch (error) {
      console.warn('[cardGender] Ошибка при получении гендера:', error.message);
      return null;
    }
  }

  /**
   * Рассчитывает валовый оборот (gross) = сумма всех доходов (sum) + чаевые (tips)
   * @returns {number} - валовый оборот
   */
  calcul_gross() {
    let gross = 0;
    for (const entry of this.allThisDayNotes_dateStr) {
      gross += this.cardSum(entry) + this.cardTips(entry);
    }
    return Math.round(gross);
  }

  /**
   * Рассчитывает валовый доход (summary) = сумма всех sum
   * @returns {number} - валовый доход
   */
  calcul_summary() {
    let summary = 0;
    for (const entry of this.allThisDayNotes_dateStr) {
      summary += this.cardSum(entry);
    }
    return Math.round(summary);
  }

  /**
   * Рассчитывает общую аренду (allGive) = сумма всех give из каждого note
   * @returns {number} - общая аренда
   */
  calcul_allGive() {
    let allGive = 0;
    for (const entry of this.allThisDayNotes_dateStr) {
      allGive += this.cardPercent(entry);
    }
    return Math.round(allGive);
  }

  /**
   * Рассчитывает оплаченную аренду (nowGive) = сумма give для карточек с pay === "card2" или pay === "crypto"
   * @returns {number} - оплаченная аренда
   */
  calcul_nowGive() {
    let nowGive = 0;
    for (const entry of this.allThisDayNotes_dateStr) {
      const pay = this.cardPay(entry);
      if (pay === 'card2' || pay === 'crypto') {
        nowGive += this.cardPercent(entry);
      }
    }
    return Math.round(nowGive);
  }

  /**
   * Рассчитывает остаток аренды (moreGive) = allGive - nowGive
   * Если результат отрицательный, выводит предупреждение
   * @param {number} allGive - общая аренда
   * @param {number} nowGive - оплаченная аренда
   * @param {string} dateStr - дата для отчета
   * @returns {number} - остаток аренды
   */
  calcul_moreGive(allGive, nowGive, dateStr = '') {
    const moreGive = allGive - nowGive;

    if (moreGive < 0) {
      console.warn(
        `[report_Z] Отрицательный остаток аренды за ${dateStr}: ` +
        `allGive (${allGive}) - nowGive (${nowGive}) = ${moreGive}`
      );
    }

    return Math.round(moreGive);
  }

  /**
   * Рассчитывает сдачу (changeGive) = nowGive - allGive (если moreGive отрицательный)
   * @param {number} allGive - общая аренда
   * @param {number} nowGive - оплаченная аренда
   * @param {number} moreGive - остаток аренды
   * @returns {number} - сдача = оплаченная аренда - общая аренда
   */
  calcul_changeGive(allGive, nowGive, moreGive) {
    if (moreGive < 0) {
      return Math.round(nowGive - allGive);
    }
    return 0;
  }

  /**
   * Рассчитывает чаевые за день (tips) = сумма всех tips
   * @returns {number} - чаевые за день
   */
  calcul_tips() {
    let tips = 0;
    for (const entry of this.allThisDayNotes_dateStr) {
      tips += this.cardTips(entry);
    }
    return Math.round(tips);
  }

  /**
   * Рассчитывает доход за день (my) = summary - allGive + changeGive
   * @param {number} summary - валовый доход
   * @param {number} allGive - общая аренда
   * @param {number} changeGive - сдача
   * @returns {number} - доход за день
   */
  calcul_my(summary, allGive, changeGive) {
    return Math.round(summary - allGive + changeGive);
  }

  /**
   * Рассчитывает доход с чаевыми (allMy) = tips + my
   * @param {number} tips - чаевые за день
   * @param {number} my - доход за день
   * @returns {number} - доход с чаевыми
   */
  calcul_allMy(tips, my) {
    return Math.round(tips + my);
  }

  /**
   * Подсчитывает количество заметок с указанным гендером
   * @param {string} gender - гендер для подсчета
   * @returns {number} - количество заметок с указанным гендером
   */
  calcul_genderCount(gender) {
    let count = 0;
    for (const entry of this.allThisDayNotes_dateStr) {
      if (this.cardGender(entry) === gender) {
        count++;
      }
    }
    return count;
  }

  /**
   * Вычисляет экспресс-показатели дня (X-отчет)
   * Без учета способов оплаты
   * @returns {Object} - объект с показателями { sum, my, give }
   */
  report_X() {
    try {
      let sum = 0;
      let my = 0;
      let give = 0;

      for (const entry of this.allThisDayNotes_dateStr) {
        const entrySum = this.cardSum(entry);
        const entryPercent = this.cardPercent(entry);
        const tips = this.cardTips(entry);

        sum += entrySum;
        my += tips + entryPercent;
        give += entryPercent;  // TODO было entrySum - entryPercent        
      }
      return {
        sum: Math.round(sum),
        my: Math.round(my),
        give: Math.round(give)
      };
    } catch (error) {
      console.error('[report_X] Ошибка при вычислении отчета:', error.message);
      return { sum: 0, my: 0, give: 0 };
    }
  }

  /**
   * Выполняет полный расчет структуры отчета дня (Z-отчет)
   * С учетом типов оплаты (value.pay)
   * @param {string} dateStr - дата для отчета (используется в предупреждениях)
   * @returns {Object} - объект с ветками payments и clients
   */
  report_Z(dateStr = '') {
    try {
      // ===== ПЕРЕМЕННЫЕ ДЛЯ РАСЧЕТОВ =====
      const summary = this.calcul_summary();     // Валовый доход (сумма всех sum)
      const allGive = this.calcul_allGive();     // Общая аренда (сумма всех give)
      const nowGive = this.calcul_nowGive();     // Оплаченная аренда (card2 + crypto)
      const moreGive = this.calcul_moreGive(allGive, nowGive, dateStr); // Остаток аренды
      const changeGive = this.calcul_changeGive(allGive, nowGive, moreGive);     // Сдача (если moreGive < 0)
      const tips = this.calcul_tips();           // Чаевые за день
      const my = this.calcul_my(summary, allGive, changeGive); // Доход за день
      const allMy = this.calcul_allMy(tips, my); // Доход с чаевыми
      const gross = this.calcul_gross();         // Валовый оборот

      // ===== КЛИЕНТСКАЯ СТАТИСТИКА =====
      const heads = this.allThisDayNotes_dateStr.length; // Всего клиентов (заметок)
      const pass = this.allThisDayRecords?.length - heads || 0; // Напоминания (записи - заметки)

      const male = this.calcul_genderCount('male');
      const male_bearded = this.calcul_genderCount('male_bearded');
      const female = this.calcul_genderCount('female');
      const colorist = this.calcul_genderCount('colorist');
      const child = this.calcul_genderCount('child');

      // Проверка: сумма гендеров должна равняться heads
      const genderSum = male + male_bearded + female + colorist + child;
      if (genderSum !== heads) {
        console.warn(
          `[report_Z] Несоответствие суммы гендеров за ${dateStr}: ` +
          `heads (${heads}) !== сумма гендеров (${genderSum})`
        );
      }

      // Проверка: если есть напоминания (pass > 0)
      if (pass > 0) {
        console.warn(
          `[report_Z] Есть напоминания за ${dateStr}: ${pass} шт.`
        );
      }

      // ===== ФОРМИРОВАНИЕ ОТЧЕТА =====
      return {
        payments: {
          gross,      // Валовый оборот (sum + tips)
          summary,    // Валовый доход (сумма всех sum)
          allGive,    // Общая аренда (сумма всех give)
          nowGive,    // Оплаченная аренда (card2 + crypto)
          moreGive,   // Остаток аренды (allGive - nowGive)
          changeGive, // Сдача (если moreGive < 0) (nowGive - allGive)
          tips,       // Чаевые за день
          my,         // Доход за день (summary - allGive + changeGive)
          allMy       // Доход с чаевыми (tips + my)
        },
        clients: {
          heads,           // Всего клиентов (заметок)
          pass,            // Напоминания
          male,            // Мужчины
          male_bearded,    // Бородатые мужчины
          female,          // Женщины
          colorist,        // Колористы
          child            // Дети
        }
      };
    } catch (error) {
      console.error('[report_Z] Ошибка при вычислении Z-отчета:', error.message);
      // Возвращаем пустой отчет при ошибке
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
  }

  // src/lib/components/services/calculationsOneDay.js

  /**
   * Сохраняет Z-отчет в IndexedDB (хранилище report_day)
   * @param {string} dateStr - дата в формате "YYYY-MM-DD"
   * @returns {Promise<void>}
   */
  async saveReport_Z(dateStr) {
    try {
      //  Рассчитываем отчет
      const report = this.report_Z(dateStr);

      //  Импортируем функцию сохранения
      const { saveReport } = await import('$lib/utils/db.js');

      // Добавляем yearMonth для индекса by_month
      const yearMonth = dateStr.slice(0, 7); // "2026-08"

      //  Сохраняем в IndexedDB
      await saveReport('day', dateStr, {
        ...report,
        yearMonth: yearMonth
      });

      console.log(`✅ Z-отчет за ${dateStr} сохранен в report_day`);
      return report;
    } catch (error) {
      console.error(`[saveReport_Z] Ошибка сохранения отчета за ${dateStr}:`, error.message);
      throw error;
    }
  }
}