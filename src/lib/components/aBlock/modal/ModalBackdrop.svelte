<script>
	// src/lib/components/aBlock/modal/ModalBackdrop.svelte
	import { fade } from 'svelte/transition';

	// Делаем isOpen реактивным через $bindable(), чтобы родитель мог менять его статус
	let { isOpen = $bindable(false), children, maxWidth = '500px' } = $props();

	// Функция закрытия по клику на бэкдроп
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			isOpen = false;
		}
	}
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={handleBackdropClick} transition:fade={{ duration: 150 }}>
		<div class="modal-content" style="max-width: {maxWidth};">
			{@render children?.()}
		</div>
	</div>
{/if}

<style lang="scss">
	@use '../../../../styles/_variables.scss' as *;
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background-color: rgba($clr-black-rgb, 0.85);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 1.25rem;
	}

	.modal-content {
		background-color: $clr-bg-card;

		border: 1px solid rgba($clr-teal-rgb, 0.3);
		border-radius: 1rem;
		padding: 1.5rem;
		max-width: 50vh;
		width: fit-content;

		box-shadow: $shadow-deep;
		text-align: center;

		h3 {
			margin-bottom: 1.25rem;
			font-size: 1.1rem;
			color: $clr-text-main;
			font-weight: 400;
		}

		.modal-grid {
			width: 100%;
			display: flex;
			flex-flow: row;
			justify-content: space-around;
			align-items: center;
			margin-bottom: 1.25rem;
		}

		.modal-actions {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;

			.btn__clear-all {
				background-color: $clr-pink;
				color: $clr-text-main;
				border: none;
				padding: 0.75rem;
				border-radius: 0.5rem;
				transition: all 0.2s;

				&:hover {
					background-color: $clr-text-main;
					color: $clr-pink;
					box-shadow: $shadow-neon-coral;
				}
			}

			.btn__cancel {
				background: transparent;
				border: 1px solid $clr-bg-dark;
				color: $clr-white;
				margin-top: 0.25rem;
				padding: 0.75rem;
				border-radius: 0.5rem;
				transition: all 0.2s;

				&:hover {
					color: $clr-text-main;
					border-color: $clr-teal;
					background-color: rgba($clr-teal-rgb, 0.1);
				}
			}
		}
	}
</style>
