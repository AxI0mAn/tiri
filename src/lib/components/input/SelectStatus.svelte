<script module>
	// Общее состояние для всех экземпляров: хранит id текущего открытого SelectStatus
	let openId = $state(null);
</script>

<script>
	// src/lib/components/input/SelectStatus.svelte

	import { onMount } from 'svelte';
	/**
	 * @typedef {'use' | 'not_use' | 'always'} StatusValue
	 * @typedef {Object} Props
	 * @property {StatusValue} [value='use'] - Выбранное значение
	 * @property {boolean} [disabled=false] - Состояние блокировки
	 * @property {string} [customClass=''] - Дополнительные CSS-классы
	 */

	let { value = $bindable('use'), disabled = false, customClass = '' } = $props();

	// Уникальный ID для текущего экземпляра
	const instanceId = Symbol();
	let containerRef = $state(null);

	// Проверяем, открыт ли именно этот экземпляр
	let isOpen = $derived(openId === instanceId);

	function toggleOpen(e) {
		if (disabled) return;
		openId = isOpen ? null : instanceId;
	}

	// Закрытие при клике снаружи
	onMount(() => {
		function handleOutsideClick(e) {
			// Если селектор открыт и кликнули ВНЕ контейнера — закрываем
			if (openId === instanceId && containerRef && !containerRef.contains(e.target)) {
				openId = null;
			}
		}

		// Capture-фаза гарантирует обработку клика вне зависимости от stopPropagation
		window.addEventListener('click', handleOutsideClick, true);
		return () => window.removeEventListener('click', handleOutsideClick, true);
	});

	const options = [
		{ value: 'use', symbol: '✅', label: 'use' },
		{ value: 'not_use', symbol: '❌', label: 'not use' }
		// { value: 'required', symbol: ' ', label: 'always' } // это не нужно, потому что есть required: true,
	];

	// Вычисляем текущую выбранную опцию
	let selectedOption = $derived(options.find((opt) => opt.value === value) || options[0]);

	function selectOption(optValue) {
		value = optValue;
		isOpen = false;
	}

	// Закрытие при клике снаружи и по клавише Escape
	function handleFocusOut(e) {
		// Если новый сфокусированный элемент находится ВНЕ текущего контейнера — закрываем
		if (containerRef && !containerRef.contains(e.relatedTarget)) {
			isOpen = false; // или openId = null
		}
	}

	function handleTriggerKeyDown(e) {
		if (e.key === 'Escape' && isOpen) {
			isOpen = false;
			e.stopPropagation();
		}
	}
</script>

<div
	bind:this={containerRef}
	class="select-status {customClass}"
	class:is-open={isOpen}
	class:is-disabled={disabled}
	onfocusout={handleFocusOut}
>
	<!-- Главная кнопка -->
	<button
		type="button"
		class="status-trigger"
		onclick={toggleOpen}
		onkeydown={handleTriggerKeyDown}
		{disabled}
		aria-label="Выбрать статус"
		aria-expanded={isOpen}
		aria-haspopup="listbox"
	>
		<span class="symbol {selectedOption.value}">{selectedOption.symbol}</span>
	</button>

	<!-- Выпадающий список -->
	{#if isOpen}
		<div class="status-dropdown" role="listbox" tabindex="-1">
			{#each options as option}
				<button
					type="button"
					class="dropdown-item"
					class:is-selected={option.value === value}
					onclick={() => selectOption(option.value)}
					role="option"
					aria-selected={option.value === value}
				>
					<span class="symbol {option.value}">{option.symbol}</span>
					<span class="label">{option.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<!-- 
<script>
  import SelectStatus from './SelectStatus.svelte';

  let currentStatus = $state('use'); // По умолчанию '✓' - use
</script>

<div class="demo">
  <label class="demo-label">Статус правила:</label>
  <SelectStatus bind:value={currentStatus} />

  <p class="result">Текущий выбор в коде: <strong>{currentStatus}</strong></p>
</div>

<style lang="scss">
  .demo {
    display: flex;
    align-items: center;
    gap: 12px;

    .demo-label {
      color: #fff;
      font-size: 0.9rem;
    }

    .result {
      margin-left: 20px;
      color: #fff;

      strong {
        color: $clr-teal;
      }
    }
  }
</style>
-->

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.select-status {
		position: relative;
		display: inline-block;
		outline: none;

		/* 1. УВЕЛИЧЕННЫЙ В 1.5 РАЗА ЧЕКБОКС (22px * 1.5 = 33px) */
		.status-trigger {
			width: 33px;
			height: 33px;
			border-radius: 8px;
			border: 2px solid rgba(255, 255, 255, 0.2);
			background: $clr-bg-card;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			user-select: none;
			box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.4);
			transition:
				border-color 0.2s ease,
				box-shadow 0.2s ease,
				transform 0.1s ease;
			padding: 0;

			&:hover {
				border-color: $clr-teal;
			}

			&:focus-visible {
				outline: none;
				border-color: $clr-teal;
				box-shadow: 0 0 0 2px rgba($clr-teal, 0.4);
			}

			&:active {
				transform: scale(0.95);
			}
		}

		/* 2. СИМВОЛЫ И ИХ ЦВЕТА */
		.symbol {
			font-weight: 800;
			line-height: 1;

			&.use {
				color: $clr-teal;
				font-size: 1.25rem;
			}

			&.not_use {
				color: $clr-pink;
				font-size: 1.2rem;
			}

			&.always {
				color: $clr-bg;
				font-size: 0.95rem;
				letter-spacing: -1px;
			}
		}

		/* 3. ВЫПАДАЮЩЕЕ МЕНЮ (ПОЛНЫЕ СТРОКИ) */
		.status-dropdown {
			position: absolute;
			top: calc(100% + 6px);
			right: 0;
			z-index: 20;
			min-width: 130px;
			padding: 6px;
			background: $clr-bg-dark;
			border: 2px solid $clr-teal;
			border-radius: 12px;
			box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
			display: flex;
			flex-direction: column;
			gap: 4px;
		}

		.dropdown-item {
			display: flex;
			align-items: center;
			gap: 10px;
			width: 100%;
			padding: 8px 10px;
			border: none;
			background: transparent;
			border-radius: 6px;
			cursor: pointer;
			text-align: left;
			transition: background 0.15s ease;

			.symbol {
				width: 20px;
				text-align: center;
			}

			.label {
				color: $clr-text-accent;
				font-size: 1rem;
				font-weight: 500;
			}

			&:hover {
				background: rgba(255, 255, 255, 0.1);
			}

			&.is-selected {
				background: rgba($clr-teal, 0.15);

				.label {
					color: $clr-teal;
					font-weight: 700;
				}
			}
		}

		/* СОСТОЯНИЕ ОТКРЫТОГО СПИСКА */
		&.is-open .status-trigger {
			border-color: $clr-teal;
			box-shadow:
				inset 2px 2px 5px rgba(0, 0, 0, 0.5),
				inset -2px -2px 5px rgba(255, 255, 255, 0.05);
		}

		&.is-disabled {
			opacity: 0.5;
			pointer-events: none;
		}
	}
</style>
