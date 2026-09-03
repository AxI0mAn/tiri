<!-- src/lib/components/aBlock/modal/Modal_XreportDay.svelte -->
<script>
	import ModalBackdrop from './ModalBackdrop.svelte';
	import { appState } from '$lib/store/appState.svelte';
	import { CalculationsDay } from '$lib/components/services/calculationsOneDay.js';
	import { getAllThisDayRecords } from '$lib/utils/db.js';

	import AdvertisementGor from '$lib/components/advertisement/advertisementGor.svelte';

	import logo_job3dWebp from '$lib/assets/iconPic/64/logo_job3d.webp';
	import BtnImg from '$lib/components/Btn/BtnImg.svelte';

	// Состояние для данных отчета
	let xReportData = $state(null);
	let dateStr = $state('');

	// Функция закрытия
	function closeModal() {
		appState.modal_xReportDay = false;
		xReportData = null;
		dateStr = '';
	}

	// Загрузка данных при открытии модалки
	async function loadXReport() {
		if (!appState.modal_xReportDay) return;

		const targetDate = appState.modal_xReportDate || new Date().toISOString().split('T')[0];
		dateStr = targetDate;

		try {
			const records = await getAllThisDayRecords(targetDate);
			const calc = new CalculationsDay(records);
			xReportData = calc.report_X();
		} catch (error) {
			console.error('[Modal_XreportDay] Ошибка:', error);
			xReportData = null;
		}
	}

	// Отслеживаем открытие модалки
	$effect(() => {
		if (appState.modal_xReportDay) {
			loadXReport();
		}
	});
</script>

<ModalBackdrop isOpen={appState.modal_xReportDay} maxWidth="400px">
	{#snippet children()}
		<div class="x-report-modal">
			<h2>
				X-отчет за {dateStr}
			</h2>
			<BtnImg
				src={logo_job3dWebp}
				alt="button report"
				size={44}
				onclick={() => {}}
				customClass=""
			/>
			{#if xReportData}
				<div class="report-content">
					<div class="report-row">
						<span class="label">Касса (без чаевых):</span>
						<span class="value">{xReportData.sum}</span>
					</div>
					<div class="report-row">
						<span class="label">Оплатить за аренду:</span>
						<span class="value">{xReportData.give}</span>
					</div>
					<div class="report-row">
						<span class="label">Мои с чаевыми:</span>
						<span class="value">{xReportData.my}</span>
					</div>
				</div>
			{:else}
				<p>Нет данных для отчета</p>
			{/if}

			<button class="close-btn" onclick={closeModal}>Закрыть</button>
		</div>
		<AdvertisementGor />
	{/snippet}
</ModalBackdrop>

<style lang="scss">
	.x-report-modal {
		background: var(--clr-bg-card, #ffffff);
		border-radius: 16px;
		padding: 24px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.x-report-modal h2 {
		margin: 0 0 20px 0;
		font-size: 20px;
		color: var(--clr-text-primary, #1a1a1a);
		text-align: center;
	}

	.report-content {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 20px;
	}

	.report-row {
		display: flex;
		justify-content: space-between;
		padding: 8px 12px;
		background: var(--clr-bg-primary, #f5f5f5);
		border-radius: 8px;
	}

	.report-row .label {
		font-weight: 500;
		color: var(--clr-text-secondary, #666);
	}

	.report-row .value {
		font-weight: 600;
		color: var(--clr-text-primary, #1a1a1a);
	}

	.close-btn {
		width: 100%;
		padding: 12px;
		border: none;
		border-radius: 10px;
		background: var(--clr-teal, #0d9488);
		color: white;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.close-btn:hover {
		background: var(--clr-teal-dark, #0f766e);
	}
</style>
