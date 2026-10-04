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

	// ✅ Флаг: позиция зафиксирована после первого расчета
	let isPositionLocked = $state(false);

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
		isPositionLocked = false; // ✅ Сбрасываем при открытии

		setTimeout(() => {
			updateDropdownPosition();
			isPositionLocked = true; // ✅ Фиксируем после первого расчета
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

		// ✅ По вертикали
		let positionV = 'below';
		if (spaceBelow < dropdownHeight + 8) {
			if (spaceAbove >= dropdownHeight + 8) {
				positionV = 'above';
			} else {
				positionV = 'below';
			}
		}

		// ✅ По горизонтали: ЦЕНТР ЭКРАНА
		// Вычисляем left так, чтобы центр списка совпал с центром экрана
		// Используем transform: translateX(-50%) для точного центрирования
		const styles = ['position: fixed', 'left: 50%', 'transform: translateX(-50%)', 'z-index: 9999'];

		// ✅ Вертикаль
		if (positionV === 'above') {
			const maxHeight = Math.max(150, spaceAbove - 16);
			styles.push(`bottom: ${viewportHeight - buttonRect.top + 4}px`);
			styles.push(`max-height: ${maxHeight}px`);
		} else {
			const maxHeight = Math.max(150, spaceBelow - 16);
			styles.push(`top: ${buttonRect.bottom + 4}px`);
			styles.push(`max-height: ${maxHeight}px`);
		}

		// ✅ Гарантируем скролл
		styles.push('overflow-y: auto');
		styles.push('-webkit-overflow-scrolling: touch');

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
			const handler = (e) => {
				// ✅ Игнорируем скролл внутри самого выпадающего списка
				if (dropdownEl && e.target === dropdownEl) return;
				if (dropdownEl && dropdownEl.contains(e.target)) return;

				// ✅ Пересчитываем только при resize или скролле страницы
				updateDropdownPosition();
			};

			window.addEventListener('resize', handler);
			window.addEventListener('scroll', handler, true);
			return () => {
				window.removeEventListener('resize', handler);
				window.removeEventListener('scroll', handler, true);
			};
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
					inset 2px 2px 5px rgba($clr-black-rgb, 0.5),
					inset -2px -2px 5px rgba($clr-white-rgb, 0.05);
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

		/* ✅ Выпадающий список  */
		.select-dropdown {
			position: fixed;
			z-index: 9999;

			min-width: max-content;
			width: 30vw;
			max-width: 400px;
			/* ✅ max-height, top, bottom, left, transform задаются в JS */

			overflow-y: scroll;
			-webkit-overflow-scrolling: touch;

			padding: 0.5rem 3rem;

			background-color: $clr-teal-soft;
			border: 1px solid $clr-bg-dark;
			border-radius: 8px;
			box-shadow: $shadow-deep;

			/* ✅ Анимация fade + scale (без transform, т.к. transform используется для центрирования) */
			animation: dropdownFadeIn 0.15s ease;

			-webkit-tap-highlight-color: transparent;

			// @media screen and (max-width: 767px) {
			// 	position: fixed;
			// 	top: 1rem;
			// }
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
			min-width: 100%;

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
				background-color: rgba($clr-white-rgb, 0.5);
			}

			&:active {
				background-color: rgba($clr-black-rgb, 0.1);
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
