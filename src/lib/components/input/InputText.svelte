<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} [value='']
	 * @property {string} [placeholder='']
	 * @property {string} [label='']
	 * @property {string} [error='']
	 * @property {boolean} [disabled=false]
	 * @property {string} [customClass='']
	 */

	let {
		value = $bindable(''),
		placeholder = '',
		label = '',
		error = '',
		disabled = false,
		customClass = ''
	} = $props();

	let hasError = $derived(typeof error === 'string' && error.trim().length > 0);

	function handleInput(e) {
		value = e.currentTarget.value;
	}
</script>

<div class="input-field {customClass}" class:has-error={hasError} class:is-disabled={disabled}>
	{#if label}
		<label class="input-label" for="txt-input">{label}</label>
	{/if}

	<div class="input-control">
		<input
			id="txt-input"
			type="text"
			class="input-element"
			{value}
			{placeholder}
			{disabled}
			oninput={handleInput}
			autocomplete="off"
		/>
	</div>

	{#if hasError}
		<span class="error-text">{error}</span>
	{/if}
</div>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.input-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;
		box-sizing: border-box;

		.input-label {
			font-size: 0.85rem;
			color: $clr-text-accent;
			opacity: 0.8;
			user-select: none;
		}

		.input-control {
			position: relative;
			width: 100%;
			border-radius: 12px;
			border: 2px solid rgba(255, 255, 255, 0.2);
			background: $clr-bg-card;
			transition:
				border-color 0.2s ease,
				box-shadow 0.2s ease;

			&:hover {
				border-color: $clr-teal;
			}

			&:focus-within {
				border-color: $clr-teal;
				/* Вжатая неоморфная тень при фокусе */
				box-shadow:
					inset 2px 2px 5px rgba(0, 0, 0, 0.5),
					inset -2px -2px 5px rgba(255, 255, 255, 0.05);
			}
		}

		.input-element {
			width: 100%;
			height: 44px;
			padding: 0 14px;
			background: transparent;
			border: none;
			outline: none;
			color: $clr-text-main;
			font-size: 0.95rem;
			box-sizing: border-box;

			&::placeholder {
				color: $clr-text-accent;
			}
		}

		&.has-error {
			.input-control {
				border-color: $clr-pink;
			}
			.error-text {
				font-size: 0.75rem;
				color: $clr-pink;
			}
		}

		&.is-disabled {
			opacity: 0.5;
			pointer-events: none;
		}
	}
</style>
