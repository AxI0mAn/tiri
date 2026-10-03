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

<style lang="scss">
	@use '../../../../styles/_variables.scss' as *;
	.modal-confirm {
		background: $clr-bg-card;
		border-radius: 16px;
		padding: 24px;
		width: 100%;
		max-width: 380px;
		text-align: center;
		box-shadow: 0 20px 60px rgba($clr-black-rgb, 0.3);
	}

	.modal-confirm h2 {
		margin: 0 0 12px 0;
		font-size: 18px;
		color: $clr-text-main;
	}

	.modal-confirm p {
		margin: 0 0 24px 0;
		font-size: 15px;
		color: $clr-text-accent;
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
		background: $clr-bg;
		color: $clr-text-main;
	}

	.btn-cancel:hover {
		background: $clr-bg-card;
	}

	.btn-confirm {
		background: $clr-error;
		color: $clr-white;
	}

	.btn-confirm:hover {
		background: $clr-warning;
	}
</style>
