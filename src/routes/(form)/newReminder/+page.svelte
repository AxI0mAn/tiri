<script>
	// src/routes/(form)/newReminder/+page.svelte
	// @ts-ignore
	import { goto } from '$app/navigation';
	// @ts-ignore
	import { base } from '$app/paths';

	import RenderForm from '$lib/components/aPage/RenderForm.svelte';
	import { constructorReminder } from '$lib/store/ConstructorStore.svelte.js';

	/**
	 * Гарантированный переход на страницу дня после сохранения напоминания.
	 *
	 * Семантика идентична `handleBack` в `newNote/+page.svelte` и
	 * `navigateToDay()` в `edit/+page.svelte`: `goto` возвращает промис,
	 * resolve = навигация применена; reject = fallback через location.assign.
	 *
	 * Ранее здесь стоял голый `goto(...)` без await/catch — если навигация
	 * отклонялась (ошибка load-функции роута, guard), пользователь оставался
	 * на форме без обратной связи. Для напоминаний это особенно критично:
	 * reminder-id вычисляется из `Date.now()` при повторном save(), и второй
	 * клик создал бы второй reminder с другим id.
	 *
	 * @returns {Promise<void>}
	 */
	async function handleSave() {
		try {
			await goto(`${base}/day`);
		} catch (err) {
			console.warn('[newReminder] goto rejected, fallback:', err);
			if (typeof window !== 'undefined') {
				window.location.assign(`${base}/day`);
			}
		}
	}

	/**
	 * Отмена создания напоминания.
	 *
	 * Черновик очищается внутри `RenderForm.handleCancel` через
	 * `manager.clearDraft()` — здесь дублировать очистку не нужно.
	 * Задача этого колбэка — только навигация.
	 *
	 * @returns {Promise<void>}
	 */
	async function handleCancel() {
		try {
			await goto(`${base}/day`);
		} catch (err) {
			console.warn('[newReminder] cancel goto rejected, fallback:', err);
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

<RenderForm
	constructorStore={constructorReminder}
	type="reminder"
	onSave={handleSave}
	onCancel={handleCancel}
/>
