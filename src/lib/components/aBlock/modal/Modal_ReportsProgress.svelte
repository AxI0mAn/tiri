<!-- src/lib/components/aBlock/modal/Modal_ReportsProgress.svelte -->
<script>
	import ModalBackdrop from './ModalBackdrop.svelte';
	import BtnText from '$lib/components/Btn/BtnText.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {boolean} [isOpen=false]
	 * @property {string} [phase='']
	 * @property {number} [current=0]
	 * @property {number} [total=0]
	 * @property {string} [currentDate='']
	 * @property {boolean} [canAbort=true]
	 * @property {Function} [onAbort]
	 */

	/** @type {Props} */
	let {
		isOpen = $bindable(false),
		phase = '',
		current = 0,
		total = 0,
		currentDate = '',
		canAbort = true,
		onAbort = () => {}
	} = $props();

	// ✅ Процент выполнения
	let percent = $derived(total > 0 ? Math.round((current / total) * 100) : 0);

	// ✅ Обработка прерывания
	function handleAbort() {
		onAbort();
	}
</script>

<ModalBackdrop bind:isOpen maxWidth="420px">
	{#snippet children()}
		<div class="modal-progress">
			<!-- Лоадер -->
			<div class="loader-wrapper">
				<div class="loader"></div>
			</div>

			<!-- Заголовок -->
			<h2>Создание отчётов</h2>

			<!-- Фаза -->
			{#if phase}
				<p class="phase">{phase}</p>
			{/if}

			<!-- Текущая дата -->
			{#if currentDate}
				<p class="current-date">Обработано: {currentDate}</p>
			{/if}

			<!-- Прогресс -->
			<div class="progress-info">
				<span>{current} из {total}</span>
				<span>{percent}%</span>
			</div>

			<div class="progress-bar">
				<div class="progress-fill" style="width: {percent}%"></div>
			</div>

			<!-- Предупреждение -->
			<p class="warning-text">
				⚠️ Выполняется создание отчётов.<br />
				Это займёт время. Не покидайте эту страницу до завершения работы.
			</p>

			<!-- Кнопка прервать -->
			{#if canAbort}
				<div class="modal-actions">
					<BtnText buttonText="🛑 Прервать" onclick={handleAbort} customClass="btn-abort" />
				</div>
			{/if}
		</div>
	{/snippet}
</ModalBackdrop>

<style lang="scss">
	@use '../../../../styles/_variables.scss' as *;

	.modal-progress {
		background: $clr-bg-card;
		border-radius: 16px;
		padding: 32px 24px 24px;
		text-align: center;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	/* ===== Лоадер ===== */
	.loader-wrapper {
		display: flex;
		justify-content: center;
		margin-bottom: 16px;
	}

	.loader {
		width: 48px;
		height: 48px;
		border: 4px solid rgba($clr-text-accent-rgb, 0.2);
		border-top-color: $clr-teal;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ===== Заголовок ===== */
	h2 {
		margin: 0 0 12px 0;
		font-size: 20px;
		color: $clr-text-main;
	}

	/* ===== Фаза ===== */
	.phase {
		margin: 0 0 8px 0;
		font-size: 15px;
		font-weight: 600;
		color: $clr-text-accent;
	}

	/* ===== Текущая дата ===== */
	.current-date {
		margin: 0 0 16px 0;
		font-size: 14px;
		color: $clr-text-main;
		opacity: 0.8;
	}

	/* ===== Прогресс ===== */
	.progress-info {
		display: flex;
		justify-content: space-between;
		font-size: 13px;
		color: $clr-text-main;
		opacity: 0.7;
		margin-bottom: 6px;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: rgba($clr-text-main, 0.1);
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 20px;
	}

	.progress-fill {
		height: 100%;
		background: $clr-teal;
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	/* ===== Предупреждение ===== */
	.warning-text {
		font-size: 13px;
		color: $clr-text-main;
		opacity: 0.7;
		line-height: 1.5;
		margin: 0 0 20px 0;
	}

	/* ===== Кнопки ===== */
	.modal-actions {
		display: flex;
		justify-content: center;
	}

	.modal-actions :global(.btn-abort) {
		background: $clr-error !important;
		color: white !important;
		padding: 10px 32px !important;
		border-radius: 10px !important;
		font-weight: 600 !important;
	}

	.modal-actions :global(.btn-abort:hover) {
		opacity: 0.9 !important;
	}
</style>
