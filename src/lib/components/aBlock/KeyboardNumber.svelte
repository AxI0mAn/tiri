<!-- src/lib/components/aBlock/KeyboardNumber.svelte -->

<script>
	import { appStore } from '$lib/store/appStore.svelte.js';
	import { appState } from '$lib/store/appState.svelte.js';

	// ===== LOCALIZATION =====
	const ruLangs = ['RU', 'UA', 'UK'];
	let decimalSeparator = $derived(ruLangs.includes(appStore.lang) ? ',' : '.');
	const INTERNAL_SEPARATOR = '.';

	// ===== СОСТОЯНИЕ из appState =====
	let isOpen = $derived(appState.keyboardOpen);
	let targetInput = $derived(appState.keyboardTarget);

	// Флаг: сейчас идёт Next, не открывать клавиатуру повторно
	let isNexting = false;

	// Высота клавиатуры в px
	let keyboardHeight = $state(300);

	// DOM-элемент клавиатуры
	let keyboardEl = $state(null);

	let currentValue = $state('');
	let cursorPos = $state(0);

	// ✅ Синхронизация при смене targetInput (в т.ч. при Next)
	$effect(() => {
		if (isOpen && targetInput) {
			// Загружаем значение из нового инпута
			currentValue = targetInput.value || '';
			cursorPos = currentValue.length;
		}
	});

	// ✅ Синхронизация в input при изменении
	$effect(() => {
		if (isOpen && targetInput && targetInput.value !== currentValue) {
			targetInput.value = currentValue;
			targetInput.setSelectionRange(cursorPos, cursorPos);
		}
	});

	// ✅ Измеряем реальную высоту клавиатуры при каждом открытии/изменении
	$effect(() => {
		if (isOpen && keyboardEl) {
			const height = keyboardEl.getBoundingClientRect().height;
			keyboardHeight = height;
		}
	});

	/**
	 * Прокручивает страницу так, чтобы инпут был виден над клавиатурой
	 * @param {HTMLInputElement} input
	 */
	function scrollInputAboveKeyboard(input) {
		if (!input) return;

		const viewportHeight = window.innerHeight;
		const availableHeight = viewportHeight - keyboardHeight;

		const rect = input.getBoundingClientRect();

		// ✅ Если инпут уже виден над клавиатурой — ничего не делаем
		if (rect.bottom < availableHeight && rect.top > 0) return;

		// ✅ Вычисляем целевую позицию: инпут должен быть в верхней части
		// доступной области (не в центре, а с отступом от клавиатуры)
		const offset = 40; // отступ сверху от инпута
		const targetScrollY = window.scrollY + rect.top - offset;

		window.scrollTo({
			top: targetScrollY,
			behavior: 'smooth'
		});
	}

	// ===== ВАЛИДАЦИЯ =====
	function canInsert(char, value, position) {
		if (/\d/.test(char)) return true;
		if (char === '.' || char === ',' || char === decimalSeparator) {
			if (value.includes(INTERNAL_SEPARATOR)) return false;
			if (position === 0) return false;
			return true;
		}
		return false;
	}

	// ===== ВСТАВКА =====
	function insertChar(char) {
		if (!targetInput) return;

		const start = targetInput.selectionStart ?? currentValue.length;
		const end = targetInput.selectionEnd ?? start;

		if (!canInsert(char, currentValue, start)) return;

		const normalized = char === ',' ? INTERNAL_SEPARATOR : char;
		const before = currentValue.slice(0, start);
		const after = currentValue.slice(end);
		const newValue = before + normalized + after;

		// ✅ Обновить и состояние, и значение в инпуте
		currentValue = newValue;
		cursorPos = start + 1;
		targetInput.value = newValue;
		targetInput.setSelectionRange(cursorPos, cursorPos);
		targetInput.focus();
	}

	// ===== BACKSPACE =====
	function handleBackspace() {
		if (!targetInput) return;

		const start = targetInput.selectionStart ?? currentValue.length;
		const end = targetInput.selectionEnd ?? start;

		let newValue, newPos;

		if (start !== end) {
			newValue = currentValue.slice(0, start) + currentValue.slice(end);
			newPos = start;
		} else if (start > 0) {
			newValue = currentValue.slice(0, start - 1) + currentValue.slice(start);
			newPos = start - 1;
		} else {
			return;
		}

		// ✅ Обновить и состояние, и значение в инпуте
		currentValue = newValue;
		cursorPos = newPos;
		targetInput.value = newValue;
		targetInput.setSelectionRange(newPos, newPos);
		targetInput.focus();
	}

	// ===== ENTER =====
	function handleEnter() {
		if (currentValue.endsWith(INTERNAL_SEPARATOR)) {
			currentValue = currentValue.slice(0, -1);
		}

		if (targetInput) {
			// ✅ Установить финальное значение
			targetInput.value = currentValue;

			// ✅ Явно вызвать input через InputEvent
			try {
				targetInput.dispatchEvent(new InputEvent('input', { bubbles: true }));
			} catch {
				targetInput.dispatchEvent(new Event('input', { bubbles: true }));
			}

			// ✅ Также вызвать blur для финализации в InputNumber
			targetInput.dispatchEvent(new Event('blur', { bubbles: true }));
			targetInput.blur();
		}

		appState.closeKeyboard();

		if (typeof window !== 'undefined' && window.history.state?.keyboardModal) {
			window.history.back();
		}
	}

	// ===== NEXT — циклический =====
	function handleNext() {
		if (!targetInput) return;

		/** @type {NodeListOf<HTMLInputElement>} */
		const allInputs = document.querySelectorAll('.number-input');
		const arr = Array.from(allInputs);
		const idx = arr.indexOf(targetInput);

		if (idx === -1 || arr.length === 0) return;

		// ✅ Циклический переход
		const nextIdx = (idx + 1) % arr.length;
		const nextInput = arr[nextIdx];

		if (!nextInput) return;

		// Сохранить текущее значение
		if (currentValue.endsWith(INTERNAL_SEPARATOR)) {
			currentValue = currentValue.slice(0, -1);
		}
		targetInput.value = currentValue;
		try {
			targetInput.dispatchEvent(new InputEvent('input', { bubbles: true }));
		} catch {
			targetInput.dispatchEvent(new Event('input', { bubbles: true }));
		}

		// ✅ Устанавливаем флаг ДО смены фокуса
		isNexting = true;

		// ✅ Переключаем targetInput в appState (БЕЗ вызова openKeyboard)
		appState.keyboardTarget = nextInput;

		// ✅ Фокус на новый инпут
		setTimeout(() => {
			nextInput.focus();
			nextInput.select();

			// ✅ Прокручиваем с учётом высоты клавиатуры, чтоб инпут был над клавиатурой
			scrollInputAboveKeyboard(nextInput);

			// ✅ Сбрасываем флаг после того, как фокус установлен
			setTimeout(() => {
				isNexting = false;
			}, 100);
		}, 0);
	}

	// ===== ЗАКРЫТИЕ =====
	function handleClose() {
		targetInput?.blur();
		appState.closeKeyboard();

		// ✅ Откатываем запись из истории
		if (typeof window !== 'undefined' && window.history.state?.keyboardModal) {
			window.history.back();
		}
	}

	// ===== КНОПКИ =====
	function makeKey(label, value, cls = '') {
		return { label, value, cls };
	}

	let keys = $derived([
		makeKey('1', '1'),
		makeKey('2', '2'),
		makeKey('3', '3'),
		makeKey('4', '4'),
		makeKey('5', '5'),
		makeKey('6', '6'),
		makeKey('7', '7'),
		makeKey('8', '8'),
		makeKey('9', '9'),
		makeKey(decimalSeparator, INTERNAL_SEPARATOR, 'key-decimal'),
		makeKey('0', '0'),
		makeKey('⌫', '__backspace__', 'key-backspace')
	]);

	function handleKeyPress(k) {
		if (k.value === '__backspace__') {
			handleBackspace();
		} else {
			insertChar(k.value);
		}
	}

	// ✅ Предотвращение потери фокуса при клике на кнопку
	function preventFocusLoss(e) {
		e.preventDefault();
	}
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="keyboard-backdrop" role="presentation" onclick={handleClose}></div>

	<div class="keyboard-container" bind:this={keyboardEl} class:left-handed={appStore.left_handed}>
		<div class="keyboard">
			<div class="key-grid">
				{#each keys as k}
					<button
						type="button"
						class="key {k.cls}"
						onmousedown={preventFocusLoss}
						onclick={() => handleKeyPress(k)}
					>
						{k.label}
					</button>
				{/each}
			</div>

			<div class="action-column">
				<button
					type="button"
					class="action-btn action-next"
					onmousedown={preventFocusLoss}
					onclick={handleNext}
				>
					<span>next</span>
					<span class="arrow">↓</span>
				</button>
				<button
					type="button"
					class="action-btn action-enter"
					onmousedown={preventFocusLoss}
					onclick={handleEnter}
				>
					<span>Enter</span>
					<span class="arrow">↵</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	/* ===== ФОН (затемнение) ===== */
	.keyboard-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.3);
		z-index: 9998;
	}

	/* ===== КОНТЕЙНЕР ===== */
	.keyboard-container {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 9999;
		display: flex;
		justify-content: center;
		padding: 8px;
		pointer-events: none;
	}

	.keyboard {
		display: grid;
		grid-template-columns: 3fr 1fr;
		gap: 8px;
		width: 100%;
		max-width: 360px;
		background: $clr-bg-card;
		border-radius: 16px 16px 0 0;
		padding: 12px;
		box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.4);
		pointer-events: auto;
	}

	/* ✅ Left-handed: колонка действий слева */
	.left-handed .keyboard {
		grid-template-columns: 1fr 3fr;
	}

	.left-handed .key-grid {
		order: 2;
	}

	.left-handed .action-column {
		order: 1;
	}

	/* ===== СЕТКА ЦИФР (3×4) ===== */
	.key-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
	}

	.key {
		aspect-ratio: 1 / 1;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: 12px;
		background: $clr-bg;
		color: $clr-text-main;
		font-size: 1.4rem;
		font-weight: 600;
		cursor: pointer;
		user-select: none;
		transition:
			background 0.15s ease,
			transform 0.1s ease;
		-webkit-tap-highlight-color: transparent;

		&:hover {
			background: rgba($clr-teal-rgb, 0.2);
		}

		&:active {
			background: $clr-teal;
			color: white;
			transform: scale(0.95);
		}

		&.key-decimal {
			font-size: 1.6rem;
		}

		&.key-backspace {
			font-size: 1.3rem;
			color: $clr-pink;
		}
	}

	/* ===== КОЛОНКА ДЕЙСТВИЙ (next, Enter) ===== */
	.action-column {
		display: grid;
		grid-template-rows: 1fr 1fr;
		gap: 6px;
	}

	.action-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		border: none;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		user-select: none;
		transition:
			background 0.15s ease,
			transform 0.1s ease;
		-webkit-tap-highlight-color: transparent;

		.arrow {
			font-size: 1.2rem;
			opacity: 0.7;
		}
	}

	.action-next {
		background: rgba($clr-teal-rgb, 0.15);
		color: $clr-teal;

		&:hover {
			background: rgba($clr-teal-rgb, 0.3);
		}

		&:active {
			background: $clr-teal;
			color: white;
			transform: scale(0.95);
		}
	}

	.action-enter {
		background: $clr-teal;
		color: white;

		&:hover {
			background: rgba($clr-teal-rgb, 0.85);
		}

		&:active {
			transform: scale(0.95);
		}
	}

	/* ===== АДАПТИВ ===== */
	@media (min-width: 768px) {
		.keyboard-container {
			padding: 16px;
		}

		.keyboard {
			border-radius: 16px;
			max-width: 360px;
		}
	}

	@media (max-width: 500px) {
		.keyboard-container {
			padding: 0;
		}

		.keyboard {
			max-width: 100%;
			border-radius: 16px 16px 0 0;
		}
	}
</style>
