<!-- src/lib/components/aPage/calendar/Calendar.svelte -->
<script>
	import { onMount } from 'svelte';
	// @ts-ignore
	import { base } from '$app/paths';
	// @ts-ignore
	import { goto } from '$app/navigation';

	import { appState } from '$lib/store/appState.svelte.js';
	import { appStore } from '$lib/store/appStore.svelte';

	import AdvertisementVert from '$lib/components/advertisement/AdvertisementVert.svelte';

	import { longpress } from '$lib/actions/longpress';
	import { getTodayDate } from '$lib/utils/dateHelpers.js';
	import { getWorkDays, toggleWorkDay, isWorkDay } from '$lib/components/services/scheduleService';
	import { loadMonthCalendarData } from '$lib/components/services/calendarService';

	import BtnImg from '$lib/components/Btn/BtnImg.svelte';
	import BtnBack from '$lib/components/Btn/BtnBack.svelte';
	import Select from '$lib/components/input/Select.svelte';

	import imgFAQ from '$lib/assets/iconPic/128/faq.webp';
	import imgSchedule from '$lib/assets/iconPic/128/schedule.webp';
	import imgAdd from '$lib/assets/iconPic/128/add.webp';
	import leftPink from '$lib/assets/iconPic/128/arrowPink.webp';
	import rightGreen from '$lib/assets/iconPic/128/arrowGreen.webp';

	/**
	 * @typedef {Object} Props
	 * @property {'schedule' | 'picker'} [mode='schedule']
	 * @property {string} [selectedDate='']
	 * @property {string} [minDate='']
	 * @property {string} [maxDate='']
	 * @property {Function} [onSelectDate]
	 * @property {Function} [onClose]
	 */

	/** @type {Props} */
	let {
		mode = 'schedule',
		selectedDate = '',
		minDate = '',
		maxDate = '',
		onSelectDate = () => {},
		onClose = () => {}
	} = $props();

	// ===== РЕЖИМ ========
	let modeTitle = $derived(appState.showSchedule ? 'РАСПИСАНИЕ' : 'КАЛЕНДАРЬ');

	// ===== СОСТОЯНИЕ =====
	let currentYear = $state(String(new Date().getFullYear()));
	let currentMonth = $state(String(new Date().getMonth() + 1)); // 1-12

	let touchStartX = $state(0);
	let touchEndX = $state(0);

	// ===== ОПЦИИ SELECT =====
	const monthOptions = [
		{ value: '1', label: 'Январь' },
		{ value: '2', label: 'Февраль' },
		{ value: '3', label: 'Март' },
		{ value: '4', label: 'Апрель' },
		{ value: '5', label: 'Май' },
		{ value: '6', label: 'Июнь' },
		{ value: '7', label: 'Июль' },
		{ value: '8', label: 'Август' },
		{ value: '9', label: 'Сентябрь' },
		{ value: '10', label: 'Октябрь' },
		{ value: '11', label: 'Ноябрь' },
		{ value: '12', label: 'Декабрь' }
	];

	const yearOptions = $derived.by(() => {
		const current = new Date().getFullYear();
		return [
			{ value: String(current - 2), label: String(current - 2) },
			{ value: String(current - 1), label: String(current - 1) },
			{ value: String(current), label: String(current) },
			{ value: String(current + 1), label: String(current + 1) },
			{ value: String(current + 2), label: String(current + 2) }
		];
	});

	// ===== НАЗВАНИЯ ДНЕЙ НЕДЕЛИ =====
	const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

	// ===== ФОРМИРОВАНИЕ СЕТКИ 6×7 =====
	/**
	 * Возвращает массив из 42 ячеек (6 недель × 7 дней)
	 * Каждая ячейка: { dateStr, day, isCurrentMonth, isToday }
	 */
	let gridDays = $derived.by(() => {
		const year = parseInt(currentYear, 10);
		const month = parseInt(currentMonth, 10);
		const days = [];
		const firstDay = new Date(year, month - 1, 1);
		// День недели первого дня: 0=Вс, 1=Пн... приводим к 0=Пн
		let startWeekday = firstDay.getDay() - 1;
		if (startWeekday < 0) startWeekday = 6; // Вс → 6

		// Начало сетки: отступаем назад к понедельнику
		const gridStart = new Date(year, month - 1, 1 - startWeekday);

		const today = getTodayDate();

		for (let i = 0; i < 42; i++) {
			const date = new Date(gridStart);
			date.setDate(gridStart.getDate() + i);

			const y = date.getFullYear();
			const m = String(date.getMonth() + 1).padStart(2, '0');
			const d = String(date.getDate()).padStart(2, '0');
			const dateStr = `${y}-${m}-${d}`;

			days.push({
				dateStr,
				day: date.getDate(),
				isCurrentMonth: date.getMonth() + 1 === month && date.getFullYear() === year,
				isToday: dateStr === today
			});
		}
		return days;
	});

	// ===== НАВИГАЦИЯ ПО МЕСЯЦАМ =====
	function goPrevMonth() {
		const month = parseInt(currentMonth, 10);
		const year = parseInt(currentYear, 10);

		if (month === 1) {
			currentMonth = '12';
			currentYear = String(year - 1);
		} else {
			currentMonth = String(month - 1);
		}
	}

	function goNextMonth() {
		const month = parseInt(currentMonth, 10);
		const year = parseInt(currentYear, 10);

		if (month === 12) {
			currentMonth = '1';
			currentYear = String(year + 1);
		} else {
			currentMonth = String(month + 1);
		}
	}

	// ===== СВАЙП =====
	function handleTouchStart(event) {
		if (!appStore.swipeUse && mode === 'schedule') return;
		touchStartX = event.changedTouches[0].screenX;
	}

	function handleTouchEnd(event) {
		if (!appStore.swipeUse && mode === 'schedule') return;
		touchEndX = event.changedTouches[0].screenX;
		const deltaX = touchStartX - touchEndX;

		if (Math.abs(deltaX) < 50) return;

		if (deltaX > 0) {
			// Свайп влево → следующий месяц
			goNextMonth();
		} else {
			// Свайп вправо → предыдущий месяц
			goPrevMonth();
		}
	}

	// ===== ОБРАБОТКА КЛИКА ПО ДНЮ =====
	function handleDayClick(dateStr) {
		if (mode === 'picker') {
			const today = getTodayDate();
			const min = minDate || today; // если minDate не задан — запрещаем прошлое

			if (dateStr < min) {
				window.dispatchEvent(
					new CustomEvent('toast:show', {
						detail: { message: 'Нельзя выбрать дату раньше минимальной', type: 'warning' }
					})
				);
				return;
			}

			if (maxDate && dateStr > maxDate) {
				window.dispatchEvent(
					new CustomEvent('toast:show', {
						detail: { message: 'Нельзя выбрать дату позже максимальной', type: 'warning' }
					})
				);
				return;
			}

			onSelectDate(dateStr);
			return;
		}

		// В режиме schedule — тумблер рабочего дня
		if (!appState.showSchedule) return;

		const [year, month] = dateStr.split('-');
		const yearMonth = `${year}-${month}`;
		const day = parseInt(dateStr.split('-')[2], 10);

		appStore.workDays = toggleWorkDay(appStore.workDays, yearMonth, day);
	}

	// ===== ДЛИТЕЛЬНОЕ НАЖАТИЕ =====
	function handleLongPress(dateStr) {
		if (mode === 'picker') {
			// В picker длительное нажатие = выбор даты
			const today = getTodayDate();
			if (dateStr < today) {
				window.dispatchEvent(
					new CustomEvent('toast:show', {
						detail: { message: 'Нельзя выбрать прошлую дату', type: 'warning' }
					})
				);
				return;
			}
			onSelectDate(dateStr);
			return;
		}

		appState.fromCalendar = true;
		appState.now_date = dateStr;
		// В schedule — переход на страницу дня
		// (используем appState в родителе)
		window.dispatchEvent(
			new CustomEvent('calendar:gotoDay', {
				detail: { dateStr }
			})
		);
	}

	onMount(() => {
		const now = new Date();
		currentYear = String(now.getFullYear());
		currentMonth = String(now.getMonth() + 1);
	});

	// Карта данных для окраски дней
	let monthData = $state({});

	//   Реактивная загрузка данных при смене месяца
	$effect(() => {
		const year = parseInt(currentYear, 10);
		const month = parseInt(currentMonth, 10);
		const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

		loadMonthCalendarData(yearMonth).then((data) => {
			monthData = data;
		});
	});

	//  Подписка на события сохранения (для реактивного обновления)
	$effect(() => {
		const handler = () => {
			const year = parseInt(currentYear, 10);
			const month = parseInt(currentMonth, 10);
			const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
			loadMonthCalendarData(yearMonth).then((data) => {
				monthData = data;
			});
		};

		window.addEventListener('db:entry_saved', handler);
		return () => window.removeEventListener('db:entry_saved', handler);
	});

	// Cлушаем событие длительного нажатия
	$effect(() => {
		const handler = (event) => {
			const dateStr = event.detail?.dateStr;
			if (!dateStr) return;

			// Устанавливаем дату в appState и переходим на страницу дня
			appState.now_date = dateStr;
			goto(`${base}/day`);
		};

		window.addEventListener('calendar:gotoDay', handler);
		return () => window.removeEventListener('calendar:gotoDay', handler);
	});
