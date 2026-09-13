<!-- src/routes/(reports)/allZreports/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	// @ts-ignore
	import { base } from '$app/paths';
	// @ts-ignore
	import { goto } from '$app/navigation';

	import BtnBack from '$lib/components/Btn/BtnBack.svelte';
	import BtnText from '$lib/components/Btn/BtnText.svelte';
	import AccordionDetails from '$lib/components/aBlock/AccordionDetails.svelte';
	import MonthReportView from '$lib/components/aPage/reports/MonthReportView.svelte';
	import {
		getAllReportKeysDay,
		getAllReportKeysMonth,
		getReport_month_byKey
	} from '$lib/utils/db.js';

	import { appState } from '$lib/store/appState.svelte.js';

	import { groupDayReportsByMonth } from '$lib/components/services/allReportsService';

	/**
	 * Кэш загруженных месячных отчётов
	 * @type {Object.<string, Object|null>}
	 */
	let monthReportsCache = $state({});

	/**
	 * Загрузка месячного отчёта по требованию
	 */
	async function loadMonthReport(key) {
		if (monthReportsCache[key] !== undefined) return; // уже загружен

		try {
			const report = await getReport_month_byKey(key); // key = "2026-09_X"
			monthReportsCache = { ...monthReportsCache, [key]: report };
		} catch (error) {
			console.error(`[allZreports] Ошибка загрузки ${key}:`, error);
			monthReportsCache = { ...monthReportsCache, [key]: null };
		}
	}

	/**
	 * Обработчик открытия/закрытия details
	 */
	function handleAccordionToggle(key, isOpen) {
		if (isOpen) {
			loadMonthReport(key);
		}
	}

	// ===== СОСТОЯНИЕ =====
	let isLoading = $state(true);

	// Ключи дневных отчётов (dateStr)
	let dayKeys = $state([]);
	// Ключи месячных отчётов (yearMonth)
	let monthKeys = $state([]);

	// Сгруппированные по месяцам дневные отчёты
	let groupedDays = $derived(groupDayReportsByMonth(dayKeys));

	// Активная закладка (0 = День, 1 = Месяц)
	let activeTab = $state(0);

	// Свайп
	let touchStartX = $state(0);
	let touchEndX = $state(0);

	// ===== ФОРМАТИРОВАНИЕ =====
	/**
	 * Форматирует дату "2026-09-13" в "13.09.2026"
	 */
	function formatDateDisplay(dateStr) {
		const [year, month, day] = dateStr.split('-');
		return `${day}.${month}.${year}`;
	}

	/**
	 * Форматирует год-месяц "2026-09" в "Сентябрь 2026"
	 */
	function formatMonthDisplay(yearMonth) {
		const [year, month] = yearMonth.split('-');
		const monthNames = [
			'Январь',
			'Февраль',
			'Март',
			'Апрель',
			'Май',
			'Июнь',
			'Июль',
			'Август',
			'Сентябрь',
			'Октябрь',
			'Ноябрь',
			'Декабрь'
		];
		const monthIndex = parseInt(month, 10) - 1;
		return `${monthNames[monthIndex]} ${year}`;
	}

	/**
	 * Проверяет, что это X-отчёт
	 */
	function isXReport(key) {
		return key.endsWith('_X');
	}

	/**
	 * Форматирует ключ месячного отчёта для отображения
	 * "2026-09_X" → "Сентябрь 2026 (X-отчёт)"
	 */
	function formatMonthKey(key) {
		const [yearMonth, type] = key.split('_');
		const typeLabel = type === 'X' ? 'X-отчёт' : 'Z-отчёт';
		return `${formatMonthDisplay(yearMonth)} (${typeLabel})`;
	}

	// ===== ЗАГРУЗКА ДАННЫХ =====
	async function loadAllData() {
		isLoading = true;
		try {
			const [days, months] = await Promise.all([getAllReportKeysDay(), getAllReportKeysMonth()]);
			dayKeys = days;
			monthKeys = months;
			console.log(`[allZreports] Загружено: ${days.length} дней, ${months.length} месяцев`);
		} catch (error) {
			console.error('[allZreports] Ошибка загрузки:', error);
			dayKeys = [];
			monthKeys = [];
		} finally {
			isLoading = false;
		}
	}

	// ===== НАВИГАЦИЯ =====
	function setTab(index) {
		activeTab = index;
	}

	/**
	 * Переход на страницу Z-отчёта за день
	 */
	function goToDayReport(dateStr) {
		appState.now_date = dateStr;
		goto(`${base}/day_Zreport`);
	}

	/**
	 * Свайп между закладками
	 */
	function handleTouchStart(event) {
		touchStartX = event.changedTouches[0].screenX;
	}

	function handleTouchEnd(event) {
		touchEndX = event.changedTouches[0].screenX;
		const deltaX = touchStartX - touchEndX;

		if (Math.abs(deltaX) < 50) return;

		if (deltaX > 0) {
			// Свайп влево → следующая закладка
			activeTab = (activeTab + 1) % 2;
		} else {
			// Свайп вправо → предыдущая закладка
			activeTab = (activeTab - 1 + 2) % 2;
		}
	}

	onMount(() => {
		loadAllData();
	});
