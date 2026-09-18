<!-- src/lib/components/input/Select.svelte -->
<script>
	import { clickOutside } from '$lib/utils/clickOutside';

	/**
	 * @typedef {Object} Option
	 * @property {string|number} value
	 * @property {string} label
	 */

	/**
	 * @typedef {Object} Props
	 * @property {string|number} [value='']
	 * @property {Option[]} [options=[]]
	 * @property {string} [label='']
	 * @property {string} [placeholder='Выберите из списка']
	 * @property {boolean} [disabled=false]
	 * @property {string} [customClass='']
	 */

	/** @type {Props} */
	let {
		value = $bindable(''),
		options = [],
		label = '',
		placeholder = 'Выберите из списка',
		disabled = false,
		customClass = ''
	} = $props();

	// ===== СОСТОЯНИЕ =====
	let isOpen = $state(false);
	let buttonEl = $state(null);
	let dropdownEl = $state(null);
	let dropdownStyle = $state('');
	let isPopping = false;

	// ✅ Отображаемое значение (label выбранной опции или placeholder)
	let displayValue = $derived.by(() => {
		if (value === '' || value === null || value === undefined) {
			return placeholder;
		}
		const found = options.find((opt) => opt.value === value);
		return found ? found.label : placeholder;
	});

	// ✅ Выбрана ли опция (для стиля)
	let hasValue = $derived(value !== '' && value !== null && value !== undefined);

	// ===== ПЕРЕКЛЮЧЕНИЕ =====
	function toggleDropdown() {
		if (disabled) return;

		if (isOpen) {
			closeDropdown();
		} else {
			openDropdown();
		}
	}

	// ===== ОТКРЫТИЕ =====
	function openDropdown() {
		isOpen = true;

		setTimeout(() => {
			updateDropdownPosition();
		}, 0);
	}
	// ===== ЗАКРЫТИЕ =====
	function closeDropdown() {
		isOpen = false;
	}

	// ===== ВЫБОР ОПЦИИ =====
	/**
	 * @param {Option} option
	 */
	function selectOption(option) {
		value = option.value;
		closeDropdown();
	}

	// ===== ПОЗИЦИОНИРОВАНИЕ =====
	function updateDropdownPosition() {
		if (!buttonEl || !dropdownEl) return;

		const buttonRect = buttonEl.getBoundingClientRect();
		const dropdownRect = dropdownEl.getBoundingClientRect();

		const viewportHeight = window.innerHeight;
		const viewportWidth = window.innerWidth;

		// ✅ Проверяем место снизу и сверху
		const spaceBelow = viewportHeight - buttonRect.bottom;
		const spaceAbove = buttonRect.top;

		const dropdownHeight = dropdownRect.height;
		const dropdownWidth = dropdownRect.width;

		// ✅ По вертикали
		let positionV = 'below';
		if (spaceBelow < dropdownHeight + 8) {
			// Снизу мало места
			if (spaceAbove >= dropdownHeight + 8) {
				// Сверху достаточно — открываем вверх
				positionV = 'above';
			} else {
				// Ни сверху, ни снизу — открываем вниз (как есть)
				positionV = 'below';
			}
		}

		// ✅ По горизонтали
		let positionH = 'left';
		const spaceRight = viewportWidth - buttonRect.left;
		if (spaceRight < dropdownWidth + 8) {
			// Справа мало места — выравниваем по правому краю
			positionH = 'right';
		}

		// ✅ Применяем стили
		const styles = [];

		if (positionV === 'above') {
			styles.push('bottom: 100%', 'margin-bottom: 4px');
		} else {
			styles.push('top: 100%', 'margin-top: 4px');
		}

		if (positionH === 'right') {
			styles.push('right: 0', 'left: auto');
		} else {
			styles.push('left: 0', 'right: auto');
		}

		dropdownStyle = styles.join('; ');
	}

	// ===== ESCAPE =====
	function handleKeyDown(e) {
		if (e.key === 'Escape' && isOpen) {
			e.preventDefault();
			closeDropdown();
		}
	}

	// ===== POPSTATE (Android back) =====
	$effect(() => {
		if (isOpen) {
			const handler = (event) => {
				if (!event.state?.selectDropdown) {
					isOpen = false;
				}
			};
			window.addEventListener('popstate', handler);
			return () => window.removeEventListener('popstate', handler);
		}
	});

	// ===== KEYBOARD =====
	$effect(() => {
		if (isOpen) {
			window.addEventListener('keydown', handleKeyDown);
			return () => window.removeEventListener('keydown', handleKeyDown);
		}
	});

	// ===== РЕСАЙЗ =====
	$effect(() => {
		if (isOpen) {
			const handler = () => updateDropdownPosition();
			window.addEventListener('resize', handler);
			window.addEventListener('scroll', handler, true);
			return () => {
				window.removeEventListener('resize', handler);
				window.removeEventListener('scroll', handler, true);
			};
		}
	});
</script>

<div
	class="select-field {customClass}"
	class:is-disabled={disabled}
	class:is-open={isOpen}
	use:clickOutside={closeDropdown}
