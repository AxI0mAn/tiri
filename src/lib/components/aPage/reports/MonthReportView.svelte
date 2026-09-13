<!-- src/lib/components/aPage/reports/MonthReportView.svelte -->
<script>
	/**
	 * @typedef {Object} Props
	 * @property {Object} report - данные отчёта
	 * @property {'X' | 'Z'} type - тип отчёта
	 */

	/** @type {Props} */
	let { report, type } = $props();

	/**
	 * Форматирует дату "2026-09-13" в "13.09.2026"
	 */
	function formatDateDisplay(dateStr) {
		const [year, month, day] = dateStr.split('-');
		return `${day}.${month}.${year}`;
	}

	/**
	 * Проверяет, есть ли в дне ненулевые значения
	 */
	function hasNonZeroValues(day) {
		if (!day.payments) return false;
		return Object.values(day.payments).some((v) => v > 0);
	}
</script>

{#if type === 'Z'}
	<!-- ===== Z-ОТЧЁТ ===== -->
	<div class="z-report">
		<!-- Доходы -->
		<div class="section">
			<h4 class="section-title">💰 Доходы</h4>
			<div class="row">
				<span class="label">Валовый оборот:</span>
				<span class="value font-digits">{report.payments?.gross ?? 0}</span>
			</div>
			<div class="row">
				<span class="label">Валовый доход:</span>
				<span class="value font-digits">{report.payments?.summary ?? 0}</span>
			</div>
			<div class="row">
				<span class="label">Общая аренда:</span>
				<span class="value font-digits">{report.payments?.allGive ?? 0}</span>
			</div>
			<div class="row">
				<span class="label">Чаевые:</span>
				<span class="value font-digits">{report.payments?.tips ?? 0}</span>
			</div>
			<div class="row">
				<span class="label">Доход (без чаевых):</span>
				<span class="value font-digits">{report.payments?.my ?? 0}</span>
			</div>
			<div class="row total">
				<span class="label">Доход с чаевыми:</span>
				<span class="value font-digits">{report.payments?.allMy ?? 0}</span>
			</div>
		</div>

		<!-- Клиенты -->
		<div class="section">
			<h4 class="section-title">👥 Клиенты</h4>
			<div class="row">
				<span class="label">Всего:</span>
				<span class="value font-digits">{report.clients?.heads ?? 0}</span>
			</div>
			{#if report.clients?.male > 0}
				<div class="row">
					<span class="label">Мужчины:</span>
					<span class="value font-digits">{report.clients.male}</span>
				</div>
			{/if}
			{#if report.clients?.male_bearded > 0}
				<div class="row">
					<span class="label">Бородатые:</span>
					<span class="value font-digits">{report.clients.male_bearded}</span>
				</div>
			{/if}
			{#if report.clients?.female > 0}
				<div class="row">
					<span class="label">Женщины:</span>
					<span class="value font-digits">{report.clients.female}</span>
				</div>
			{/if}
			{#if report.clients?.colorist > 0}
				<div class="row">
					<span class="label">Колористы:</span>
					<span class="value font-digits">{report.clients.colorist}</span>
				</div>
			{/if}
			{#if report.clients?.child > 0}
				<div class="row">
					<span class="label">Дети:</span>
					<span class="value font-digits">{report.clients.child}</span>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<!-- ===== X-ОТЧЁТ ===== -->
	<div class="x-report">
		{#if report.days && report.days.length > 0}
			<h4 class="section-title">📅 Рабочие дни</h4>
			<div class="days-list">
				{#each report.days as day}
					{#if hasNonZeroValues(day)}
						<div class="day-row">
							<span class="day-date">{formatDateDisplay(day.date)}</span>
							<span class="day-sum font-digits">{day.payments.summary}</span>
						</div>
					{/if}
				{/each}
			</div>

			<!-- Итоги -->
			{#if report.totals}
				<div class="section totals-section">
					<h4 class="section-title">📊 Итоги за месяц</h4>
					<div class="row">
						<span class="label">Валовый доход:</span>
						<span class="value font-digits">{report.totals.payments?.summary ?? 0}</span>
					</div>
					<div class="row total">
						<span class="label">Доход с чаевыми:</span>
						<span class="value font-digits">{report.totals.payments?.allMy ?? 0}</span>
					</div>
					<div class="row">
						<span class="label">Клиентов:</span>
						<span class="value font-digits">{report.totals.clients?.heads ?? 0}</span>
					</div>
				</div>
			{/if}
		{:else}
			<p class="no-data">Нет данных за месяц</p>
		{/if}
	</div>
{/if}

<style lang="scss">
	@use '../../../../styles/_variables.scss' as *;

	.section {
		margin-bottom: 20px;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.section-title {
		margin: 0 0 10px 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: $clr-text-main;
		opacity: 0.9;
	}

	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 6px 0;
		font-size: 14px;
		color: $clr-text-main;
		border-bottom: 1px dotted rgba($clr-text-main, 0.15);

		&.total {
			border-bottom: none;
			border-top: 2px solid rgba($clr-text-main, 0.2);
			padding-top: 8px;
			margin-top: 4px;

			.label,
			.value {
				font-weight: 700;
				font-size: 15px;
			}
		}
	}

	.label {
		font-weight: 400;
	}

	.value {
		font-weight: 600;
	}

	:global(.font-digits) {
		letter-spacing: 0.5px;
	}

	/* ===== X-отчёт: дни ===== */
	.days-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-bottom: 16px;
	}

	.day-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background: rgba($clr-bg, 0.4);
		border-radius: 8px;
		font-size: 14px;
		color: $clr-text-main;
	}

	.day-date {
		font-weight: 500;
	}

	.day-sum {
		font-weight: 700;
		color: $clr-teal;
	}

	.totals-section {
		margin-top: 20px;
		padding-top: 16px;
		border-top: 2px solid rgba($clr-text-main, 0.1);
	}

	.no-data {
		text-align: center;
		color: $clr-text-main;
		opacity: 0.5;
		font-size: 14px;
		padding: 20px 0;
		margin: 0;
	}
</style>
