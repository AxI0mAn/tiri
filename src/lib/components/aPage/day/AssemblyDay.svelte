<!-- src/lib/components/Day/AssemblyDay.svelte -->
<script>
	// @ts-ignore
	import { goto } from '$app/navigation';
	import BtnImg from '$lib/components/Btn/BtnImg.svelte';
	import ShowCard from './ShowCard.svelte';
	import logo_report3dWebp from '$lib/assets/iconPic/64/logo_report3d.webp';
	import { getAllThisDayRecords, getReport_Z_date } from '$lib/utils/db.js';
	import { formatDateISOLocal, getTodayDate } from '$lib/utils/dateHelpers.js';
	import { appState } from '$lib/store/appState.svelte.js';

	// Props
	let { dateStr, isActive = false } = $props();

	// Состояние
	let entries = $state([]);
	let isLoading = $state(true);
	let hasReport = $state(false);
	let isToday = $state(false);
	let isFuture = $state(false);
	let isPast = $state(false);

	// Дни недели
	const weekDays = [
		'Воскресенье',
		'Понедельник',
		'Вторник',
		'Среда',
		'Четверг',
		'Пятница',
		'Суббота'
	];

	function getWeekDay(dateStr) {
		const date = new Date(dateStr + 'T00:00:00');
		return weekDays[date.getDay()];
	}

	// Загрузка данных
	async function loadEntries() {
		if (!dateStr) return;

		isLoading = true;
		try {
			const records = await getAllThisDayRecords(dateStr);
			entries = records.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

			const report = await getReport_Z_date(dateStr);
			hasReport = !!report;
		} catch (error) {
			console.error('[AssemblyDay] Ошибка загрузки:', error);
			entries = [];
		} finally {
			isLoading = false;
		}
	}

	// Определяем статус дня
	function updateDayStatus() {
		const today = getTodayDate();
		isToday = dateStr === today;

		const currentDate = new Date(dateStr + 'T00:00:00');
		const todayDate = new Date(today + 'T00:00:00');
		isFuture = currentDate > todayDate;
		isPast = currentDate < todayDate;
	}

	// Обработчик клика по кнопке отчета
	async function handleReportClick() {
		// 1. Будущие дни — игнорируем
		if (isFuture) {
			console.log('[AssemblyDay] Кнопка отчета скрыта для будущих дней');
			return;
		}

		// 2. Прошлые дни — переход на страницу Z-отчета
		if (isPast) {
			appState.now_mode = 'z_report';
			appState.now_date = dateStr;
			goto('/day_Zreport');
			return;
		}

		// 3. Сегодняшний день
		if (isToday) {
			const report = await getReport_Z_date(dateStr);

			if (report) {
				// Z-отчет есть → переход на страницу Z-отчета
				appState.now_mode = 'z_report';
				appState.now_date = dateStr;
				goto('/day_Zreport');
			} else {
				// Z-отчета нет → открываем модалку с X-отчетом
				console.log('[AssemblyDay] Показать X-отчет за', dateStr);
				appState.openXReport(dateStr);
			}
		}
	}

	// Обновляем статус дня при изменении даты
	$effect(() => {
		if (dateStr) {
			updateDayStatus();
		}
	});

	// Загрузка при изменении даты или активности
	$effect(() => {
		if (dateStr && isActive) {
			loadEntries();
		}
	});

	// Подписка на EventBus
	$effect(() => {
		if (isActive) {
			const handler = (event) => {
				const savedRecord = event.detail;
				if (savedRecord.dateStr === dateStr) {
					loadEntries();
				}
			};
			window.addEventListener('db:entry_saved', handler);

			return () => {
				window.removeEventListener('db:entry_saved', handler);
			};
		}
	});
</script>

<div class="assemblyDay">
	<!-- Шапка -->
	<header class="header_assemblyDay">
		<span class="date">{dateStr}</span>
		<span class="weekDay">{getWeekDay(dateStr)}</span>
		<div class="report">
			<!-- Показываем кнопку только для сегодня и прошлых дней -->
			{#if !isFuture && (isToday || isPast)}
				<BtnImg
					src={logo_report3dWebp}
					alt="button report"
					size={44}
					onclick={handleReportClick}
					customClass="actionBtnImg {isToday && !hasReport ? 'blink' : ''}"
				/>
			{/if}
		</div>
	</header>

	<!-- Список карточек -->
	<div class="field_day">
		{#if isLoading}
			<div class="loading">Загрузка...</div>
		{:else if entries.length === 0}
			<div class="empty">Нет записей за этот день</div>
		{:else}
			{#each entries as entry}
				<ShowCard {entry} />
			{/each}
		{/if}
	</div>
</div>

<style lang="scss">
	.assemblyDay {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--clr-bg-primary, #f5f5f5);
	}

	.header_assemblyDay {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 16px;
		background: var(--clr-bg-card, #ffffff);
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		min-height: 48px;
	}

	.date {
		font-weight: 600;
		font-size: 16px;
		color: var(--clr-text-primary, #1a1a1a);
	}

	.weekDay {
		font-size: 14px;
		color: var(--clr-text-secondary, #666);
	}

	.report {
		flex-shrink: 0;
	}

	.blink {
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}

	.field_day {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 8px 12px 16px 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		scroll-behavior: smooth;
	}

	.field_day::-webkit-scrollbar {
		width: 4px;
	}

	.field_day::-webkit-scrollbar-thumb {
		background: var(--clr-scrollbar, #ccc);
		border-radius: 2px;
	}

	.loading,
	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--clr-text-secondary, #999);
		font-size: 14px;
		text-align: center;
		padding: 20px;
	}
</style>