</script>

<!-- ===== ШАПКА ===== -->
{#if mode === 'schedule'}
	<header class="calendar-header">
		<div class="header-left">
			<BtnBack />
		</div>
		<div class="header-center">
			<span class="mode-title">{modeTitle}</span>
		</div>
		<div class="header-right">
			{#if mode === 'schedule'}
				<a href="{base}/instructionAll#instructionCalendar" class="">
					<BtnImg src={imgFAQ} alt="Справка" size={64} customClass="actionBtnImg" />
				</a>
			{/if}
		</div>
	</header>
{/if}

<!-- ===== ОСНОВНОЙ БЛОК: СЕТКА ===== -->
<div class="calendar-grid-wrapper">
	<!-- ✅ Единая сетка 7×7 (1 строка заголовков + 6 строк дней) -->
	<div
		class="calendar-grid"
		role="presentation"
		ontouchstart={handleTouchStart}
		ontouchend={handleTouchEnd}
	>
		<!-- Первая строка: дни недели -->
		{#each weekDays as wd}
			<div class="cell-header">{wd}</div>
		{/each}

		<!-- 6 строк с днями (42 ячейки) -->
		{#each gridDays as cell}
			{@const data = monthData[cell.dateStr] || { hasReport: false, hasReminder: false }}
			{@const yearMonth = cell.dateStr.slice(0, 7)}
			{@const day = cell.day}
			{@const isWork = isWorkDay(appStore.workDays, yearMonth, day)}
			{@const isSelected = mode === 'picker' && cell.dateStr === selectedDate}
			<div
				class="day-cell"
				class:other-month={!cell.isCurrentMonth}
				class:today={cell.isToday}
				class:has-report={data.hasReport}
				class:has-reminder={data.hasReminder}
				class:is-work={isWork}
				role="button"
				tabindex="0"
				onclick={() => handleDayClick(cell.dateStr)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleDayClick(cell.dateStr);
					}
				}}
				use:longpress
				onlongpress={() => handleLongPress(cell.dateStr)}
			>
				<span class="day-number">{cell.day}</span>
			</div>
		{/each}
	</div>
</div>

<!-- ===== БЛОК НАВИГАЦИИ ===== -->
<div class="calendar-nav">
	<button class="nav-arrow" onclick={goPrevMonth} aria-label="Предыдущий месяц">
		<BtnImg src={leftPink} alt="Назад" size={44} customClass="actionBtnImg" />
	</button>

	<div class="selects-center">
		<Select bind:value={currentMonth} options={monthOptions} customClass="month-select" />
		<Select bind:value={currentYear} options={yearOptions} customClass="year-select" />
	</div>

	<button class="nav-arrow" onclick={goNextMonth} aria-label="Следующий месяц">
		<BtnImg src={rightGreen} alt="Вперёд" size={44} customClass="actionBtnImg" />
	</button>
</div>

<!-- ===== БЛОК КНОПОК ===== -->
{#if mode === 'schedule'}
	<div class="calendar-actions">
		<a href="{base}/newReminder" class="iconLink">
			<BtnImg src={imgAdd} alt="Запись" size={64} customClass="actionBtnImg" />
		</a>

		<button
			type="button"
			class="iconLink"
			onclick={() => (appState.showSchedule = !appState.showSchedule)}
			aria-label="Расписание"
		>
			<BtnImg
				src={imgSchedule}
				alt="Расписание"
				size={64}
				customClass="actionBtnImg {appState.showSchedule ? 'action' : ''}"
			/>
		</button>
	</div>
{/if}

<!-- ===== ВСПОМОГАТЕЛЬНЫЙ БЛОК ===== -->
<div class="calendar-spacer">
	{#if mode === 'schedule'}
		<AdvertisementVert setBanners="1" />
	{/if}
</div>

<style lang="scss">
	@use '../../../../styles/_variables.scss' as *;

	/* ===== ШАПКА ===== */
	.calendar-header {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0.5rem;
		min-height: 56px;

		.header-left,
		.header-right {
			display: flex;
			align-items: center;
			min-width: 60px;
		}

		.header-right {
			justify-content: flex-end;
		}

		.header-center {
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;

			.mode-title {
				font-size: 1.1rem;
				font-weight: 700;
				color: $clr-text-main;
				letter-spacing: 0.05em;
				padding: 0.5rem 1rem;
				border: 2px solid $clr-white;
				border-radius: 10%;
				background-color: $clr-bg;
			}
		}
	}

	/* ===== СЕТКА ===== */
	.calendar-grid-wrapper {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		width: 100%;
		margin: 0 auto;
		padding: 0 0.25rem;

		/* Адаптив: как в SwipeDay */
		@media (min-width: 1024px), (orientation: landscape) and (min-width: 768px) {
			max-width: 60vw;
		}
		@media (max-width: 1023px) and (orientation: portrait), (max-width: 767px) {
			max-width: 80vw;
		}
		@media (max-height: 500px) and (orientation: landscape) {
			max-width: 100vw;
		}
	}

	/* ✅ Единая сетка 7×7 с container queries для адаптивного шрифта */
	.calendar-grid {
		container-type: inline-size;
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
		width: 100%;
		user-select: none;
	}

	/* ✅ Заголовки дней недели — такие же ячейки, как дни */
	.cell-header {
		aspect-ratio: 1 / 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: $clr-bg;
		box-shadow: inset 0 0 0 1px $shadow-inset;
		font-size: 3.2cqw;
		font-weight: 700;
		color: $clr-text-main;
		opacity: 0.7;
	}

	.day-cell {
		position: relative;
		aspect-ratio: 1 / 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: $clr-bg;
		box-shadow: inset 0 0 0 1px $shadow-inset;
		cursor: pointer;
		transition: background 0.2s ease;

		-webkit-tap-highlight-color: transparent;
		-webkit-touch-callout: none;
		user-select: none;

		.day-number {
			position: relative;
			z-index: 2;
			font-size: 4.5cqw;
			color: $clr-text-main;
			line-height: 1;
		}

		&:hover {
			background: rgba($clr-text-accent-rgb, 0.1);
		}

		/* Фон для дней с Z-отчётом */
		&.has-report {
			background: $clr-teal;
		}

		/* Фон для дней с напоминанием */
		&.has-reminder {
			background: $clr-pink;
		}

		/* Рабочий день — круг вокруг цифры */
		&.is-work {
			.day-number {
				position: relative;
				z-index: 2;
				width: 80%;
				height: 80%;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 50%;
				background: none;
				border: 4px double rgba(215, 183, 0, 0.85);
				outline: 2px double rgba(215, 183, 0, 0.85);
			}
		}

		/*  Если день и с отчётом/напоминанием, и рабочий — цифра светлая на тёмном круге */
		&.has-report.is-work,
		&.has-reminder.is-work {
			.day-number {
				background: rgba($clr-text-accent-rgb, 0.7);
				color: $clr-bg;
			}
		}
	}

	.day-cell.other-month {
		opacity: 0.4;
	}

	.day-cell.today {
		box-shadow:
		/* Внутренняя тень — эффект вдавливания по краям */
			inset 0 0 4px rgba(0, 0, 0, 0.95),
			/* Внешняя тень снизу — эффект приподнятости */ 0 4px 8px rgba(0, 0, 0, 0.8),
			/* Внешняя тень сверху — светлый блик */ 0 -2px 4px rgba(255, 255, 255, 0.75);
		transform: translateY(-2px);
		z-index: 3;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.day-cell.selected {
		box-shadow: inset 0 0 0 3px $clr-teal;
	}

	/* ===== НАВИГАЦИЯ ===== */
	.calendar-nav {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.25rem;
		width: 100%;
		margin: 0 auto;
		padding: 0.5rem 0.25rem;
		box-sizing: border-box;

		/* Адаптив: как в SwipeDay */
		@media (min-width: 1024px), (orientation: landscape) and (min-width: 768px) {
			max-width: 60vw;
		}
		@media (max-width: 1023px) and (orientation: portrait), (max-width: 767px) {
			max-width: 80vw;
		}
		@media (max-height: 500px) and (orientation: landscape) {
			max-width: 100%;
		}

		/* ✅ Стрелки — фиксированного размера, не сжимаются */
		.nav-arrow {
			background: none;
			border: none;
			padding: 0;
			cursor: pointer;
			flex-shrink: 0;
			width: 40px;
			height: 40px;
			display: flex;
			align-items: center;
			justify-content: center;
			-webkit-tap-highlight-color: transparent;
		}

		/* ✅ Центр — два Select, сжимаются пропорционально */
		.selects-center {
			display: flex;
			flex-wrap: wrap;
			gap: 0.25rem;
			justify-content: center;
			align-items: center;
			flex: 1;
			min-width: 0; /* ✅ важно — разрешаем сжиматься */

			:global(.month-select),
			:global(.year-select) {
				min-width: fit-content;
				flex: 0 1 auto; /* ✅ разрешаем сжиматься */
			}

			:global(.month-select) {
				width: 55%;
			}

			:global(.year-select) {
				width: 40%;
			}
		}

		/* Ландшафтный режим на маленькой высоте */
		@media (max-height: 500px) and (orientation: landscape) {
			.selects-center {
				:global(.month-select),
				:global(.year-select) {
					max-width: 100px;
					width: fit-content;
				}
			}
		}

		/* Мобильный — уменьшаем стрелки */
		@media (max-width: 480px) {
			.nav-arrow {
				width: 32px;
				height: 32px;
			}
		}
	}

	/* ===== БЛОК КНОПОК ===== */
	.calendar-actions {
		flex-shrink: 0;
		display: flex;
		justify-content: space-evenly;
		align-items: center;
		width: 100%;
		margin: 0 auto;
		padding: 0.5rem 0.25rem;

		@media (min-width: 1024px), (orientation: landscape) and (min-width: 768px) {
			max-width: 60vw;
		}
		@media (max-width: 1023px) and (orientation: portrait), (max-width: 767px) {
			max-width: 80vw;
		}
		@media (max-height: 500px) and (orientation: landscape) {
			max-width: 100vw;
		}

		.iconLink {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			text-decoration: none;
			color: inherit;
			background: none;
			border: none;
			padding: 0.5rem;
			cursor: pointer;
			gap: 0.25rem;
		}
	}

	/* ===== ВСПОМОГАТЕЛЬНЫЙ БЛОК ===== */
	.calendar-spacer {
		flex: 1;
		min-height: 0;
	}
</style>
