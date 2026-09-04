<!-- src/lib/components/aBlock/modal/Modal_ZreportSaved.svelte -->
<script>
	import ModalBackdrop from './ModalBackdrop.svelte';
	import { appState } from '$lib/store/appState.svelte.js';
	// @ts-ignore
	import { goto } from '$app/navigation';
	// @ts-ignore
	import { base } from '$app/paths';

	// Принимаем onSend как пропс
	let { onSend = () => {} } = $props();

	function closeModal() {
		appState.closeZReportSaved();
		goto(`${base}/day`);
	}

	function handleSend() {
		if (typeof onSend === 'function') {
			onSend();
		} else {
			console.warn('[Modal_ZreportSaved] onSend не передан');
		}
		// Не закрываем модалку здесь — пусть закроется после отправки
		// appState.closeZReportSaved();
		// goto(`${base}/day`);
	}
</script>

<ModalBackdrop isOpen={appState.modal_zReportSaved} maxWidth="400px">
	{#snippet children()}
		<div class="modal-saved">
			<div class="icon">✅</div>
			<h2>Z-отчёт успешно сохранён</h2>

			<div class="actions">
				<button class="btn-close" onclick={closeModal}> Закрыть ❌ </button>
				<button class="btn-send" onclick={handleSend}> Отправить 📨 </button>
			</div>
		</div>
	{/snippet}
</ModalBackdrop>

<style lang="scss">
	.modal-saved {
		background: var(--clr-bg-card, #ffffff);
		border-radius: 16px;
		padding: 32px 24px 24px;
		width: 100%;
		max-width: 380px;
		text-align: center;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.icon {
		font-size: 48px;
		margin-bottom: 12px;
	}

	.modal-saved h2 {
		margin: 0 0 24px 0;
		font-size: 18px;
		color: var(--clr-text-primary, #1a1a1a);
	}

	.actions {
		display: flex;
		gap: 12px;
	}

	.actions button {
		flex: 1;
		padding: 12px 16px;
		border: none;
		border-radius: 10px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-close {
		background: var(--clr-bg-primary, #f0f0f0);
		color: var(--clr-text-primary, #1a1a1a);
	}

	.btn-close:hover {
		background: var(--clr-bg-secondary, #e0e0e0);
	}

	.btn-send {
		background: var(--clr-teal, #0d9488);
		color: white;
	}

	.btn-send:hover {
		background: var(--clr-teal-dark, #0f766e);
	}
</style>
