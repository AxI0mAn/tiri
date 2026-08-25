<script>
	//src/lib/components/input/InputNumber.svelte

	/**
	 * @typedef {Object} Props
	 * @property {number} [value=0]
	 * @property {number} [min=0]
	 * @property {number} [max=Infinity]
	 * @property {number} [step=1]
	 * @property {string} [label='']
	 * @property {string} [customClass='']
	 * @property {boolean} [disabled=false]
	 */

	let {
		value = $bindable(0),
		min = 0,
		max = Infinity,
		step = 1,
		label = '',
		customClass = '',
		disabled = false
	} = $props();

	function sanitizeNumber(val) {
		const num = typeof val === 'number' ? val : parseFloat(val);
		if (isNaN(num)) return typeof min === 'number' && isFinite(min) ? min : 0;
		return Math.min(Math.max(num, min), max);
	}

	// 1. Фильтр: пропускаем только цифры, точку и запятую
	function handleBeforeInput(e) {
		if (e.data && !/^[0-9.,]$/.test(e.data)) {
			e.preventDefault();
		}
	}

	// 2. Ввод: заменяем запятую на точку и обновляем значение
	function handleInput(e) {
		const input = e.currentTarget;

		// Автозамена запятой на точку
		if (input.value.includes(',')) {
			input.value = input.value.replace(',', '.');
		}

		if (input.value === '' || input.value === '.') return;
		value = sanitizeNumber(input.value);
	}

	function increment() {
		value = sanitizeNumber(Number((value + step).toFixed(10)));
	}

	function decrement() {
		value = sanitizeNumber(Number((value - step).toFixed(10)));
	}
</script>

<div class="input-number-field {customClass}">
	{#if label}
		<span class="input-label">{label}</span>
	{/if}

	<div class="control-group">
		<button type="button" class="btn-step" onclick={decrement} aria-label="Decrease"> − </button>

		<input
			type="text"
			inputmode="decimal"
			class="number-input"
			{disabled}
			{value}
			onbeforeinput={handleBeforeInput}
			oninput={handleInput}
			onblur={() => (value = sanitizeNumber(value))}
			onfocus={(e) => e.currentTarget.select()}
		/>

		<button type="button" class="btn-step" onclick={increment} aria-label="Increase"> + </button>
	</div>
</div>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.input-number-field {
		display: flex;
		flex-direction: column;
		gap: 6px;

		.input-label {
			font-size: 0.85rem;
			color: $clr-text-accent;
			opacity: 0.8;
		}

		.control-group {
			display: inline-flex;
			justify-content: space-around;
			align-items: center;

			padding: 4px;
			height: 44px;
			border-radius: 12px;
			border: 2px solid rgba(255, 255, 255, 0.2);
			background: $clr-bg-card;
			overflow: hidden;
			transition: border-color 0.2s ease;

			&:hover {
				border-color: $clr-teal;
			}

			&:focus-within {
				border-color: $clr-teal;
				box-shadow:
					inset 2px 2px 5px rgba(0, 0, 0, 0.5),
					inset -2px -2px 5px rgba(255, 255, 255, 0.05);
			}
		}

		.btn-step {
			width: 1rem;
			height: 100%;
			background: transparent;
			border: none;
			color: $clr-text-main;
			font-size: 1.2rem;
			cursor: pointer;
			user-select: none;
			transition:
				background 0.15s ease,
				color 0.15s ease;

			&:hover {
				background: $clr-teal;
				color: $clr-bg-dark;
			}

			&:active {
				background: $clr-pink;
				color: $clr-white;
			}
		}

		.number-input {
			width: 3rem;
			height: 100%;
			border: none;
			background: transparent;
			text-align: center;
			color: $clr-text-main;
			font-size: 0.95rem;
			font-weight: 600;
			outline: none;
		}
	}
</style>
