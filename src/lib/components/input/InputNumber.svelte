<!-- src/lib/components/input/InputNumber.svelte -->
<script>
	import { onMount, onDestroy } from 'svelte';
	import { appStore } from '$lib/store/appStore.svelte.js';
	import { appState } from '$lib/store/appState.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {number} [value=0]
	 * @property {number} [min=0]
	 * @property {number} [max=Infinity]
	 * @property {string} [label='']
	 * @property {string} [customClass='']
	 * @property {boolean} [disabled=false]
	 */

	let {
		value = $bindable(0),
		min = 0,
		max = Infinity,
		label = '',
		customClass = '',
		disabled = false
	} = $props();

	// ===== LOCALIZATION =====
	const ruLangs = ['RU', 'UA', 'UK'];
	let decimalSeparator = $derived(ruLangs.includes(appStore.lang) ? ',' : '.');

	// ===== СОСТОЯНИЕ =====
	let inputEl = $state(null);
	let isKeyboardOpen = $state(false);
	let displayValue = $state('');

	// ✅ Отображение: точка → запятая для RU/UA
	function toDisplay(num) {
		if (num === '' || num === null || num === undefined) return '';
		const str = String(num);
		return decimalSeparator === ',' ? str.replace('.', ',') : str;
	}

	// ✅ Парсинг: запятая → точка, валидация
	function parseInput(str) {
		if (!str) return 0;

		// Нормализация: запятая → точка
		const normalized = str.replace(',', '.');

		// Убираем всё, кроме цифр и точки
		const cleaned = normalized.replace(/[^\d.]/g, '');

		// Убираем вторую точку
		const parts = cleaned.split('.');
		const result = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;

		const num = parseFloat(result);
		if (isNaN(num)) return min;

		return Math.min(Math.max(num, min), max);
	}

	// ✅ Синхронизация отображения с value
	$effect(() => {
		displayValue = toDisplay(value);
	});

	// ✅ При клике — открыть клавиатуру
	function handleFocus() {
		if (disabled) return;
		appState.openKeyboard(inputEl);
		setTimeout(() => {
			inputEl?.select();
		}, 50);
	}

	// ✅ При вводе с физической клавиатуры
	function handleInput(e) {
		const input = e.currentTarget;
		let val = input.value;

		// Нормализация
		val = val.replace(',', '.');

		// Разрешаем промежуточные состояния: "5.", "15."
		const cleaned = val.replace(/[^\d.]/g, '');
		const parts = cleaned.split('.');
		const result = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;

		displayValue = result;

		// Если результат — полное число, обновляем value
		if (result && !result.endsWith('.')) {
			value = parseInput(result);
		}
	}

	// ✅ По blur — финализация
	function handleBlur() {
		if (displayValue.endsWith('.')) {
			displayValue = displayValue.slice(0, -1);
		}
		value = parseInput(displayValue);
		displayValue = toDisplay(value);
	}

	// ✅ Физическая клавиатура: Enter, Tab, Escape
	function handleKeyDown(e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleBlur();
			isKeyboardOpen = false;
			inputEl?.blur();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			isKeyboardOpen = false;
			inputEl?.blur();
		}
	}

	// ✅ Закрытие клавиатуры извне
	function closeKeyboard() {
		isKeyboardOpen = false;
		handleBlur();
	}

	onMount(() => {
		displayValue = toDisplay(value);
	});
</script>

<div class="input-number-field {customClass}">
	{#if label}
		<span class="input-label">{label}</span>
	{/if}

	<input
		bind:this={inputEl}
		type="text"
		inputmode="decimal"
		class="number-input"
		class:disabled
		{disabled}
		value={displayValue}
		oninput={handleInput}
		onfocus={handleFocus}
		onblur={handleBlur}
		onkeydown={handleKeyDown}
	/>
</div>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.input-number-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;

		.input-label {
			font-size: 0.85rem;
			color: $clr-text-accent;
			opacity: 0.8;
		}

		.number-input {
			width: 100%;
			height: 44px;
			padding: 0 14px;
			border-radius: 12px;
			border: 2px solid rgba(255, 255, 255, 0.2);
			background: $clr-bg-card;
			color: $clr-text-main;
			font-family: inherit;
			font-size: 1rem;
			font-weight: 600;
			outline: none;
			box-sizing: border-box;
			transition: border-color 0.2s ease;

			&:hover,
			&:focus {
				border-color: $clr-teal;
			}

			&:focus {
				box-shadow:
					inset 2px 2px 5px rgba(0, 0, 0, 0.5),
					inset -2px -2px 5px rgba(255, 255, 255, 0.05);
			}

			&.disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		}
	}
</style>
