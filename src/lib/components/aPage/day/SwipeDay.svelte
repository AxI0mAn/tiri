<script>
	// src/lib/components/Day/SwipeDay.svelte
	import { onMount, onDestroy } from 'svelte';
	import AssemblyDay from './AssemblyDay.svelte';
	import { getTodayDate, getDateOffset } from '$lib/utils/dateHelpers.js';

	// Состояние: массив дат для отображения (максимум 5)
	let visibleDates = $state([]);
	let activeIndex = $state(0); // индекс текущего дня в массиве
	let touchStartX = $state(0);
	let touchEndX = $state(0);
	let isTransitioning = $state(false);

	// Инициализация: сегодня + вчера + завтра
	function initDates() {
		const today = getTodayDate();
		const yesterday = getDateOffset(today, -1);
		const tomorrow = getDateOffset(today, 1);
		visibleDates = [yesterday, today, tomorrow];
		activeIndex = 1; // сегодня по центру
	}

	// Добавить день слева (позавчера)
	function prependDay() {
		const firstDate = visibleDates[0];
		const newDate = getDateOffset(firstDate, -1);
		visibleDates = [newDate, ...visibleDates];
		activeIndex = activeIndex + 1; // смещаем активный индекс
		// Ограничиваем массив 5 элементами
		if (visibleDates.length > 5) {
			visibleDates = visibleDates.slice(0, 5);
			activeIndex = Math.min(activeIndex, visibleDates.length - 1);
		}
	}

	// Добавить день справа (послезавтра)
	function appendDay() {
		const lastDate = visibleDates[visibleDates.length - 1];
		const newDate = getDateOffset(lastDate, 1);
		visibleDates = [...visibleDates, newDate];
		// Ограничиваем массив 5 элементами
		if (visibleDates.length > 5) {
			visibleDates = visibleDates.slice(1);
			activeIndex = Math.max(activeIndex - 1, 0);
		}
	}

	// Навигация: влево (предыдущий день)
	function goLeft() {
		if (isTransitioning) return;
		if (activeIndex > 0) {
			isTransitioning = true;
			activeIndex = activeIndex - 1;
			// Если дошли до первого элемента — добавляем слева
			if (activeIndex === 0) {
				prependDay();
			}
			setTimeout(() => {
				isTransitioning = false;
			}, 300);
		}
	}

	// Навигация: вправо (следующий день)
	function goRight() {
		if (isTransitioning) return;
		if (activeIndex < visibleDates.length - 1) {
			isTransitioning = true;
			activeIndex = activeIndex + 1;
			// Если дошли до последнего элемента — добавляем справа
			if (activeIndex === visibleDates.length - 1) {
				appendDay();
			}
			setTimeout(() => {
				isTransitioning = false;
			}, 300);
		}
	}

	// Обработка свайпов
	function handleTouchStart(event) {
		touchStartX = event.changedTouches[0].screenX;
	}

	function handleTouchEnd(event) {
		touchEndX = event.changedTouches[0].screenX;
		const deltaX = touchStartX - touchEndX;

		// Минимальная длина свайпа — 50px
		if (Math.abs(deltaX) < 50) return;

		if (deltaX > 0) {
			// Свайп влево → следующий день
			goRight();
		} else {
			// Свайп вправо → предыдущий день
			goLeft();
		}
	}

	// Инициализация
	onMount(() => {
		initDates();
	});
</script>

<div
	class="swipe-day"
	role="presentation"
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
>
	<!-- Контейнер с днями -->
	<div class="days-track" style="transform: translateX(-{activeIndex * 100}%);">
		{#each visibleDates as dateStr, index}
			<div class="day-slide">
				<AssemblyDay {dateStr} isActive={index === activeIndex} />
			</div>
		{/each}
	</div>

	<!-- Кнопки навигации -->
	<button
		class="nav-btn nav-left"
		onclick={goLeft}
		disabled={isTransitioning}
		aria-label="Предыдущий день"
	>
		‹
	</button>

	<button
		class="nav-btn nav-right"
		onclick={goRight}
		disabled={isTransitioning}
		aria-label="Следующий день"
	>
		›
	</button>
</div>

<style lang="scss">
	.swipe-day {
		margin: 0 auto;
		position: relative;

		width: 100%;
		height: 100%;
		overflow: hidden;

		// --- РЕЖИМ: DESKTOP & TABLET LANDSCAPE ---
		@media (min-width: 1024px), (orientation: landscape) and (min-width: 768px) {
			max-width: 60vw;
		}
		// --- РЕЖИМ: MOBILE & TABLET PORTRAIT ---
		@media (max-width: 1023px) and (orientation: portrait), (max-width: 767px) {
			max-width: 80vw;
		}
		// --- МОБИЛЬНЫЙ LANDSCAPE (6 строк, 12 колонок) ---
		@media (max-height: 500px) and (orientation: landscape) {
			max-width: 100vw;
		}
	}

	.days-track {
		display: flex;
		height: 100%;
		transition: transform 0.3s ease;
		will-change: transform;
	}

	.day-slide {
		flex: 0 0 100%;
		height: 100%;
		overflow: hidden;
	}

	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 20;
		width: 40px;
		height: 40px;
		border: none;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.4);
		color: white;
		font-size: 24px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
		backdrop-filter: blur(4px);
	}

	.nav-btn:hover {
		background: rgba(0, 0, 0, 0.6);
	}

	.nav-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.nav-left {
		left: 8px;
	}

	.nav-right {
		right: 8px;
	}

	@media (max-width: 480px) {
		.nav-btn {
			width: 32px;
			height: 32px;
			font-size: 18px;
		}
	}
</style>
