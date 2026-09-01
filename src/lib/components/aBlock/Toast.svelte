<!-- src/lib/components/aBlock/Toast.svelte -->
<script>
	//  компонент уведомления (Toast)
	import { fade } from 'svelte/transition';

	let {
		message = '',
		type = 'info',
		duration = 3000,
		isOpen = false,
		onClose = () => {}
	} = $props();

	// ✅ Если нет сообщения — не показываем
	let visible = $state(isOpen && message.trim().length > 0);

	const iconMap = {
		success: '✅',
		error: '❌',
		info: 'ℹ️',
		warning: '⚠️'
	};

	function close() {
		visible = false;
		setTimeout(() => onClose(), 300);
	}

	// Автоматическое закрытие
	setTimeout(() => {
		if (visible) close();
	}, duration);
</script>

{#if visible && message.trim().length > 0}
	<!-- рендерим Toast -->
	<div
		class="toast"
		class:success={type === 'success'}
		class:error={type === 'error'}
		class:info={type === 'info'}
		class:warning={type === 'warning'}
		transition:fade={{ duration: 300 }}
		role="alert"
	>
		<span class="icon">{iconMap[type] || 'ℹ️'}</span>
		<span class="message">{message}</span>
		<button class="close" onclick={close} aria-label="Закрыть">✕</button>
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		top: 20%;
		left: 50%;
		transform: translateX(-50%);
		z-index: 999999;
		padding: 16px 24px;
		border-radius: 12px;
		background: var(--clr-bg-card, #ffffff);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		gap: 12px;
		max-width: 90%;
		min-width: 280px;
		border: 1px solid rgba(0, 0, 0, 0.08);
	}

	.toast.success {
		border-left: 4px solid var(--clr-teal, #0d9488);
	}

	.toast.error {
		border-left: 4px solid var(--clr-error, #e74c3c);
	}

	.toast.warning {
		border-left: 4px solid var(--clr-warning, #f59e0b);
	}

	.toast.info {
		border-left: 4px solid var(--clr-info, #3b82f6);
	}

	.icon {
		font-size: 24px;
		flex-shrink: 0;
	}

	.message {
		flex: 1;
		font-size: 15px;
		color: var(--clr-text-primary, #1a1a1a);
		font-weight: 500;
	}

	.close {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.05);
		color: var(--clr-text-secondary, #666);
		font-size: 16px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}

	.close:hover {
		background: rgba(0, 0, 0, 0.1);
	}
</style>
