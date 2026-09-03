<!-- src/routes/(date)/day_Zreport/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	// @ts-ignore
	import { base } from '$app/paths';
	// @ts-ignore
	import { goto } from '$app/navigation';
	import BtnBack from '$lib/components/Btn/BtnBack.svelte';
	import BtnText from '$lib/components/Btn/BtnText.svelte';

	import Modal_ZreportSaved from '$lib/components/aBlock/modal/Modal_ZreportSaved.svelte';

	import { appState } from '$lib/store/appState.svelte.js';
	import { appStore } from '$lib/store/appStore.svelte.js';
	import { toastStore } from '$lib/store/toastStore.svelte.js';

	import { getReport_Z_date, getAllThisDayRecords } from '$lib/utils/db.js';
	import { CalculationsDay } from '$lib/components/services/calculationsOneDay.js';
	import { getTodayDate } from '$lib/utils/dateHelpers.js';
	import { ReportShareService } from '$lib/components/services/reportShareService';

	// Состояние
	let reportData = $state(null);
	let isLoading = $state(true);
	let error = $state(null);
	let dateStr = $state('');
	// let isNewReport = $state(false); // ← флаг, что отчет только что создан

	// Состояние активной вкладки (по умолчанию 2 — Клиенты)
	let activeTab = $state(2);
	let touchStartX = $state(0);
	let touchEndX = $state(0);

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

	// Форматирование даты для отображения
	function formatDisplayDate(dateStr) {
		const date = new Date(dateStr + 'T00:00:00');
		const day = date.getDate();
		const month = date.toLocaleString('ru', { month: 'long' });
		const year = date.getFullYear();
		return `${day} ${month} ${year}`;
	}

	// Загрузка отчета
	async function loadReport() {
		isLoading = true;
		error = null;

		try {
			const targetDate = appState.now_date || getTodayDate();
			dateStr = targetDate;

			let report = await getReport_Z_date(targetDate);

			if (!report) {
				console.log('[Z-report] Отчет не найден, создаем...');
				const records = await getAllThisDayRecords(targetDate);
				const calc = new CalculationsDay(records);
				report = calc.report_Z(targetDate);

				const { saveReport } = await import('$lib/utils/db.js');
				await saveReport('day', targetDate, {
					...report,
					yearMonth: targetDate.slice(0, 7)
				});
				console.log('[Z-report] Отчет создан и сохранен');

				// ✅ НЕ открываем модалку автоматически!
				// isNewReport = true; // можно использовать для показа уведомления, но не модалки
			}

			reportData = report;
		} catch (err) {
			console.error('[Z-report] Ошибка:', err);
			error = 'Не удалось загрузить отчет';
		} finally {
			isLoading = false;
		}
	}

	// Переключение вкладок
	function setTab(index) {
		activeTab = index;
	}

	// Циклический свайп
	function handleTouchStart(event) {
		touchStartX = event.changedTouches[0].screenX;
	}

	function handleTouchEnd(event) {
		touchEndX = event.changedTouches[0].screenX;
		const deltaX = touchStartX - touchEndX;

		if (Math.abs(deltaX) < 50) return;

		if (deltaX > 0) {
			// Свайп влево → следующий блок
			activeTab = (activeTab + 1) % 4;
		} else {
			// Свайп вправо → предыдущий блок (циклически)
			activeTab = (activeTab - 1 + 4) % 4;
		}
	}

	// Сохранение отчета (кнопка)
	function handleSave() {
		appState.openZReportSaved();
	}

	// Отправка отчета
	async function handleSend() {
		console.log('[handleSend] Вызвана');

		if (!reportData) {
			toastStore.show('Нет данных для отправки', 'error');
			return;
		}

		const result = await ReportShareService.shareReport(reportData, dateStr, appStore.master);

		console.log('[handleSend] Результат:', result);

		toastStore.show(result.message, result.success ? 'success' : 'error');

		if (result.success) {
			appState.closeZReportSaved();
			setTimeout(() => {
				goto(`${base}/day`);
			}, 2500);
		}
	}

	onMount(() => {
		loadReport();
	});
</script>

<svelte:window on:touchstart={handleTouchStart} on:touchend={handleTouchEnd} />

