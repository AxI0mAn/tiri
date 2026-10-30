/**
 * @file src/lib/utils/handleScroll.js
 * @module handleScroll
 *
 * Плавная прокрутка к элементу по клику на кнопку или ссылку.
 *
 * Оборачивает `Element.scrollIntoView()` и добавляет две вещи, которых
 * нет в нативном API:
 * - отменяет стандартное поведение ссылки (`href="#..."`), чтобы браузер
 *   не прыгнул мгновенно вместо плавной прокрутки;
 * - пишет в консоль предупреждение, если целевой элемент не найден,
 *   вместо тихого «ничего не произошло».
 *
 * Работает с любым событием, у которого есть `preventDefault()` — обычно
 * это `MouseEvent` из `onclick`.
 * 
 * Плавно прокручивает страницу к элементу, найденному по CSS-селектору.
 *
 * Вызывается из обработчика клика. Если первым аргументом передано событие
 * с методом `preventDefault()` (например, `MouseEvent`), стандартное
 * поведение отменяется — так ссылка `href="#anchor"` не сработает
 * мгновенным переходом. Если элемент не найден — в консоль пишется
 * `console.warn`, исключение не бросается.
 *
 * @param {Event|undefined|null} e - событие клика (обычно `MouseEvent`);
 *   может быть `undefined`/`null`, если функцию вызывают программно
 * @param {string} selector - CSS-селектор целевого элемента (например, `'.instruction'` или `'#instruction'`)
 * @returns {void}
 *
 * @example
 * // Декларативное использование в Svelte
 * <a
 *   href="#instruction"
 *   onclick={(e) => handleScroll(e, '.instruction')}
 *   class="btn btn__interface"
 *   aria-label="Info"
 * >
 *   click and go
 * </a>
 *
 * @example
 * // Программный вызов без события
 * handleScroll(undefined, '#top');
 *
 */
export function handleScroll(e, selector) {
  // Отменяем стандартное поведение только если пришло похожее на событие.
  // Это позволяет вызывать функцию программно (без события), не падая.
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  const target = document.querySelector(selector);
  if (target) {
    // block: 'start' — выравниваем верх элемента по верху вьюпорта.
    // behavior: 'smooth' — анимированная прокрутка (уважает prefers-reduced-motion в большинстве браузеров).
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    // Не бросаем исключение: клик по «мёртвой» ссылке не должен ронять UI.
    // Предупреждение в консоли помогает поймать опечатку в селекторе.
    console.warn(`Element with selector "${selector}" not found.`);
  }
}