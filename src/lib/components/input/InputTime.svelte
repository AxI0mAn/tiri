<script>
	// src/lib/components/input/InputTime.svelte
	import Modal_TimePicker from '$lib/components/aBlock/modal/Modal_TimePicker.svelte';

	let { value = $bindable('09:30'), label = '' } = $props();

	let showTimePicker = $state(false);

	// ✅ Отображаемая строка (HH:MM или заглушка)
	let displayValue = $derived(value && /^\d{2}:\d{2}$/.test(value) ? value : 'Выберите время');

	// ✅ Обработка выбора времени из модалки
	function handleSelectTime(timeStr) {
		value = timeStr;
		showTimePicker = false;
	}
</script>

<div class="time-field">
	{#if label}<label class="label">{label}</label>{/if}

	<!-- ✅ Кастомная копия (видимая) -->
	<button type="button" class="time-input-custom" onclick={() => (showTimePicker = true)}>
		{displayValue}
	</button>

	<!-- ✅ Скрытый оригинальный инпут (для совместимости) -->
	<input
		id="time-inp"
		type="time"
		class="time-input-hidden"
		bind:value
		aria-hidden="true"
		tabindex="-1"
	/>
</div>

<Modal_TimePicker
	isOpen={showTimePicker}
	{value}
	onSelectTime={handleSelectTime}
	onClose={() => (showTimePicker = false)}
/>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.time-field {
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
		.time-input-custom {
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
				border-color: $clr-teal;
				outline: none;
			}
		}

		/* ✅ Скрытый оригинальный инпут */
		.time-input-hidden {
			position: absolute;
			opacity: 0;
			pointer-events: none;
			width: 0;
			height: 0;
		}
	}
</style>
