<script>
	// src/lib/components/input/InputRange.svelte
	/**
	 * @typedef {Object} Props
	 * @property {number} [value=50]
	 * @property {number} [min=0]
	 * @property {number} [max=100]
	 * @property {number} [step=1]
	 * @property {string} [label='']
	 * @property {boolean} [disabled=false]
	 */

	let {
		value = $bindable(50),
		min = 0,
		max = 100,
		step = 1,
		label = '',
		disabled = false
	} = $props();

	// Расчет процента заполнения для градиента трека
	let progressPercent = $derived.by(() => {
		const range = max - min;
		if (range <= 0) return 0;
		const current = Math.min(Math.max(value, min), max);
		return ((current - min) / range) * 100;
	});

	function handleInput(e) {
		value = parseFloat(e.currentTarget.value);
	}
</script>

<div class="range-field">
	{#if label || value !== undefined}
		<div class="range-header">
			{#if label}<span class="label">{label}</span>{/if}
			<span class="value-badge">{value}</span>
		</div>
	{/if}

	<input
		type="range"
		class="range-element"
		style="--progress: {progressPercent}%;"
		{min}
		{max}
		{step}
		{value}
		{disabled}
		oninput={handleInput}
	/>
</div>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.range-field {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;

		.range-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			color: $clr-text-accent;
			font-size: 0.85rem;

			.value-badge {
				color: $clr-text-accent;
				font-weight: 700;
			}
		}

		.range-element {
			-webkit-appearance: none;
			appearance: none;
			width: 100%;
			height: 10px;
			border-radius: 5px;
			outline: none;
			cursor: pointer;
			background: linear-gradient(
				to right,
				$clr-teal 0%,
				$clr-teal var(--progress),
				$clr-bg-card var(--progress),
				$clr-bg-card 100%
			);
			box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.6);

			/* Webkit Бегунок */
			&::-webkit-slider-thumb {
				-webkit-appearance: none;
				width: 22px;
				height: 22px;
				border-radius: 50%;
				background: $clr-white;
				border: 2px solid $clr-teal;
				box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
				transition:
					transform 0.1s ease,
					border-color 0.2s ease;
			}

			&::-webkit-slider-thumb:hover {
				transform: scale(1.15);
			}

			&:active::-webkit-slider-thumb {
				border-color: $clr-pink;
				transform: scale(0.95);
			}
		}
	}
</style>
