<script>
	//src/lib/components/input/InputDate.svelte

	let { value = $bindable(''), label = '', min = '', max = '' } = $props();
</script>

<div class="date-field">
	{#if label}<label class="label" for="date-inp">{label}</label>{/if}
	<input id="date-inp" type="date" class="date-input" bind:value {min} {max} />
</div>

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

		.date-input {
			width: 100%;
			height: 44px;
			padding: 0 14px;
			border-radius: 12px;
			border: 2px solid rgba(255, 255, 255, 0.2);
			background: $clr-bg-card;
			color: $clr-text-main;
			font-family: inherit;
			outline: none;
			box-sizing: border-box;
			color-scheme: dark; /* Принудительный темный режим для встроенного календаря */
			transition: border-color 0.2s ease;

			&:hover,
			&:focus {
				border-color: $clr-text-accent;
			}
		}
	}
	.date-input::-webkit-calendar-picker-indicator {
		cursor: pointer;
		// Белый цвет
		filter: invert(1);

		// Или бирюзовый акцент ($clr-teal):
		// filter: invert(74%) sepia(51%) saturate(2834%) hue-rotate(130deg) brightness(101%) contrast(101%);

		opacity: 0.7;
		transition: opacity 0.2s ease;

		&:hover {
			opacity: 1;
		}
	}
	.date-input {
		accent-color: $clr-teal; /* Цвет активного дня, чекбоксов и выделений в пикере */
	}
</style>
