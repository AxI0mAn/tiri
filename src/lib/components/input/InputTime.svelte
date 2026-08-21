<script>
	// src/lib/components/input/InputTime.svelte
	let { value = $bindable(''), label = '' } = $props();
</script>

<div class="time-field">
	{#if label}<label class="label" for="time-inp">{label}</label>{/if}
	<input id="time-inp" type="time" class="time-input" bind:value />
</div>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.time-field {
		display: flex;
		flex-direction: column;
		gap: 6px;

		.label {
			font-size: 0.85rem;
			color: $clr-text-accent;
			opacity: 0.8;
		}

		.time-input {
			height: 44px;
			padding: 0 14px;
			border-radius: 12px;
			border: 2px solid rgba(255, 255, 255, 0.2);
			background: $clr-bg-card;
			color: $clr-text-main;
			font-family: inherit;
			outline: none;
			color-scheme: dark;
			box-sizing: border-box;
			transition: border-color 0.2s ease;

			&:hover,
			&:focus {
				border-color: $clr-teal;
			}
		}
	}
	.time-input::-webkit-calendar-picker-indicator {
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
	.time-input {
		accent-color: $clr-teal; /* Цвет активного дня, чекбоксов и выделений в пикере */
	}
</style>
