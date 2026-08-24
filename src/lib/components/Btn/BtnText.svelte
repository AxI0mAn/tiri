<script>
	// атом - единичная кнопка
	// src/lib/components/Btn/BtnText.svelte
	let {
		buttonText = '',
		onclick,
		disabled = false,
		customClass = '',
		svgContent = '', // Для svg как ?raw
		Icon = null // Для svg как ?svelte
	} = $props();
</script>

<button class="btn font-digits {customClass}" {onclick} {disabled}>
	{#if Icon}
		<Icon />
	{:else if svgContent}
		{@html svgContent}
	{/if}

	{#if buttonText}
		<span>{buttonText}</span>
	{/if}
</button>

<style lang="scss">
	.btn {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 4px 8px;
		font-size: calc(1vh + 1rem); //2rem;
		color: $clr-text-main;
		cursor: pointer;
		transition: 0.25s ease;

		// Фон и заливка
		background-color: $clr-bg-card;
		background: $grad-btn-main;
		background-size: cover;
		background-position: center;

		border-radius: 8px;

		// Свечение (Внутреннее и внешнее)
		// box-shadow:
		// 	1px 1px 4px 0px rgba($clr-bg-rgb, 0.5),
		// 	inset 0px 0px 2px $clr-teal-soft;
		box-shadow:
			inset 0px 0px 12px 2px rgba($clr-bg-dark-rgb, 0.5),
			1px 1px 1px 1px $clr-text-accent,
			-1px -1px 1px 0px $clr-teal;

		@media (orientation: portrait) and (max-width: 432px) {
			padding: 8px;
			font-size: 1.5rem;
		}
		@media (orientation: portrait) and (max-height: 670px) {
			padding: 4px;
			font-size: 1.2rem;
		}
		// --- Hover ---
		@media (hover: hover) and (pointer: fine) {
			&:hover {
				// Рамка (Берем синий из палитры)
				outline: 2px solid $clr-bg-dark;
				background-color: $clr-pink;
				// box-shadow:
				// 	0 0 4px $clr-teal-soft,
				// 	0 0 8px $clr-bg-card;
				transform: translateY(-0.5px);
				background: $grad-btn-main-inv;
				transition: all 0.35s;
			}
		}

		// --- Active ---
		&:active {
			-webkit-tap-highlight-color: transparent;
			outline: none;
			opacity: 0.5;
			background: none;
			background-color: rgba($clr-pink-rgb, 0.8);
			transform: scale(0.96) translateY(0.5px);
			// box-shadow:
			// 	0 0 2px $clr-white,
			// 	0 0 8px $clr-pink;
			box-shadow:
				inset 1px 1px 1px 1px $clr-text-accent,
				inset -1px -1px 1px 0px $clr-teal;
			transition: all 0.35s;
			color: $clr-white;
		}

		/* Стили для неактивного состояния */
		&:disabled {
			background-color: rgba($clr-pink-rgb, 0.8);
			box-shadow:
				0 0 2px $clr-white,
				0 0 8px $clr-pink;
			opacity: 0.4; /* Делаем кнопку полупрозрачной */
			cursor: not-allowed; /* Меняем курсор на "запрещено" */
			pointer-events: none; /* Отключаем ховеры и клики на уровне браузера */
		}
	}

	// Модификаторы кнопок
	.btn.btn__op {
		background: $grad-op;
		color: $clr-teal; //$clr-text-main;
	}

	.btn.btn__func {
		padding: 2px 8px;
		font-size: calc(1vh + 0.7rem); //1.25rem;
		color: $clr-text-main;
		border: transparent;
		background: transparent;
		@media (orientation: portrait) and (max-height: 670px) {
			padding: 2px 4px;
			font-size: calc(1vh + 1rem);
		}
		@media (orientation: portrait) and (max-height: 570px) {
			margin: 1px;
			padding: 2px 4px;
			font-size: calc(1vh + 0.5rem);
		}
	}

	.btn.btn__install {
		margin: 1rem auto;
		padding: 1rem 2rem;
		color: $clr-pink;
		font-size: 2rem;
		text-align: center;
		&:hover {
			color: $clr-teal-soft;
		}
	}

	.btn.btn__install--mini {
		padding: 0.25rem;
		color: $clr-pink;
	}
</style>
