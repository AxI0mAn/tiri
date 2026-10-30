/**
 * На странице есть несколько <details>. 
 * Эта функция  НЕОБХОДИМА ДЛЯ СТАРЫХ БРАУЗЕРОВ отслеживает <details> на этой странице так, что открытым может быть только один. 
 * Если открыли первый, а потом открыли третий, то первый закроется.
 * 
 * ДЛЯ НОВЫХ БРАУЗЕРОВ ЕСТЬ АТТРИБУТ <details name="my-accordion">  
 * ЕГО ПРИСВАИВАЕМ ВСЕМ <details> КОТОРЫЕ ДОЛЖНЫ ВЕСТИ СЕБЯ КАК АККОРДЕОН
 */

/**
 * @file src/lib/utils/initAccordion.js
 * @module initAccordion
 *
 * Полифилл «аккордеона» для `<details>` в старых браузерах.
 *
 * В современных браузерах нативный атрибут `<details name="my-accordion">`
 * заставляет все `<details>` с одинаковым `name` вести себя как аккордеон:
 * открытие одного автоматически закрывает остальные. В старых браузерах
 * этот атрибут игнорируется, и все секции могут быть открыты одновременно.
 *
 * Эта функция эмулирует поведение `name="..."` через JS: вешает обработчик
 * `toggle` на каждый `<details>` и закрывает все остальные при открытии
 * текущего.
 *
 * ⚠️ Ограничение: функция обрабатывает **все** `<details>` на странице как
 * одну группу. Если нужно несколько независимых аккордеонов — потребуется
 * доработка (группировка по атрибуту/контейнеру).
 *
 * ⚠️ Функция работает только в браузере: использует `document` и
 * `addEventListener`. Вызывать её нужно внутри `onMount` (в Svelte) или
 * после монтирования DOM, иначе на SSR-этапе она упадёт.
 */

/**
 * Инициализирует аккордеонное поведение для всех `<details>` на странице:
 * при открытии одного элемента все остальные закрываются.
 *
 * Возвращает функцию очистки — она снимает все навешенные `toggle`-слушатели.
 * Передайте её из `onMount`, чтобы Svelte вызвал очистку при размонтировании
 * компонента. Это предотвращает утечку обработчиков и накопление слушателей
 * при HMR в dev-режиме.
 *
 * Идемпотентной **не является**: повторный вызов навесит обработчики
 * повторно (каждый вызов создаёт свой набор слушателей). Вызывайте один раз
 * после монтирования DOM.
 *
 * @returns {() => void} функция очистки: снимает все навешенные обработчики
 *
 * @example
 * // В Svelte-компоненте
 * <script>
 *   import { onMount } from 'svelte';
 *   import { initAccordion } from '$lib/utils/initAccordion';
 *   import AccordionDetails from '$lib/components/aBlock/AccordionDetails.svelte';

*   // Svelte автоматически вызовет возвращённую функцию при размонтировании
 *   // onMount ожидает, что колбэк может вернуть cleanup-функцию.
 *  // Svelte вызовет её при размонтировании компонента — все слушатели будут сняты автоматически.
 * onMount(() => initAccordion());
 * </script>
 *
 * <AccordionDetails castomClass="optionCalc" name="my-accordion">
 *   {#snippet summary()}
 *     <h2>Пример с h2</h2>
 *   {/snippet}
 * 
 *   <ul>
 *     <li>Addition</li>
 *     <li>Subtraction</li>
 *   </ul>
 * </AccordionDetails> 
 *
 * <AccordionDetails castomClass="optionCalc" name="my-accordion">
 *   {#snippet summary()}
 *     <h4>Пример с h4 </h4>
 *   {/snippet}
 * 
 *   <p>Какой-то другой контент...</p>
 * </AccordionDetails>
 *
 * @example
 * // Вне Svelte — ручная очистка
 * const cleanup = initAccordion();
 * // позже, когда аккордеон больше не нужен:
 * cleanup();
 */

export function initAccordion() {
  // Находим все элементы details на странице
  const details = document.querySelectorAll('details');

  /**
   * Реестр навешенных обработчиков: нужен, чтобы снять их в cleanup.
   * `removeEventListener` сравнивает функции по ссылке, поэтому храним
   * именно те же `handler`, что передали в `addEventListener`.
   * @type {Array<{ el: HTMLDetailsElement, handler: (event: Event) => void }>}
   */
  const registrations = [];

  details.forEach((targetDetail) => {
    /**
     * Обработчик `toggle` для одного `<details>`.
     * Срабатывает после смены состояния `open`, поэтому `targetDetail.open`
     * внутри уже актуален.
     * @param {Event} _event
     * @returns {void}
     */
    // eslint-disable-next-line no-unused-vars
    const handler = (_event) => {
      // Если текущий элемент открылся — закрываем все остальные
      if (targetDetail.open) {
        details.forEach((detail) => {
          if (detail !== targetDetail) {
            detail.open = false;
          }
        });
      }
    };

    targetDetail.addEventListener('toggle', handler);
    registrations.push({ el: targetDetail, handler });
  });

  /**
   * Снимает все `toggle`-слушатели, навешенные этим вызовом `initAccordion`.
   * Возвращается наружу как результат функции — для использования в `onMount`
   * или для ручной очистки.
   * Cleanup (от англ. clean up — «убрать за собой») — это функция, 
   * которая освобождает ресурсы, захваченные при инициализации.
   * В этом случае - это стрелочная функция в return.
   * @returns {void}
   */
  return () => {
    registrations.forEach(({ el, handler }) => {
      el.removeEventListener('toggle', handler);
    });
  };
}