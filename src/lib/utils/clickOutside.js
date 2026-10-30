/**
 * @file src/lib/utils/clickOutside.js
 * @module clickOutside
 *
 * Svelte-действие (action) для отслеживания кликов вне указанного DOM-элемента.
 * Используется для закрытия поповеров, дропдаунов, модалок и меню при клике
 * за пределами их корневого узла.
 *
 * Особенности:
 * - Слушатель вешается в фазе захвата (`capture: true`) — срабатывает раньше
 *   обработчиков внутри `node`. Это позволяет закрывать поповер до того, как
 *   клик по вложенной кнопке успеет выполнить своё действие и «проглотить»
 *   событие через `stopPropagation()`.
 * - Слушатель добавляется на `document`, а не на `window`, чтобы не реагировать
 *   на клики в iframe и системные события.
 * - Корректно очищается в хуке `destroy()` — утечек памяти нет.
 *
 * @see {@link https://svelte.dev/docs/svelte-action | Svelte actions}
 */

/**
 * Создает Svelte-действие, вызывающее `callback` при клике вне `node`.
 *
 * @param {HTMLElement} node - корневой элемент, клики внутри которого игнорируются
 * @param {() => void} callback - вызывается при клике вне `node`
 * @returns {{ destroy: () => void }} - объект действия Svelte с хуком очистки
 *
 * @example
 * <script>
 *   import { clickOutside } from '$lib/utils/clickOutside';
 *   let open = $state(false);
 * </script>
 *
 * {#if open}
 *   <div use:clickOutside={() => (open = false)}>
 *     <p>Контент поповера</p>
 *   </div>
 * {/if}
 *
 * @example
 * // Императивное использование (вне Svelte)
 * const cleanup = clickOutside(menuEl, () => menuEl.remove());
 * // позже:
 * cleanup.destroy();
 */
export function clickOutside(node, callback) {
  /**
   * Обработчик клика на `document`.
   * Проверяет, что цель клика не находится внутри `node`, и вызывает `callback`.
   *
   * @param {MouseEvent} event - событие клика
   * @returns {void}
   */
  const handleClick = (event) => {
    // console.log("click detected:", event.target);
    if (!node.contains(/** @type {Node} */(event.target))) {
      callback();
    }
  };

  // capture: true — ловим событие до обработчиков внутри node,
  // чтобы поповер успел закрыться раньше, чем сработает вложенный клик.
  document.addEventListener('click', handleClick, true);

  return {
    /**
     * Вызывается Svelte при размонтировании элемента.
     * Снимает слушатель с `document`, предотвращая утечку памяти.
     *
     * @returns {void}
     */
    destroy() {
      document.removeEventListener('click', handleClick, true);
    }
  };
}

/**
 * Использование в компоненте
<script>
    import { clickOutside } from './actions/clickOutside.js';

    let isOpen = false;


    function close() { // для NavBar
    console.log('MENU CLOSED');
    isMenuOpen = false;
    openLvl1 = false;
    openLvl2 = false;
  }
    function close() { // для NavBurger
    console.log('MENU CLOSED');
    menuOpen = false;
  }

</script>

<div use:clickOutside={close} class="menu-wrapper">
    <!-- меню -->
</div>
 */