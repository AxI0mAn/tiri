<!-- src/lib/components/aBlock/modal/Modal_TimePicker.svelte -->
<script>
	import ModalBackdrop from './ModalBackdrop.svelte';
	import BtnText from '$lib/components/Btn/BtnText.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {boolean} [isOpen=false]
	 * @property {string} [value='']
	 * @property {Function} [onSelectTime]
	 * @property {Function} [onClose]
	 */

	/** @type {Props} */
	let {
		isOpen = $bindable(false),
		value = '',
		onSelectTime = () => {},
		onClose = () => {}
	} = $props();

	// ===== БАЗОВЫЕ МАССИВЫ =====
	const hoursBase = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
	const minutBase = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

	// ===== УТРОЕННЫЕ МАССИВЫ (для цикличности) =====
	const hours = [...hoursBase, ...hoursBase, ...hoursBase];
	const minut = [...minutBase, ...minutBase, ...minutBase];

	const showNum = 5;
	const ITEM_HEIGHT = 48;
	const WHEEL_HEIGHT = ITEM_HEIGHT * showNum;

	// ===== СОСТОЯНИЕ =====
	let selectedHour = $state('09');
	let selectedMinute = $state('30');

	let hoursScrollEl = $state(null);
	let minutScrollEl = $state(null);

	let wasOpen = $state(false);

	// ===== ПРИ ОТКРЫТИИ =====
	$effect(() => {
		if (isOpen && !wasOpen) {
			wasOpen = true;

			let h, m;
			if (value && /^\d{2}:\d{2}$/.test(value)) {
				[h, m] = value.split(':');
			} else {
				const now = new Date();
				h = String(now.getHours()).padStart(2, '0');
				m = String(now.getMinutes()).padStart(2, '0');
			}

			// Найти ближайшее в массиве
			const hIndex = findClosestIndex(hoursBase, h);
			const mIndex = findClosestIndex(minutBase, m);

			selectedHour = hoursBase[hIndex];
			selectedMinute = minutBase[mIndex];

			// Ждём рендера
			setTimeout(() => {
				scrollToMiddle(hoursScrollEl, hIndex, hoursBase.length);
				scrollToMiddle(minutScrollEl, mIndex, minutBase.length);
			}, 50);
		}

		if (!isOpen && wasOpen) {
			wasOpen = false;
		}
	});

	// ===== Поиск ближайшего индекса в базовом массиве =====
	function findClosestIndex(arr, val) {
		const exact = arr.indexOf(val);
		if (exact !== -1) return exact;

		// Если нет точного совпадения — ищем ближайшее
		const numVal = parseInt(val, 10);
		let bestIdx = 0;
		let bestDiff = Infinity;
		for (let i = 0; i < arr.length; i++) {
			const diff = Math.abs(parseInt(arr[i], 10) - numVal);
			if (diff < bestDiff) {
				bestDiff = diff;
				bestIdx = i;
			}
		}
		return bestIdx;
	}

	// ===== Скролл в среднюю копию =====
	function scrollToMiddle(el, baseIndex, baseLength) {
		if (!el) return;
		const middleIndex = baseLength + baseIndex; // средняя копия
		el.scrollTop = middleIndex * ITEM_HEIGHT;
	}

	// ===== Обработка скролла (с цикличностью) =====
	function handleScroll(el, list, setter, baseList) {
		if (!el) return;

		const index = Math.round(el.scrollTop / ITEM_HEIGHT);
		const clamped = Math.max(0, Math.min(list.length - 1, index));
		const selected = list[clamped];

		setter(selected);

		// ✅ Цикличность: если близко к краю — перепрыгиваем в среднюю копию
		const baseLen = baseList.length;
		if (clamped < baseLen * 0.5) {
			// у левого края — перескок в середину (без анимации)
			const targetIndex = clamped + baseLen;
			el.scrollTo({ top: targetIndex * ITEM_HEIGHT, behavior: 'auto' });
		} else if (clamped > baseLen * 2.5) {
			// у правого края — перескок в середину
			const targetIndex = clamped - baseLen;
			el.scrollTo({ top: targetIndex * ITEM_HEIGHT, behavior: 'auto' });
		}
	}

	// ===== Клик по элементу =====
	function handleItemClick(el, baseList, item, baseIndexFn) {
		const baseIndex = baseList.indexOf(item);
		if (baseIndex === -1) return;
		const middleIndex = baseList.length + baseIndex;
		el.scrollTo({ top: middleIndex * ITEM_HEIGHT, behavior: 'smooth' });
	}

	// ===== Колёсико мыши =====
	function handleWheel(event, list, scrollEl) {
		event.preventDefault();
		const direction = event.deltaY > 0 ? 1 : -1;
		const currentIndex = Math.round(scrollEl.scrollTop / ITEM_HEIGHT);
		const nextIndex = Math.max(0, Math.min(list.length - 1, currentIndex + direction));
		scrollEl.scrollTo({ top: nextIndex * ITEM_HEIGHT, behavior: 'smooth' });
	}

	// ===== Кнопки =====
	function handleCancel() {
		onClose();
	}

	function handleSelect() {
		onSelectTime(`${selectedHour}:${selectedMinute}`);
		onClose();
	}
</script>

