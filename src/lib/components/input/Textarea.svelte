<script>
	// src/lib/components/input/Textarea.svelte
	/**
	 * @typedef {Object} Props
	 * @property {string} [value='']
	 * @property {string} [placeholder='']
	 * @property {string} [label='']
	 * @property {number} [rows=4]
	 */

	let { value = $bindable(''), placeholder = '', label = '', rows = 4 } = $props();

	function handleInput(e) {
		value = e.currentTarget.value;
	}
</script>

<div class="textarea-field">
	{#if label}<label class="label" for="txt-area">{label}</label>{/if}

	<textarea
		id="txt-area"
		class="textarea-element"
		{rows}
		{placeholder}
		{value}
		oninput={handleInput}
	></textarea>
</div>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.textarea-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;

		.label {
			font-size: 0.85rem;
			color: $clr-text-accent;
			opacity: 0.8;
		}

		.textarea-element {
			width: 100%;
			flex: 1; // <--- Заставляет textarea занять всё оставшееся место по высоте
			min-height: 3rem; // Предотвращаем схлопывание
			padding: 12px 14px;
			border-radius: 12px;
			border: 2px solid rgba(255, 255, 255, 0.2);
			background: $clr-bg-card;
			color: $clr-text-main;
			font-family: inherit;
			font-size: 0.95rem;
			outline: none;
			resize: vertical; /* разрешить пользователю менять */
			box-sizing: border-box;
			transition:
				border-color 0.2s ease,
				box-shadow 0.2s ease;

			&::placeholder {
				color: $clr-text-accent;
			}

			&:hover {
				border-color: $clr-teal;
			}

			&:focus {
				border-color: $clr-teal;
				box-shadow:
					inset 2px 2px 5px rgba(0, 0, 0, 0.5),
					inset -2px -2px 5px rgba(255, 255, 255, 0.05);
			}

			/* Стилизация скроллбара */
			&::-webkit-scrollbar {
				width: 6px;
			}
			&::-webkit-scrollbar-thumb {
				background: rgba(255, 255, 255, 0.2);
				border-radius: 3px;
			}
		}
	}
</style>
