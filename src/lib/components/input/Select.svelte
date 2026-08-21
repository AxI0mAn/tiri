<script>
	// src/lib/components/input/Select.svelte

	/**
	 * @typedef {Object} Option
	 * @typedef {Object} Props
	 * @property {string | number} [value='']
	 * @property {Option[]} [options=[]]
	 * @property {string} [label='']
	 * @property {string} [placeholder='Выберите из списка']
	 * @property {boolean} [disabled=false]
	 * @property {string} [customClass='']
	 */

	let {
		value = $bindable(''),
		options = [],
		label = '',
		placeholder = 'Выберите из списка',
		disabled = false,
		customClass = ''
	} = $props();

	function handleChange(e) {
		value = e.currentTarget.value;
	}
</script>

<div class="select-field {customClass}" class:is-disabled={disabled}>
	{#if label}
		<label class="select-label" for="custom-select">{label}</label>
	{/if}

	<div class="select-wrapper">
		<select id="custom-select" class="select-element" {value} {disabled} onchange={handleChange}>
			{#if placeholder}
				<option value="" disabled selected={value === ''}>
					{placeholder}
				</option>
			{/if}

			{#each options as option}
				<option value={option.value}>
					{option.label}
				</option>
			{/each}
		</select>

		<!-- Кастомная стрелка SVG -->
		<span class="select-arrow" aria-hidden="true">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<polyline
					points="6 9 12 15 18 9"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</span>
	</div>
</div>

<!-- 
Применение компонента

<script>
  import Select from './Select.svelte';

  let selectedTheme = $state('dark');

  const themeOptions = [
    { value: 'light', label: 'Светлая тема' },
    { value: 'dark', label: 'Темная тема' },
    { value: 'system', label: 'Системная' }
  ];
</script>

<div class="demo-container">
  <Select
    bind:value={selectedTheme}
    options={themeOptions}
    label="Тема оформления"
    placeholder="Выберите тему"
  />

  <p class="result">Текущее значение: <strong>{selectedTheme}</strong></p>
</div>

<style lang="scss">
  .demo-container {
    max-width: 320px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .result {
    color: #ffffff;
    font-size: 0.9rem;

    strong {
      color: $clr-teal;
    }
  }
</style>
 -->

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.select-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;

		.select-label {
			font-size: 0.85rem;
			color: $clr-text-main;
			opacity: 0.8;
			user-select: none;
		}

		.select-wrapper {
			position: relative;
			width: 100%;

			.select-element {
				width: 100%;
				height: 44px;
				padding: 0 40px 0 14px;
				border-radius: 12px;
				border: 2px solid rgba(255, 255, 255, 0.2);
				background: $clr-bg-card;
				color: $clr-text-accent;
				font-family: inherit;
				font-size: 0.95rem;
				outline: none;
				appearance: none; /* Скрываем нативную стрелку */
				cursor: pointer;
				box-sizing: border-box;
				transition:
					border-color 0.2s ease,
					box-shadow 0.2s ease;

				&:hover {
					border-color: $clr-teal;
				}

				&:focus {
					border-color: $clr-teal;
					box-shadow:
						inset 2px 2px 5px rgba(0, 0, 0, 0.5),
						inset -2px -2px 5px rgba(255, 255, 255, 0.05);
				}

				/* Стилизация пунктов выпадающего меню */
				option {
					background-color: $clr-bg-dark;
					color: $clr-text-accent;
					padding: 10px;

					&:disabled {
						color: $clr-text-main;
						text-align: center;
					}
				}
			}

			.select-arrow {
				position: absolute;
				right: 14px;
				top: 50%;
				transform: translateY(-50%);
				pointer-events: none;
				display: flex;
				align-items: center;
				justify-content: center;

				svg {
					width: 18px;
					height: 18px;
					color: $clr-text-accent;
					/* По умолчанию стрелка смотрит вниз */
					transform: rotate(0deg);
					transition: transform 0.2s ease;
				}
			}

			/* При фокусе/открытии списка поворачиваем вверх */
			.select-element:focus + .select-arrow svg {
				transform: rotate(180deg);
			}
		}

		&.is-disabled {
			opacity: 0.5;
			pointer-events: none;
		}
	}
</style>