<ModalBackdrop bind:isOpen maxWidth="360px">
	{#snippet children()}
		<div class="time-picker">
			<h2 class="picker-title">Выберите время</h2>

			<div class="wheels-wrapper">
				<!-- Часы -->
				<div class="wheel-column">
					<div class="wheel-highlight" aria-hidden="true"></div>
					<div
						class="wheel-scroll"
						bind:this={hoursScrollEl}
						onscroll={() =>
							handleScroll(hoursScrollEl, hours, (v) => (selectedHour = v), hoursBase)}
						onwheel={(e) => handleWheel(e, hours, hoursScrollEl)}
						style="height: {WHEEL_HEIGHT}px;"
					>
						<div class="spacer" style="height: {ITEM_HEIGHT * Math.floor(showNum / 2)}px;"></div>

						{#each hours as h, i}
							<div
								class="wheel-item"
								class:active={h === selectedHour &&
									i >= hoursBase.length &&
									i < hoursBase.length * 2}
								style="height: {ITEM_HEIGHT}px;"
								role="button"
								tabindex="0"
								onclick={() => handleItemClick(hoursScrollEl, hoursBase, h)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleItemClick(hoursScrollEl, hoursBase, h);
									}
								}}
							>
								{h}
							</div>
						{/each}

						<div class="spacer" style="height: {ITEM_HEIGHT * Math.floor(showNum / 2)}px;"></div>
					</div>
				</div>

				<!-- Двоеточие -->
				<div class="separator" aria-hidden="true">
					<span class="dot"></span>
					<span class="dot"></span>
				</div>

				<!-- Минуты -->
				<div class="wheel-column">
					<div class="wheel-highlight" aria-hidden="true"></div>
					<div
						class="wheel-scroll"
						bind:this={minutScrollEl}
						onscroll={() =>
							handleScroll(minutScrollEl, minut, (v) => (selectedMinute = v), minutBase)}
						onwheel={(e) => handleWheel(e, minut, minutScrollEl)}
						style="height: {WHEEL_HEIGHT}px;"
					>
						<div class="spacer" style="height: {ITEM_HEIGHT * Math.floor(showNum / 2)}px;"></div>

						{#each minut as m, i}
							<div
								class="wheel-item"
								class:active={m === selectedMinute &&
									i >= minutBase.length &&
									i < minutBase.length * 2}
								style="height: {ITEM_HEIGHT}px;"
								role="button"
								tabindex="0"
								onclick={() => handleItemClick(minutScrollEl, minutBase, m)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleItemClick(minutScrollEl, minutBase, m);
									}
								}}
							>
								{m}
							</div>
						{/each}

						<div class="spacer" style="height: {ITEM_HEIGHT * Math.floor(showNum / 2)}px;"></div>
					</div>
				</div>
			</div>

			<!-- Кнопки -->
			<div class="picker-actions">
				<BtnText buttonText="Отменить" onclick={handleCancel} customClass="btn-cancel-time" />
				<BtnText buttonText="Выбрать" onclick={handleSelect} customClass="btn-confirm-time" />
			</div>
		</div>
	{/snippet}
</ModalBackdrop>

<style lang="scss">
	@use '../../../../styles/_variables.scss' as *;

	.time-picker {
		background: $clr-bg-card;
		border-radius: 16px;
		padding: 24px 20px 20px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.picker-title {
		margin: 0 0 16px 0;
		font-size: 1.1rem;
		font-weight: 700;
		color: $clr-text-main;
		text-align: center;
	}

	.wheels-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-bottom: 20px;
	}

	.wheel-column {
		position: relative;
		flex: 1;
		max-width: 90px;
	}

	.wheel-highlight {
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 48px;
		transform: translateY(-50%);
		border-radius: 10px;
		border: 2px solid $clr-teal;
		box-shadow:
			inset 2px 2px 5px rgba(0, 0, 0, 0.5),
			inset -2px -2px 5px rgba(255, 255, 255, 0.05);
		pointer-events: none;
		z-index: 1;
	}

	.wheel-scroll {
		overflow-y: scroll;
		scroll-snap-type: y mandatory;
		scrollbar-width: none;
		-ms-overflow-style: none;
		position: relative;
		z-index: 2;
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent 0%,
			black 25%,
			black 75%,
			transparent 100%
		);
		mask-image: linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%);

		&::-webkit-scrollbar {
			display: none;
		}
	}

	.wheel-item {
		display: flex;
		align-items: center;
		justify-content: center;
		scroll-snap-align: center;
		font-size: 1.4rem;
		font-weight: 500;
		color: $clr-text-main;
		opacity: 0.5;
		cursor: pointer;
		user-select: none;
		transition:
			opacity 0.2s ease,
			transform 0.2s ease;
		-webkit-tap-highlight-color: transparent;

		&.active {
			opacity: 1;
			font-weight: 700;
			color: $clr-teal;
			transform: scale(1.05);
		}

		&:hover {
			opacity: 0.8;
		}
	}

	.separator {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 0 4px;
		align-self: center;

		.dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			border: 2px solid $clr-teal;
			box-shadow:
				inset 2px 2px 5px rgba(0, 0, 0, 0.5),
				inset -2px -2px 5px rgba(255, 255, 255, 0.05);
			background: $clr-bg-card;
		}
	}

	.picker-actions {
		display: flex;
		gap: 12px;
		justify-content: center;
	}

	.picker-actions :global(.btn-cancel-time) {
		flex: 1;
		padding: 10px 16px !important;
		border-radius: 10px !important;
		background: rgba($clr-text-main, 0.1) !important;
		color: $clr-text-main !important;
		font-weight: 600 !important;
	}

	.picker-actions :global(.btn-confirm-time) {
		flex: 1;
		padding: 10px 16px !important;
		border-radius: 10px !important;
		background: $clr-teal !important;
		color: white !important;
		font-weight: 600 !important;
	}
</style>
