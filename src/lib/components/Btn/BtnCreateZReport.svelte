<!-- src/lib/components/Btn/BtnCreateZReport.svelte -->
<script>
	// @ts-ignore
	import { goto } from '$app/navigation';
	// @ts-ignore
	import { base } from '$app/paths';
	import { toastStore } from '$lib/store/toastStore.svelte.js';
	import { canCreateZReport, hasZReport } from '$lib/components/services/reportGuard.js';
	import { getTodayDate } from '$lib/utils/dateHelpers.js';
	import { appState } from '$lib/store/appState.svelte.js';
	import ModalBackdrop from '$lib/components/aBlock/modal/ModalBackdrop.svelte';

	import BtnImg from '$lib/components/Btn/BtnImg.svelte';
	import BtnText from '$lib/components/Btn/BtnText.svelte';

	let dateStr = $derived(appState.now_date || getTodayDate());

	let isCreating = $state(false);
	let showConfirmModal = $state(false);
	let showWarningModal = $state(false);
	let warningReason = $state('');
	let currentDate = $state('');

	// ✅ Проверяем, есть ли Z-отчёт за текущую дату
	let hasReportForDate = $state(false);

	// ✅ Загружаем статус при изменении даты
	$effect(() => {
		if (dateStr) {
			hasZReport(dateStr).then((exists) => {
				hasReportForDate = exists;
			});
		}
	});

	async function handleOpenConfirm() {
		// ✅ Если отчёт уже есть — ничего не делаем (кнопка заблокирована)
		if (hasReportForDate) return;

		const today = dateStr;
		currentDate = today;

		const existingReport = await hasZReport(today);
		if (existingReport) {
			appState.now_mode = 'z_report';
			appState.now_date = today;
			goto(`${base}/day_Zreport`);
			return;
		}

		const result = await canCreateZReport(today);

		if (!result.allowed) {
			if (result.reason?.includes('напоминания')) {
				warningReason = result.reason;
				showWarningModal = true;
				return;
			}
			toastStore.show(result.reason, 'warning');
			return;
		}

		// ✅ Открываем модалку подтверждения
		showConfirmModal = true;
	}

	async function handleCreateZReport() {
		const today = dateStr; // ← используем проп

		isCreating = true;
		try {
			// TODO: Реализовать создание Z-отчёта
			console.log('[BtnCreateZReport] Создаем Z-отчет за', today);

			// TODO: Сохранить отчёт в IndexedDB
			// await saveReport('day', today, reportData);

			toastStore.show('Z-отчет успешно создан', 'success');
			showConfirmModal = false;

			//  Обновляем статус
			hasReportForDate = true;

			appState.now_mode = 'z_report';
			appState.now_date = today;
			goto(`${base}/day_Zreport`);
		} catch (error) {
			console.error('[BtnCreateZReport] Ошибка:', error);
			toastStore.show('Ошибка при создании Z-отчета', 'error');
		} finally {
			isCreating = false;
		}
	}

	function closeWarningModal() {
		showWarningModal = false;
		warningReason = '';
		currentDate = '';
	}

	function closeConfirmModal() {
		showConfirmModal = false;
	}
</script>

<!-- Кнопка — блокируется при наличии отчёта -->
<BtnText
	buttonText="создать z-отчёт"
	onclick={handleOpenConfirm}
	disabled={isCreating || hasReportForDate}
	customClass="btn-zreport {hasReportForDate ? 'disabled' : ''}"
/>

