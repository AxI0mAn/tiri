<!-- src/lib/components/aBlock/modal/Modal_Calendar.svelte -->
<script>
	import ModalBackdrop from './ModalBackdrop.svelte';
	import CalendarSchedule from '$lib/components/aPage/calendar/CalendarSchedule.svelte';
	import { openModalWithBack } from '$lib/utils/modalHelpers.js';

	/**
	 * @typedef {Object} Props
	 * @property {boolean} [isOpen=false]
	 * @property {string} [selectedDate='']
	 * @property {string} [minDate='']
	 * @property {string} [maxDate='']
	 * @property {Function} [onSelectDate]
	 * @property {Function} [onClose]
	 */

	/** @type {Props} */
	let {
		isOpen = false,
		selectedDate = '',
		minDate = '',
		maxDate = '',
		onSelectDate = () => {},
		onClose = () => {}
	} = $props();

	// ✅ Обработка выбора даты
	function handleSelectDate(dateStr) {
		onSelectDate(dateStr);
		closeModal();
	}

	// ✅ Закрытие модалки
	function closeModal() {
		onClose();
	}

	// ✅ Поддержка кнопки "Назад" браузера
	$effect(() => {
		if (isOpen) {
			// Добавляем состояние в историю при открытии
			if (typeof window !== 'undefined' && window.history) {
				window.history.pushState({ calendarModal: true }, '');
			}

			const handlePopState = (event) => {
				// Если состояние с модалкой отсутствует — закрываем
				if (!event.state || !event.state.calendarModal) {
					closeModal();
					window.removeEventListener('popstate', handlePopState);
				}
			};

			window.addEventListener('popstate', handlePopState);

			return () => {
				window.removeEventListener('popstate', handlePopState);
			};
		}
	});
</script>

<ModalBackdrop {isOpen} maxWidth="95vw">
	{#snippet children()}
		<div class="calendar-modal">
			<CalendarSchedule
				mode="picker"
				{selectedDate}
				{minDate}
				{maxDate}
				onSelectDate={handleSelectDate}
				onClose={closeModal}
			/>
		</div>
	{/snippet}
</ModalBackdrop>

<style lang="scss">
	@use '../../../../styles/_variables.scss' as *;

	.calendar-modal {
		width: 100%;
		max-width: 95vw;
		max-height: 95vh;
		overflow: auto;
		background: $clr-bg-card;
		border-radius: 16px;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
	}
</style>
