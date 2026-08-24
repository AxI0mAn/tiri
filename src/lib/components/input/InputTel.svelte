<!-- src/lib/components/input/InputTel.svelte -->
<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} [value='']
	 * @property {string} [label='']
	 * @property {string} [placeholder='+7 (___) ___-__-__']
	 * @property {string} [customClass='']
	 * @property {boolean} [disabled=false]
	 */

	let {
		value = $bindable(''),
		label = '',
		placeholder = '+7 (___) ___-__-__',
		customClass = '',
		disabled = false
	} = $props();

	// Ограничиваем ввод: только цифры, плюс, скобки, пробел и дефис
	function handleBeforeInput(e) {
		if (e.data && !/^[0-9+\s()\-]$/.test(e.data)) {
			e.preventDefault();
		}
	}

	function handleInput(e) {
		const input = e.currentTarget;
		value = input.value;
	}

	function clearInput() {
		value = '';
	}
</script>

<div class="input-tel-field {customClass}">
	{#if label}
		<span class="input-label">{label}</span>
	{/if}

	<div class="control-group">
		<div class="tel-icon" aria-hidden="true">
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path
					d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
				/>
			</svg>
		</div>

		<input
			type="tel"
			inputmode="tel"
			class="tel-input"
			{disabled}
			{placeholder}
			{value}
			onbeforeinput={handleBeforeInput}
			oninput={handleInput}
		/>

		{#if value}
			<button type="button" class="btn-clear" onclick={clearInput} aria-label="Clear input">
				✕
			</button>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.input-tel-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;

		.input-label {
			font-size: 0.85rem;
			color: $clr-text-accent;
			opacity: 0.8;
		}

		.control-group {
			display: inline-flex;
			align-items: center;
			height: 44px;
			padding: 0 12px;
			border-radius: 12px;
			border: 2px solid rgba(255, 255, 255, 0.2);
			background: $clr-bg-card;
			overflow: hidden;
			transition: border-color 0.2s ease;

			&:hover {
				border-color: $clr-teal;
			}

			&:focus-within {
				border-color: $clr-teal;
				box-shadow:
					inset 2px 2px 5px rgba(0, 0, 0, 0.5),
					inset -2px -2px 5px rgba(255, 255, 255, 0.05);
			}
		}

		.tel-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			color: $clr-text-main;
			opacity: 0.6;
			margin-right: 8px;
		}

		.tel-input {
			flex: 1;
			height: 100%;
			border: none;
			background: transparent;
			color: $clr-text-main;
			font-size: 0.95rem;
			font-weight: 600;
			outline: none;

			&::placeholder {
				color: $clr-text-main;
				opacity: 0.35;
				font-weight: 400;
			}
		}

		.btn-clear {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 24px;
			height: 24px;
			background: transparent;
			border: none;
			color: $clr-text-main;
			opacity: 0.5;
			font-size: 0.9rem;
			cursor: pointer;
			border-radius: 50%;
			transition:
				background 0.15s ease,
				color 0.15s ease,
				opacity 0.15s ease;

			&:hover {
				opacity: 1;
				background: rgba(255, 255, 255, 0.1);
				color: $clr-pink;
			}
		}
	}
</style>