</script>

<svelte:window on:touchstart={handleTouchStart} on:touchend={handleTouchEnd} />

<div class="all-zreports-page">
	<!-- ===== ШАПКА ===== -->
	<header class="header">
		<BtnBack />
		<h1 class="header-title">Все отчёты</h1>
	</header>

	<!-- ===== КОНТЕНТ ===== -->
	<main class="content">
		{#if isLoading}
			<div class="loading">Загрузка...</div>
		{:else if dayKeys.length === 0 && monthKeys.length === 0}
			<!-- Пустое состояние -->
			<div class="empty-state">
				<div class="empty-icon">📊</div>
				<p class="empty-text">Отчёты не найдены</p>
				<BtnText
					buttonText="Создать отчёты"
					onclick={() => goto(`${base}/adminClear`)}
					customClass="btn-create"
				/>
			</div>
		{:else}
			<!-- ===== ЗАКЛАДКИ ===== -->
			<div class="tabs">
				<button class="tab {activeTab === 0 ? 'active' : ''}" onclick={() => setTab(0)}>
					День ({dayKeys.length})
				</button>
				<button class="tab {activeTab === 1 ? 'active' : ''}" onclick={() => setTab(1)}>
					Месяц ({monthKeys.length})
				</button>
			</div>

			<!-- ===== ЗАКЛАДКА "ДЕНЬ" ===== -->
			{#if activeTab === 0}
				<div class="tab-content">
					{#if groupedDays.length === 0}
						<p class="no-data">Нет дневных отчётов</p>
					{:else}
						{#each groupedDays as group}
							<div class="month-group">
								<h2 class="month-title">📅 {formatMonthDisplay(group.yearMonth)}</h2>
								<ul class="day-list">
									{#each group.days as dateStr}
										<li>
											<button type="button" class="day-link" onclick={() => goToDayReport(dateStr)}>
												<span class="day-date">{formatDateDisplay(dateStr)}</span>
												<span class="day-arrow">→</span>
											</button>
										</li>
									{/each}
								</ul>
							</div>
						{/each}
					{/if}
				</div>
			{/if}

			<!-- ===== ЗАКЛАДКА "МЕСЯЦ" ===== -->
			{#if activeTab === 1}
				<div class="tab-content">
					{#if monthKeys.length === 0}
						<p class="no-data">Нет месячных отчётов</p>
					{:else}
						{#each monthKeys as key}
							{@const report = monthReportsCache[key]}
							{@const reportType = key.endsWith('_X') ? 'X' : 'Z'}

							<AccordionDetails
								castomClass="report-accordion"
								name="reports-accordion"
								onToggle={(isOpen) => handleAccordionToggle(key, isOpen)}
							>
								{#snippet summary()}
									<h3 class="accordion-title">{formatMonthKey(key)}</h3>
								{/snippet}

								<div class="accordion-content">
									{#if report === undefined}
										<div class="loading-report">
											<div class="spinner"></div>
											<span>Загрузка отчёта...</span>
										</div>
									{:else if report === null}
										<p class="error-report">Отчёт не найден или повреждён</p>
									{:else}
										<MonthReportView {report} type={reportType} />
									{/if}
								</div>
							</AccordionDetails>
						{/each}
					{/if}
				</div>
			{/if}
		{/if}
	</main>
</div>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.all-zreports-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		max-height: 100vh;
		background: $clr-bg;
		overflow: hidden;
		margin: 0 auto;

		// --- Адаптив ---
		@media (min-width: 1024px), (orientation: landscape) and (min-width: 768px) {
			max-width: 60vw;
		}
		@media (max-width: 1023px) and (orientation: portrait), (max-width: 767px) {
			max-width: 80vw;
		}
		@media (max-width: 501px) {
			max-width: 100vw;
		}
	}

	/* ===== ШАПКА ===== */
	.header {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		padding: 8px 16px;
		background: $clr-bg-card;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		min-height: 56px;
	}

	.header-title {
		flex: 1;
		text-align: center;
		font-size: 1rem;
		font-weight: 600;
		color: $clr-text-main;
		margin: 0;
	}

	/* ===== КОНТЕНТ ===== */
	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		padding: 12px 16px 16px;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: $clr-text-main;
		opacity: 0.6;
		font-size: 14px;
	}

	/* ===== ПУСТОЕ СОСТОЯНИЕ ===== */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 16px;
		padding: 40px 20px;
		text-align: center;
	}

	.empty-icon {
		font-size: 64px;
		opacity: 0.5;
	}

	.empty-text {
		font-size: 16px;
		color: $clr-text-main;
		opacity: 0.7;
		margin: 0;
	}

	:global(.btn-create) {
		background: $clr-teal !important;
		color: white !important;
		padding: 12px 32px !important;
		border-radius: 10px !important;
		font-weight: 600 !important;
	}

	/* ===== ЗАКЛАДКИ ===== */
	.tabs {
		flex-shrink: 0;
		display: flex;
		gap: 6px;
		margin-bottom: 12px;
		overflow-x: auto;
		padding-bottom: 4px;
	}

	.tab {
		flex-shrink: 0;
		padding: 8px 16px;
		border: none;
		border-radius: 1rem;
		font-size: 14px;
		font-weight: 500;
		color: $clr-text-main;
		background: rgba($clr-bg-card, 0.5);
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;

		&:hover {
			opacity: 0.8;
		}

		&.active {
			background: $clr-bg-card;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		}
	}

	/* ===== СОДЕРЖИМОЕ ЗАКЛАДОК ===== */
	.tab-content {
		flex: 1;
		overflow-y: auto;
		padding-right: 4px;

		&::-webkit-scrollbar {
			width: 4px;
		}

		&::-webkit-scrollbar-thumb {
			background: rgba($clr-text-main, 0.2);
			border-radius: 2px;
		}
	}

	.no-data {
		text-align: center;
		color: $clr-text-main;
		opacity: 0.5;
		font-size: 14px;
		padding: 40px 0;
	}

	/* ===== ГРУППА ПО МЕСЯЦАМ (закладка "День") ===== */
	.month-group {
		margin-bottom: 24px;
		background: $clr-bg-card;
		border-radius: 16px;
		padding: 16px;
		box-shadow: $shadow-inset;
	}

	.month-title {
		margin: 0 0 12px 0;
		font-size: 1rem;
		font-weight: 600;
		color: $clr-text-main;
	}

	.day-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.day-link {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 14px;
		background: rgba($clr-bg, 0.5);
		border: 1px solid rgba($clr-text-main, 0.1);
		border-radius: 10px;
		cursor: pointer;
		font-family: inherit;
		font-size: 15px;
		color: $clr-text-main;
		transition: all 0.2s;

		&:hover {
			background: rgba($clr-teal, 0.15);
			border-color: $clr-teal;
		}
	}

	.day-date {
		font-weight: 500;
	}

	.day-arrow {
		color: $clr-teal;
		font-weight: 700;
	}

	/* ===== АККОРДЕОН (закладка "Месяц") ===== */
	:global(.report-accordion) {
		min-width: 100%;
		width: 100%;
		background: $clr-bg-card;
		border-radius: 1rem;
		border-bottom-left-radius: 0;
		border-top-left-radius: 0;
		margin-bottom: 1rem;
		box-shadow: $shadow-inset;
		overflow: hidden;
		transition: all 0.3s ease;

		summary {
			list-style: none;
			list-style-type: none;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: space-between;
			user-select: none;
			position: relative;
			padding: 1rem 2.5rem;
			transition: background-color 0.2s ease;

			&::-webkit-details-marker {
				display: none;
			}

			&::marker {
				display: none;
				content: '';
			}

			&::after {
				content: '';
				width: 0.5rem;
				height: 0.5rem;
				border-right: 2px solid $clr-white;
				border-bottom: 2px solid $clr-white;
				transform: rotate(45deg);
				transition: transform 0.3s ease;
				margin-left: 1rem;
				flex-shrink: 0;
			}

			&:hover {
				background: rgba($clr-teal, 0.1);
			}
		}

		&[open] {
			summary {
				background: $grad-btn-main;

				&::after {
					transform: rotate(-135deg);
				}
			}
		}
	}

	/* ===== Загрузка отчёта ===== */
	.loading-report {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 30px 0;
		color: $clr-text-main;
		opacity: 0.7;
		font-size: 14px;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba($clr-text-accent-rgb, 0.2);
		border-top-color: $clr-teal;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-report {
		text-align: center;
		color: $clr-error;
		font-size: 14px;
		padding: 20px 0;
		margin: 0;
	}

	:global(.accordion-title) {
		margin: 0;
		padding-left: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: $clr-text-main;
	}

	:global(.accordion-content) {
		padding: 1rem 1.25rem;
		color: $clr-text-main;
	}

	:global(.accordion-hint) {
		font-size: 13px;
		color: $clr-text-main;
		opacity: 0.5;
		margin: 0;
		text-align: center;
		padding: 20px 0;
	}
</style>
