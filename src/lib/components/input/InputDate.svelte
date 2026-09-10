<script>
	// src/lib/components/input/InputDate.svelte
	import Modal_Calendar from '$lib/components/aBlock/modal/Modal_Calendar.svelte';

	let { value = $bindable(''), label = '', minDate = '', maxDate = '' } = $props();

	let showCalendar = $state(false);

	// ✅ Отображаемая строка (ДД.ММ.ГГГГ или заглушка)
	let displayValue = $derived(value ? value.split('-').reverse().join('.') : 'Выберите дату');

	// ✅ Обработка выбора даты из модалки
	function handleSelectDate(dateStr) {
		value = dateStr;
		showCalendar = false;
	}
</script>

<div class="date-field">
	{#if label}<label class="label">{label}</label>{/if}

	<!-- ✅ Кастомная копия (видимая) -->
	<button type="button" class="date-input-custom" onclick={() => (showCalendar = true)}>
		{displayValue}
	</button>

	<!-- ✅ Скрытый оригинальный инпут (для совместимости) -->
	<input
		id="date-inp"
		type="date"
		class="date-input-hidden"
		bind:value
		min={minDate}
		max={maxDate}
		aria-hidden="true"
		tabindex="-1"
	/>
</div>

<Modal_Calendar
	isOpen={showCalendar}
	selectedDate={value}
	{minDate}
	{maxDate}
	onSelectDate={handleSelectDate}
	onClose={() => (showCalendar = false)}
/>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.date-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;

		.label {
			font-size: 0.85rem;
			color: $clr-text-accent;
			opacity: 0.8;
		}

		/* ✅ Кастомная кнопка-копия */
		.date-input-custom {
			min-width: 200px;
			width: 100%;
			height: 44px;
			padding: 0 14px;
			border-radius: 12px;
			border: 2px solid rgba(255, 255, 255, 0.2);
			background: $clr-bg-card;
			color: $clr-text-main;
			font-family: inherit;
			font-size: 1rem;
			text-align: left;
			cursor: pointer;
			box-sizing: border-box;
			transition: border-color 0.2s ease;

			&:hover,
			&:focus {
				border-color: $clr-text-accent;
				outline: none;
			}
		}

		/* ✅ Скрытый оригинальный инпут */
		.date-input-hidden {
			position: absolute;
			opacity: 0;
			pointer-events: none;
			width: 0;
			height: 0;
		}
	}
</style>