>
	{#if label}
		<label class="select-label" for="custom-select-hidden">{label}</label>
	{/if}

	<!-- ✅ Скрытый нативный select (для accessibility и форм) -->
	<select
		id="custom-select-hidden"
		class="select-hidden"
		{value}
		{disabled}
		onchange={(e) => (value = e.currentTarget.value)}
		aria-hidden="true"
		tabindex="-1"
	>
		{#if placeholder}
			<option value="" disabled selected={value === ''}>{placeholder}</option>
		{/if}
		{#each options as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>

	<!-- ✅ Видимая кнопка -->
	<button
		type="button"
		class="select-button"
		class:has-value={hasValue}
		bind:this={buttonEl}
		onclick={toggleDropdown}
		{disabled}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
	>
		<span class="select-value">{displayValue}</span>

		<span class="select-arrow" aria-hidden="true">
			<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
				<polygon points="0,0 64,32 0,64" />
			</svg>
		</span>
	</button>

	<!-- ✅ Выпадающий список -->
	{#if isOpen}
		<div
			class="select-dropdown withScroll"
			bind:this={dropdownEl}
			style={dropdownStyle}
			role="listbox"
			aria-labelledby="custom-select-hidden"
		>
			{#each options as option}
				<button
					type="button"
					class="select-option"
					class:is-selected={option.value === value}
					onclick={() => selectOption(option)}
					role="option"
					aria-selected={option.value === value}
				>
					{option.label}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.select-field {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: fit-content;
		width: max-content;

		/* ✅ Скрытый нативный select */
		.select-hidden {
			position: absolute;
			opacity: 0;
			pointer-events: none;
			width: 0;
			height: 0;
		}

		.select-label {
			font-size: 0.85rem;
			color: $clr-text-main;
			opacity: 0.8;
			user-select: none;
		}

		/* ✅ Видимая кнопка */
		.select-button {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;

			width: 100%;
			height: 44px;
			padding: 0 14px;

			border-radius: 12px;
			border: 2px solid $clr-white;
			background: $clr-bg-card;
			color: $clr-text-accent;

			font-family: inherit;
			font-size: 0.95rem;
			font-weight: 500;

			cursor: pointer;
			box-sizing: border-box;
			text-align: left;

			outline: none;
			transition:
				border-color 0.2s ease,
				box-shadow 0.2s ease;

			-webkit-tap-highlight-color: transparent;
			user-select: none;

			&:hover:not(:disabled) {
				border-color: $clr-teal;
			}

			&:focus-visible {
				border-color: $clr-teal;
				box-shadow:
					inset 2px 2px 5px rgba(0, 0, 0, 0.5),
					inset -2px -2px 5px rgba(255, 255, 255, 0.05);
			}

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}

			.select-value {
				flex: 1;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			/* ✅ Стрелка ▼ → ▲ при открытии */
			.select-arrow {
				flex-shrink: 0;
				display: flex;
				align-items: center;
				justify-content: center;
				width: 16px;
				height: 16px;

				svg {
					width: 100%;
					height: 100%;
					/* По умолчанию ▼ */
					fill: $clr-text-accent;
					transform: rotate(90deg);
					transition: transform 0.2s ease;
				}
			}
		}

		/* ✅ Стрелка ▲ при открытии */
		&.is-open .select-button .select-arrow svg {
			transform: rotate(-90deg);
		}

		/* ✅ Выпадающий список */
		.select-dropdown {
			position: absolute;
			z-index: 9999;

			min-width: 100%;
			width: max-content;
			max-width: 90vw;
			max-height: 80vh;

			padding: 6px 0;

			background-color: $clr-teal-soft;
			border: 1px solid $clr-bg-dark;
			border-radius: 8px;
			box-shadow: $shadow-deep;

			/* ✅ Анимация fade + scale */
			animation: dropdownFadeIn 0.15s ease;

			-webkit-tap-highlight-color: transparent;
		}

		@keyframes dropdownFadeIn {
			from {
				opacity: 0;
				transform: scale(0.9);
			}
			to {
				opacity: 1;
				transform: scale(1);
			}
		}

		/* ✅ Опция */
		.select-option {
			display: block;
			width: 100%;

			padding: 10px 15px;

			border: none;
			background: none;

			font-family: inherit;
			font-size: 0.95rem;
			text-align: left;
			color: $clr-text-main;

			cursor: pointer;

			transition: background-color 0.15s ease;

			-webkit-tap-highlight-color: transparent;

			white-space: nowrap;

			&:hover {
				background-color: rgba(255, 255, 255, 0.5);
			}

			&:active {
				background-color: rgba(0, 0, 0, 0.1);
			}

			&:focus-visible {
				outline: 2px solid $clr-teal;
				outline-offset: -2px;
			}

			/* ✅ Активная опция */
			&.is-selected {
				background-color: $clr-teal;
				color: $clr-bg-dark;
				font-weight: 600;
			}
		}

		/* ✅ Disabled */
		&.is-disabled {
			opacity: 0.5;
			pointer-events: none;
		}
	}
</style>