<!-- Модалка предупреждения (напоминания) -->
<ModalBackdrop isOpen={showWarningModal} maxWidth="420px">
	{#snippet children()}
		<div class="modal-warning">
			<div class="modal-icon">⚠️</div>
			<h2>Нельзя создать Z-отчёт</h2>
			<p class="date">{currentDate}</p>
			<p>Есть напоминания!</p>
			<p class="hint">Перенесите или удалите напоминания, чтобы создать Z-отчёт.</p>
			<div class="modal-actions">
				<BtnText buttonText="Закрыть" onclick={closeWarningModal} customClass="btn-close-modal" />
			</div>
		</div>
	{/snippet}
</ModalBackdrop>

<!-- Модалка подтверждения -->
<ModalBackdrop isOpen={showConfirmModal} maxWidth="420px">
	{#snippet children()}
		<div class="modal-confirm">
			<div class="modal-icon">⚠️</div>
			<h2>Подтверждение</h2>
			<p>
				Если создать Z-отчёт, то смена будет закрыта<br />и вы не сможете добавить новый выполненный
				заказ!
			</p>
			<div class="modal-actions">
				<BtnText buttonText="Отменить" onclick={closeConfirmModal} customClass="btn-cancel-modal" />
				<BtnText
					buttonText="Создать"
					onclick={handleCreateZReport}
					disabled={isCreating}
					customClass="btn-confirm-modal"
				/>
			</div>
		</div>
	{/snippet}
</ModalBackdrop>

<style lang="scss">
	.iconLink {
		padding: 0.5rem;
		width: 20%;
		min-width: fit-content;
		display: flex;
		flex-flow: column nowrap;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		span {
			font-size: calc(0.4rem + 0.6vw);
			text-transform: uppercase;
			font-weight: 777;
		}
	}

	.iconLink.disabled {
		opacity: 0.5;
		pointer-events: none;
		cursor: not-allowed;
	}

	.iconLink:hover {
		opacity: 0.8;
	}

	.iconLink span {
		font-size: 12px;
		color: var(--clr-text-secondary, #666);
	}

	.modal-warning {
		background: var(--clr-bg-card, #ffffff);
		border-radius: 16px;
		padding: 32px 24px 24px;
		text-align: center;
		max-width: 400px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.modal-icon {
		font-size: 48px;
		margin-bottom: 12px;
	}

	.modal-warning h2 {
		margin: 0 0 8px 0;
		font-size: 20px;
		color: var(--clr-text-primary, #1a1a1a);
	}

	.modal-warning .date {
		font-size: 16px;
		font-weight: 600;
		color: var(--clr-text-secondary, #555);
		margin-bottom: 8px;
	}

	.modal-warning p {
		margin: 0 0 4px 0;
		font-size: 15px;
		color: var(--clr-text-secondary, #555);
	}

	.modal-warning .hint {
		font-size: 13px;
		color: var(--clr-text-secondary, #888);
		margin-bottom: 20px;
		margin-top: 12px;
	}

	.modal-confirm {
		background: var(--clr-bg-card, #ffffff);
		border-radius: 16px;
		padding: 32px 24px 24px;
		text-align: center;
		max-width: 400px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.modal-confirm h2 {
		margin: 0 0 12px 0;
		font-size: 20px;
		color: var(--clr-text-primary, #1a1a1a);
	}

	.modal-confirm p {
		margin: 0 0 20px 0;
		font-size: 15px;
		color: var(--clr-text-secondary, #555);
		line-height: 1.5;
	}

	.modal-actions {
		display: flex;
		justify-content: center;
		gap: 12px;
	}

	.modal-actions :global(.btn-close-modal) {
		background: var(--clr-teal, #0d9488) !important;
		color: white !important;
		padding: 10px 32px !important;
		border-radius: 10px !important;
	}

	.modal-actions :global(.btn-cancel-modal) {
		background: var(--clr-bg-primary, #f0f0f0) !important;
		color: var(--clr-text-primary, #1a1a1a) !important;
		padding: 10px 32px !important;
		border-radius: 10px !important;
	}

	.modal-actions :global(.btn-confirm-modal) {
		background: var(--clr-teal, #0d9488) !important;
		color: white !important;
		padding: 10px 32px !important;
		border-radius: 10px !important;
	}

	.modal-actions :global(.btn-confirm-modal:disabled) {
		opacity: 0.5 !important;
		cursor: not-allowed !important;
	}
	button {
		background-color: transparent;
	}
</style>
