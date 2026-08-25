<script>
	// src/lib/components/input/InputText.svelte
	/**
	 * @typedef {Object} Props
	 * @property {string} [value='']
	 * @property {string} [placeholder='']
	 * @property {string} [label='']
	 * @property {string} [error='']
	 * @property {boolean} [disabled=false]
	 * @property {string} [customClass='']
	 */

	let {
		value = $bindable(''), // Двустороннее связывание, например с appStore.userName так: bind:value={appStore.userName}
		placeholder = '', //  Подсказка внутри пустого поля
		label = '', // Подпись над инпутом
		error = '', // Сообщение об ошибке (подсвечивает инпут)	error="Слишком короткое имя"
		disabled = false, // Блокировка ввода	disabled={true}
		customClass = '' // Дополнительный SCSS/CSS-класс
	} = $props();

	let hasError = $derived(typeof error === 'string' && error.trim().length > 0);

	function handleInput(e) {
		value = e.currentTarget.value;
	}
</script>

<div class="input-field {customClass}" class:has-error={hasError} class:is-disabled={disabled}>
	{#if label}
		<label class="input-label" for="txt-input">{label}</label>
	{/if}

	<div class="input-control">
		<input
			id="txt-input"
			type="text"
			class="input-element"
			{value}
			{placeholder}
			{disabled}
			oninput={handleInput}
			autocomplete="off"
		/>
	</div>

	{#if hasError}
		<span class="error-text">{error}</span>
	{/if}
</div>

<!-- ПРИМЕНЕНИЕ
 1. Двусторонняя связь (Рекомендуемый способ)
Чтобы изменения в инпуте автоматически обновляли userName в сторе, а изменения в сторе обновляли значение в инпуте, используйте директиву bind:value:
<script>
  import InputText from '$lib/components/InputText.svelte';
  import { appStore } from '$lib/store/appStore.svelte.js';
</script>

<InputText 
  label="Имя пользователя"
  placeholder="Введите ваше имя"
  bind:value={appStore.userName} 
/>

<p>Текущее имя: {appStore.userName}</p>

2. С обработкой валидации и ошибок
Если вам нужно динамически отображать ошибку (например, если поле пустое):

<script>
  import InputText from '$lib/components/InputText.svelte';
  import { appStore } from '$lib/store/appStore.svelte.js';

  // Динамическая валидация через $derived
  let nameError = $derived(
    appStore.userName.trim().length === 0 ? 'Имя не может быть пустым' : ''
  );
</script>

<InputText 
  label="Имя пользователя"
  bind:value={appStore.userName}
  error={nameError}
/>

3. Одностороннее чтение + обработка события
Если вы не хотите менять значение в сторе мгновенно при каждом нажатии клавиши, 
а только по событиям (например, oninput или onchange):

<script>
  import InputText from '$lib/components/InputText.svelte';
  import { appStore } from '$lib/store/appStore.svelte.js';

  function handleInput(e) {
    // Ваша логика перед записью в стор
    appStore.userName = e.target.value.toLowerCase();
  }
</script>

<InputText 
  label="Имя (только нижний регистр)"
  value={appStore.userName}
  oninput={handleInput}
/>
-->

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.input-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 10rem;
		width: fit-content;
		box-sizing: border-box;

		.input-label {
			font-size: 0.85rem;
			color: $clr-text-accent;
			opacity: 0.8;
			user-select: none;
		}

		.input-control {
			position: relative;
			width: 100%;
			border-radius: 12px;
			border: 2px solid $clr-white;
			background: $clr-bg-card;
			transition:
				border-color 0.2s ease,
				box-shadow 0.2s ease;

			&:hover {
				border-color: $clr-teal;
			}

			&:focus-within {
				border-color: $clr-teal;
				/* Вжатая неоморфная тень при фокусе */
				box-shadow:
					inset 2px 2px 5px rgba(0, 0, 0, 0.5),
					inset -2px -2px 5px rgba(255, 255, 255, 0.05);
			}
		}

		.input-element {
			width: 100%;
			height: 2rem;
			padding: 0 1rem;
			background: transparent;
			border: none;
			outline: none;
			color: $clr-text-main;
			font-size: 0.95rem;
			box-sizing: border-box;

			&::placeholder {
				color: $clr-text-accent;
			}
		}

		&.has-error {
			.input-control {
				border-color: $clr-pink;
			}
			.error-text {
				font-size: 0.75rem;
				color: $clr-pink;
			}
		}

		&.is-disabled {
			opacity: 0.5;
			pointer-events: none;
		}
	}
</style>
