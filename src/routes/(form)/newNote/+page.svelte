<!-- src/routes/(form)/newNote/+page.svelte -->
<script>
	// @ts-ignore
	import { goto } from '$app/navigation';
	// @ts-ignore
	import { base } from '$app/paths';

	import RenderForm from '$lib/components/aPage/RenderForm.svelte';
	import { constructorStore } from '$lib/store/ConstructorStore.svelte';

	/**
	 * Гарантированный переход на страницу дня после сохранения заметки.
	 *
	 * Раньше здесь был `history.back()` — асинхронный и негарантированный:
	 * при входе на форму прямой ссылкой / после refresh / из PWA-ярлыка
	 * история могла быть пустой (`history.length === 1`), и перехода
	 * не происходило. Пользователь оставался на форме, повторный клик
	 * «Сохранить» создавал вторую заметку (in-memory draft сохранялся
	 * с новым `Date.now()`-id, черновик в localStorage тут ни при чём).
	 *
	 * `goto` — детерминированная навигация SvelteKit с промисом:
	 * resolve = переход применён; reject = fallback через location.assign.
	 * Семантика идентична `navigateToDay()` в `edit/+page.svelte`.
	 *
	 * @returns {Promise<void>}
	 */
	async function handleBack() {
		try {
			await goto(`${base}/day`);
		} catch (err) {
			console.warn('[newNote] goto rejected, fallback:', err);
			if (typeof window !== 'undefined') {
				window.location.assign(`${base}/day`);
			}
		}
	}

	// ВАЖНО: onMount-очистка черновика удалена.
	// Черновик уже чистится в `FormDraftManager.save()` после успешного
	// сохранения и в `handleCancel` при явном отказе (кнопка «Отмена»).
	// Дополнительная очистка при монтировании убивала legitimate черновик,
	// который пользователь сохранил, закрыв вкладку без нажатия кнопок —
	// это ломало автовосстановление формы.
</script>

<RenderForm type="note" {constructorStore} onSave={handleBack} onCancel={handleBack} />
