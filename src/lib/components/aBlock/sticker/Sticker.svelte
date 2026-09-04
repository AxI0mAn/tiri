<!-- src/routes/(date)/allNotes/components/Sticker.svelte -->
<script>
	import { fly } from 'svelte/transition';

	let { sticker, isExpanded = false } = $props();

	let isFlipped = $state(false);
	let isHovered = $state(false);

	function handleClick() {
		isFlipped = !isFlipped;
	}

	// ✅ Обработка клавиатуры для доступности
	function handleKeyDown(e) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}

	// Стиль для размера
	let sizeClass = $derived(isExpanded ? 'expanded' : 'normal');
</script>

<div
	class="sticker-wrapper"
	class:expanded={isExpanded}
	class:flipped={isFlipped}
	style="background: {sticker.color};"
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={handleKeyDown}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	transition:fly={{
		duration: 300,
		delay: 0,
		opacity: 0,
		y: 20
	}}
>
	<!-- Фронтальная сторона -->
	<div class="sticker-front">
		<div class="sticker-date">{sticker.dateStr}</div>

		<!-- ✅ Показываем name только если он есть -->
		{#if sticker.name && sticker.name.trim().length > 0}
			<div class="sticker-name">{sticker.name}</div>
		{:else}
			<div class="sticker-name" style="opacity: 0.4;">Без имени</div>
		{/if}

		<!-- ✅ Показываем phone только если он есть -->
		{#if sticker.phone && sticker.phone.trim().length > 0}
			<div class="sticker-phone">{sticker.phone}</div>
		{/if}

		<div class="sticker-type">
			{sticker.type === 'reminder' ? '📅 Напоминание' : '📝 Заметка'}
		</div>
	</div>

	<!-- Обратная сторона (текст) -->
	<div class="sticker-back">
		<div class="sticker-text">{sticker.text}</div>
	</div>

	{#if isHovered && !isExpanded}
		<div class="sticker-hint">🔄 клик для переворота</div>
	{/if}
</div>

<style lang="scss">
	.sticker-wrapper {
		position: relative;
		width: 300px;
		height: 300px;
		border-radius: 16px;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.1),
			0 1px 3px rgba(0, 0, 0, 0.06);
		cursor: pointer;
		transform-style: preserve-3d;
		transition:
			transform 0.6s cubic-bezier(0.23, 1, 0.32, 1),
			width 0.3s ease,
			height 0.3s ease,
			box-shadow 0.3s ease,
			z-index 0s;
		z-index: 1;
		padding: 16px;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		user-select: none;
		// overflow: hidden;
		will-change: transform;
	}

	.sticker-wrapper:hover:not(.expanded) {
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
		transform: translateY(-4px);
	}

	.sticker-wrapper.flipped {
		transform: rotateY(180deg);
	}

	.sticker-wrapper.expanded {
		width: 30vw;
		height: 30vw;
		max-width: 90vw;
		max-height: 90vw;
		z-index: 100;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) scale(1) !important;
		cursor: pointer;
	}

	.sticker-wrapper.expanded.flipped {
		transform: translate(-50%, -50%) rotateY(180deg) !important;
	}

	.sticker-front,
	.sticker-back {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		padding: 16px;
		box-sizing: border-box;
		transform-style: preserve-3d;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		border-radius: 16px;
	}

	/* ✅ Фронтальная сторона — видима по умолчанию */
	.sticker-front {
		background: var(--sticker-color, rgb(246, 250, 252));
		transform: rotateY(0deg);
	}

	/* ✅ Обратная сторона — скрыта, пока не перевернута */
	.sticker-back {
		background: rgba(255, 255, 255, 0.95);
		// backdrop-filter: blur(8px);
		transform: rotateY(180deg);
		box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.05);
	}

	.sticker-date {
		font-size: 14px;
		font-weight: 500;
		color: rgba(0, 0, 0, 0.5);
		margin-bottom: 8px;
	}

	.sticker-name {
		font-size: 22px;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 4px;
		word-break: break-word;
	}

	.sticker-phone {
		font-size: 16px;
		color: rgba(0, 0, 0, 0.6);
		margin-bottom: 8px;
		font-family: 'Courier New', monospace;
	}

	.sticker-type {
		font-size: 12px;
		color: rgba(0, 0, 0, 0.4);
		margin-top: auto;
	}

	.sticker-text {
		font-size: 18px;
		line-height: 1.6;
		color: #1a1a1a;
		overflow-y: auto;
		max-height: 100%;
		padding: 8px;
		word-break: break-word;
	}

	.sticker-hint {
		position: absolute;
		bottom: 8px;
		right: 12px;
		font-size: 12px;
		color: rgba(0, 0, 0, 0.5);
		pointer-events: none;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.4;
		}
		50% {
			opacity: 1;
		}
	}

	/* Адаптив */
	@media (max-width: 768px) {
		.sticker-wrapper {
			width: 200px;
			height: 200px;
		}

		.sticker-wrapper.expanded {
			width: 80vw;
			height: 80vw;
		}

		.sticker-name {
			font-size: 18px;
		}

		.sticker-text {
			font-size: 16px;
		}
	}
</style>