<div class="z-report-page">
	<!-- Шапка -->
	<header class="header">
		<BtnBack />
		<h1 class="headerSlogan">z-отчёт {appStore.master}</h1>
	</header>

	<!-- Информационная строка -->
	<div class="info-row">
		<span class="date">{formatDisplayDate(dateStr)}</span>
		<span class="weekday">{getWeekDay(dateStr)}</span>
		<div class="actions">
			<BtnText buttonText="сохранить ✔️" onclick={handleSave} customClass="btn-save" />
			<BtnText buttonText="отправить 📨" onclick={handleSend} customClass="btn-send" />
		</div>
	</div>

	<!-- Основной контент -->
	<main class="content">
		{#if isLoading}
			<div class="loading">Загрузка...</div>
		{:else if error}
			<div class="error">{error}</div>
		{:else if reportData}
			<!-- Вкладки -->
			<div class="tabs">
				<button
					class="tab {activeTab === 2 ? 'active' : ''}"
					style="background: {activeTab === 2 ? 'var(--clr-bg-dark)' : 'transparent'};"
					onclick={() => setTab(2)}
				>
					Клиенты
				</button>
				<button
					class="tab {activeTab === 1 ? 'active' : ''}"
					style="background: {activeTab === 1 ? 'var(--clr-teal-soft)' : 'transparent'};"
					onclick={() => setTab(1)}
				>
					Доход
				</button>
				<button
					class="tab {activeTab === 0 ? 'active' : ''}"
					style="background: {activeTab === 0 ? 'var(--clr-bg-card)' : 'transparent'};"
					onclick={() => setTab(0)}
				>
					Аренда
				</button>
				<button
					class="tab {activeTab === 3 ? 'active' : ''}"
					style="background: {activeTab === 3 ? 'var(--clr-pink)' : 'transparent'};"
					onclick={() => setTab(3)}
				>
					Достижения
				</button>
			</div>

			<!-- Блоки -->
			<div class="blocks">
				<!-- Блок 0: Аренда -->
				{#if activeTab === 0}
					<div class="block">
						<h2>Аренда:</h2>
						<div class="block-content">
							<div class="row">
								<span class="label">Уже оплачено</span>
								<span class="value font-digits">{reportData.payments.nowGive}</span>
							</div>
							<div class="hint">Суммы, которые уже оплачены на карту аренды и счёт аренды.</div>

							<div class="row">
								<span class="label">Доплатить</span>
								<span class="value font-digits">{reportData.payments.moreGive}</span>
							</div>
							<div class="hint">Остаток, которые необходимо оплатить в счёт аренды.</div>

							<div class="row total">
								<span class="label">Всего</span>
								<span class="value font-digits" style="color: var(--clr-white);"
									>{reportData.payments.allGive}</span
								>
							</div>
							<div class="hint">Сколько необходимо оплатить за аренду.</div>
						</div>
					</div>
				{/if}

				<!-- Блок 1: Доход -->
				{#if activeTab === 1}
					<div class="block">
						<h2>Доход:</h2>
						<div class="block-content">
							<div class="row">
								<span class="label">Валовый</span>
								<span class="value font-digits">{reportData.payments.gross}</span>
							</div>
							<div class="hint">Всё что получено от клиентов (оплата и чаевые).</div>

							<div class="row">
								<span class="label">Работа</span>
								<span class="value font-digits">{reportData.payments.my}</span>
							</div>
							<div class="hint">Заработано после оплаты аренды. (без чаевых)</div>

							<div class="row">
								<span class="label">Чаевые</span>
								<span class="value font-digits">{reportData.payments.tips}</span>
							</div>
							<div class="hint">Заработано чаевых.</div>

							<div class="row total">
								<span class="label">Итого</span>
								<span class="value font-digits" style="color: var(--clr-white);"
									>{reportData.payments.allMy}</span
								>
							</div>
							<div class="hint">Заработано за день (с чаевыми).</div>
						</div>
					</div>
				{/if}

				<!-- Блок 2: Клиенты -->
				{#if activeTab === 2}
					<div class="block">
						<h2>Клиенты:</h2>
						<div class="block-content">
							{#if reportData.clients.male > 0}
								<div class="row">
									<span class="label">Мужчины</span>
									<span class="value font-digits">{reportData.clients.male}</span>
								</div>
							{/if}

							{#if reportData.clients.male_bearded > 0}
								<div class="row">
									<span class="label">Бородачи</span>
									<span class="value font-digits">{reportData.clients.male_bearded}</span>
								</div>
							{/if}

							{#if reportData.clients.colorist > 0}
								<div class="row">
									<span class="label">Окрашивания</span>
									<span class="value font-digits">{reportData.clients.colorist}</span>
								</div>
							{/if}

							{#if reportData.clients.female > 0}
								<div class="row">
									<span class="label">Женщины</span>
									<span class="value font-digits">{reportData.clients.female}</span>
								</div>
							{/if}

							{#if reportData.clients.child > 0}
								<div class="row">
									<span class="label">Дети</span>
									<span class="value font-digits">{reportData.clients.child}</span>
								</div>
							{/if}

							<div class="row total">
								<span class="label">Всего</span>
								<span class="value font-digits" style="color: var(--clr-white);"
									>{reportData.clients.heads}</span
								>
							</div>
						</div>
					</div>
				{/if}

				<!-- Блок 3: Достижения -->
				{#if activeTab === 3}
					<div class="block">
						<h2>Достижения:</h2>
						<div class="block-content">
							<p style="color: var(--clr-text-secondary); text-align: center; padding: 20px 0;">
								Скоро здесь будут ваши достижения ✨
							</p>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</main>
	<Modal_ZreportSaved onSend={handleSend} />
</div>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;
	.z-report-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		max-height: 100vh;
		background: var(--clr-bg-primary, #f5f5f5);
		overflow: hidden;

		margin: 0 auto;
		// --- РЕЖИМ: DESKTOP & TABLET LANDSCAPE ---
		@media (min-width: 1024px), (orientation: landscape) and (min-width: 768px) {
			max-width: 60vw;
		}
		// --- РЕЖИМ: MOBILE & TABLET PORTRAIT ---
		@media (max-width: 1023px) and (orientation: portrait), (max-width: 767px) {
			max-width: 80vw;
		}
		// --- МОБИЛЬНЫЙ   ---
		@media (max-width: 501px) {
			max-width: 100vw;
		}
	}

	.header {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		padding: 8px 16px;
		background: var(--clr-bg-card, $clr-white);
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		min-height: 56px;
	}

	.headerSlogan {
		flex: 1;
		text-align: center;
		font-size: 1rem;
		font-weight: 600;
		color: $clr-text-main;
		margin: 0;
	}

	.info-row {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 16px;
		background: var(--clr-bg-card, #ffffff);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		gap: 12px;
		flex-wrap: wrap;
	}

	.info-row .date {
		font-weight: 600;
		font-size: 16px;
		color: var(--clr-text-primary, #1a1a1a);
	}

	.info-row .weekday {
		font-size: 14px;
		color: var(--clr-text-secondary, #666);
	}

	.info-row .actions {
		display: flex;
		gap: 8px;
	}

	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		padding: 12px 16px 16px;
	}

	.loading,
	.error {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--clr-text-secondary, #999);
		font-size: 14px;
	}

	.error {
		color: var(--clr-error, #e74c3c);
	}

	/* Вкладки */
	.tabs {
		flex-shrink: 0;
		display: flex;
		gap: 6px;
		margin-bottom: 12px;
		overflow-x: auto;
		padding-bottom: 4px;
	}

	.tabs::-webkit-scrollbar {
		height: 2px;
	}

	.tabs::-webkit-scrollbar-thumb {
		background: var(--clr-scrollbar, #ccc);
		border-radius: 2px;
	}

	.tab {
		flex-shrink: 0;
		padding: 8px 16px;
		border: none;
		border-radius: 20px;
		font-size: 14px;
		font-weight: 500;
		color: var(--clr-text-primary, #1a1a1a);
		background: transparent;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.tab:hover {
		opacity: 0.8;
	}

	.tab.active {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	/* Блоки */
	.blocks {
		flex: 1;
		overflow: hidden;
		position: relative;
		max-width: max-content;
		min-width: 60%;
		margin: 0 auto;
		color: $clr-text-main;
		border: 2px solid $clr-white;
		border-radius: 1rem;
		background-image: $grad-block;
	}

	.block {
		height: 100%;
		padding: 20px 20px 24px;
		overflow-y: auto;
		animation: fadeIn 0.25s ease;
		background-image: url('../../../lib/assets/iconPic/256/logo_report3d.webp');
		background-repeat: no-repeat;
		background-position: right bottom;
		background-size: 30vw 30vw;
		@media screen and (min-width: 767px) {
			background-size: 20vw 20vw;
		}
	}

	.block::-webkit-scrollbar {
		width: 4px;
	}

	.block::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 2px;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateX(8px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.block h2 {
		margin: 0 0 16px 0;
		font-size: 18px;
		font-weight: 600;
		color: var(--clr-text-primary, #1a1a1a);
	}

	.block-content {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 4px 0;
		font-size: 16px;
		color: var(--clr-text-main, #1a1a1a);
		border-bottom: 1px dotted $clr-white;
	}

	.row .label {
		font-weight: 400;
	}

	.row .value {
		font-weight: 600;
	}

	.row.total .label {
		font-weight: 600;
		font-size: 17px;
	}

	.row.total .value {
		font-weight: 700;
		font-size: 18px;
	}

	.hint {
		font-size: 12px;
		color: var(--clr-text-secondary, #888);
		margin-bottom: 8px;
		padding-left: 4px;
	}

	.hint:last-of-type {
		margin-bottom: 0;
	}

	/* font-digits */
	:global(.font-digits) {
		font-family: 'Courier New', monospace;
		letter-spacing: 0.5px;
	}

	/* Кнопки */
	.btn-save {
		background: var(--clr-teal-soft, #e6f5f0) !important;
		color: var(--clr-teal, #0d9488) !important;
	}

	.btn-send {
		background: var(--clr-teal, #0d9488) !important;
		color: white !important;
	}
</style>
