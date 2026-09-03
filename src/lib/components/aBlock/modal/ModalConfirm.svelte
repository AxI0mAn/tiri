<!-- src/lib/components/aBlock/modal/ModalConfirm.svelte -->
<script>
	// @ts-ignore
	import { goto } from '$app/navigation';
	// @ts-ignore
	import { base } from '$app/paths';
	import ModalBackdrop from './ModalBackdrop.svelte';
	import { appState } from '$lib/store/appState.svelte';

	let {
		isOpen = false,
		title = 'Подтверждение',
		message = 'Вы уверены?',
		onConfirm = () => {},
		onCancel = () => {}
	} = $props();

	function handleConfirm() {
		onConfirm();
		onCancel();
	}
	function closeModal() {
		appState.closeZReportSaved();
		goto(`${base}/day`);
	}
</script>

<ModalBackdrop {isOpen} maxWidth="400px">
	{#snippet children()}
		<div class="modal-confirm">
			<h2>{title}</h2>
			<p>{message}</p>
			<div class="actions">
				<button class="btn-cancel" onclick={closeModal}>Отмена</button>
				<button class="btn-confirm" onclick={handleConfirm}>Удалить</button>
			</div>
		</div>
	{/snippet}
</ModalBackdrop>

<style>
	.modal-confirm {
		background: var(--clr-bg-card, #ffffff);
		border-radius: 16px;
		padding: 24px;
		width: 100%;
		max-width: 380px;
		text-align: center;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.modal-confirm h2 {
		margin: 0 0 12px 0;
		font-size: 18px;
		color: var(--clr-text-primary, #1a1a1a);
	}

	.modal-confirm p {
		margin: 0 0 24px 0;
		font-size: 15px;
		color: var(--clr-text-secondary, #666);
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

	.btn-cancel {
		background: var(--clr-bg-primary, #f0f0f0);
		color: var(--clr-text-primary, #1a1a1a);
	}

	.btn-cancel:hover {
		background: var(--clr-bg-secondary, #e0e0e0);
	}

	.btn-confirm {
		background: var(--clr-error, #e74c3c);
		color: white;
	}

	.btn-confirm:hover {
		background: var(--clr-error-dark, #c0392b);
	}
</style>
