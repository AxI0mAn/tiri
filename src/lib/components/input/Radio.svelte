<script>
	// src/lib/components/input/Radio.svelte

	/**
	 * @typedef {Object} Props
	 * @property {any} group - Связанное значение радио-группы
	 * @property {any} value - Значение конкретной радио-кнопки
	 * @property {string} [label='']
	 * @property {boolean} [disabled=false]
	 * @property {string} [customClass='']
	 */

	let { group = $bindable(), value, label = '', disabled = false, customClass = '' } = $props();

	let isChecked = $derived(group === value);

	function handleChange() {
		group = value;
	}
</script>

<label class="radio-container {customClass}" class:is-disabled={disabled}>
	<input
		type="radio"
		class="radio-native"
		checked={isChecked}
		{value}
		{disabled}
		onchange={handleChange}
	/>
	<span class="radio-circle" aria-hidden="true">
		<span class="radio-dot"></span>
	</span>
	{#if label}
		<span class="radio-label">{label}</span>
	{/if}
</label>

<!-- 
 /*
  Применение в компоненте 
 <script>
  import Radio from './Radio.svelte';

  // Реактивная переменная хранит выбранное значение
  let selectedOption = $state('option1');
</script>

<div class="radio-group">
  <Radio
    bind:group={selectedOption}
    value="option1"
    label="Первый вариант"
  />

  <Radio
    bind:group={selectedOption}
    value="option2"
    label="Второй вариант"
  />

  <Radio
    bind:group={selectedOption}
    value="option3"
    label="Третий вариант"
  />
</div>

<p class="result">Выбрано: {selectedOption}</p>

<style lang="scss">
  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .result {
    margin-top: 16px;
    color: #ffffff;
    font-size: 0.9rem;
  }
</style>
  */
   -->

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.radio-container {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		user-select: none;

		.radio-native {
			position: absolute;
			opacity: 0;
			width: 0;
			height: 0;

			&:focus-visible + .radio-circle {
				border-color: $clr-teal;
				box-shadow: 0 0 0 2px rgba($clr-teal, 0.4);
			}

			&:checked + .radio-circle {
				border-color: $clr-teal;

				.radio-dot {
					transform: scale(1);
					opacity: 1;
				}
			}
		}

		.radio-circle {
			width: 22px;
			height: 22px;
			border-radius: 50%;
			border: 2px solid rgba(255, 255, 255, 0.2);
			background: $clr-bg-card;
			display: flex;
			align-items: center;
			justify-content: center;
			transition:
				border-color 0.2s ease,
				box-shadow 0.2s ease;
			box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.4);

			.radio-dot {
				width: 10px;
				height: 10px;
				border-radius: 50%;
				background: $clr-teal;
				transform: scale(0);
				opacity: 0;
				transition:
					transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275),
					opacity 0.15s ease;
			}
		}

		&:hover .radio-circle {
			border-color: $clr-teal;
		}

		.radio-label {
			font-size: 0.95rem;
			color: $clr-text-main;
		}

		&.is-disabled {
			opacity: 0.5;
			pointer-events: none;
		}
	}
</style>
