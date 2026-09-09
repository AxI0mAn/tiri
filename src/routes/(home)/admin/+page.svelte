<!-- src/routes/(home)/admin/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	// @ts-ignore
	import { goto } from '$app/navigation';
	// @ts-ignore
	import { base } from '$app/paths';
	import { toastStore } from '$lib/store/toastStore.svelte.js';
	import { saveEntry, getAllThisDayRecords } from '$lib/utils/db.js';
	import { getTodayDate } from '$lib/utils/dateHelpers.js';

	// ===== Состояние блоков =====
	let blocks = $state([]);
	let isLoading = $state(false);
	let today = getTodayDate();

	// ===== Дефолтные значения =====
	const DEFAULT_GENDER = 'male';
	const DEFAULT_MY_PERCENT = 50;
	const DEFAULT_PAY = 'cash';

	// ===== Общая дата (три поля) =====
	let globalDay = $state('');
	let globalMonth = $state('');
	let globalYear = $state(new Date().getFullYear().toString());

	// ===== Флаг, что сохранение выполнено =====
	let isSaved = $state(false);
	let lastSavedDate = $state('');

	// ===== Состояние для автоматического ввода =====
	let autoTextarea = $state('');

	// ===== Форматирование даты =====
	function formatGlobalDate() {
		if (!globalDay || !globalMonth || !globalYear) return '';
		const day = String(globalDay).padStart(2, '0');
		const month = String(globalMonth).padStart(2, '0');
		return `${globalYear}-${month}-${day}`;
	}

	// ===== Добавить новый блок =====
	function addBlock() {
		const now = Date.now();

		let newTime = '09:00';
		if (blocks.length > 0) {
			const lastBlock = blocks[blocks.length - 1];
			const [hours, minutes] = lastBlock.time.split(':').map(Number);
			const totalMinutes = hours * 60 + minutes + 20;
			const newHours = Math.floor(totalMinutes / 60) % 24;
			const newMinutes = totalMinutes % 60;
			newTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
		}

		blocks = [
			...blocks,
			{
				id: `block_${now}`,
				date: formatGlobalDate(),
				time: newTime,
				sum: 0,
				gender: DEFAULT_GENDER,
				myPercent: DEFAULT_MY_PERCENT,
				pay: DEFAULT_PAY
			}
		];
	}

	// ===== Удалить блок =====
	function removeBlock(id) {
		if (blocks.length <= 1) {
			toastStore.show('Должен быть хотя бы один блок', 'warning');
			return;
		}
		blocks = blocks.filter((block) => block.id !== id);
	}

	// ===== Очистить все блоки =====
	function clearAll() {
		if (blocks.length === 0) {
			addBlock();
			return;
		}
		blocks = [
			{
				id: `block_${Date.now()}`,
				date: formatGlobalDate(),
				time: '09:00',
				sum: 0,
				gender: DEFAULT_GENDER,
				myPercent: DEFAULT_MY_PERCENT,
				pay: DEFAULT_PAY
			}
		];
		toastStore.show('Все блоки очищены', 'info');
	}

	// ===== Сохранить все заметки =====
	async function saveAll() {
		if (blocks.length === 0) {
			toastStore.show('Нет данных для сохранения', 'warning');
			return;
		}

		const formattedDate = formatGlobalDate();
		if (!formattedDate) {
			toastStore.show('Заполните дату (день, месяц, год)', 'error');
			return;
		}

		// Проверяем заполненность
		const invalidBlocks = blocks.filter(
			(b) => !b.date || !b.time || b.sum === undefined || b.sum === null || b.sum <= 0
		);

		if (invalidBlocks.length > 0) {
			toastStore.show('Заполните все поля (дата, время, сумма > 0)', 'error');
			return;
		}

		isLoading = true;
		let savedCount = 0;
		let errors = [];

		try {
			for (const block of blocks) {
				try {
					const [year, month, day] = block.date.split('-').map(Number);
					const [hours, minutes] = block.time.split(':').map(Number);
					const timestamp = new Date(year, month - 1, day, hours, minutes).getTime();

					const entry = {
						id: `note_${timestamp}`,
						type: 'note',
						types: 'note',
						timestamp: timestamp,
						dateStr: block.date,
						dateCreate: block.date,
						year: year,
						yearMonth: `${year}-${String(month).padStart(2, '0')}`,
						value: {
							gender: block.gender || DEFAULT_GENDER,
							percent: {
								sum: Number(block.sum),
								myPercent: block.myPercent || DEFAULT_MY_PERCENT,
								tips: 0
							},
							pay: block.pay || DEFAULT_PAY,
							notes: {
								name: '',
								phone: '',
								text: ''
							}
						}
					};

					await saveEntry(entry);
					savedCount++;
				} catch (err) {
					errors.push({ block, error: err.message });
				}
			}

			if (errors.length > 0) {
				toastStore.show(
					`Сохранено ${savedCount} из ${blocks.length}. Ошибок: ${errors.length}`,
					'error'
				);
			} else {
				toastStore.show(`✅ Успешно сохранено ${savedCount} заметок`, 'success');
				isSaved = true;
				lastSavedDate = formattedDate;
			}

			// Оставляем блоки, но сбрасываем суммы и время на 9:00
			blocks = blocks.map((block, index) => ({
				...block,
				id: `block_${Date.now()}_${index}`,
				time: index === 0 ? '09:00' : addMinutesToTime('09:00', index * 20),
				sum: 0
			}));
		} catch (err) {
			console.error('[Import] Ошибка:', err);
			toastStore.show('Ошибка при сохранении', 'error');
		} finally {
			isLoading = false;
		}
	}

	// ===== Добавить минуты к времени =====
	function addMinutesToTime(timeStr, minutesToAdd) {
		const [hours, minutes] = timeStr.split(':').map(Number);
		const totalMinutes = hours * 60 + minutes + minutesToAdd;
		const newHours = Math.floor(totalMinutes / 60) % 24;
		const newMinutes = totalMinutes % 60;
		return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
	}

	// ===== Генерация блоков из автоматического ввода =====
	function generateFromAuto() {
		const formattedDate = formatGlobalDate();
		if (!formattedDate) {
			toastStore.show('Заполните общую дату (день, месяц, год)', 'error');
			return;
		}

		const numbers = autoTextarea
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s.length > 0)
			.map(Number)
			.filter((n) => !isNaN(n) && n > 0);

		if (numbers.length === 0) {
			toastStore.show('Введите хотя бы одно число (через запятую)', 'error');
			return;
		}

		blocks = [];

		let timeMinutes = 9 * 60;
		for (const sum of numbers) {
			const hours = Math.floor(timeMinutes / 60) % 24;
			const minutes = timeMinutes % 60;
			const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

			blocks = [
				...blocks,
				{
					id: `block_${Date.now()}_${Math.random()}`,
					date: formattedDate,
					time: timeStr,
					sum: sum,
					gender: DEFAULT_GENDER,
					myPercent: DEFAULT_MY_PERCENT,
					pay: DEFAULT_PAY
				}
			];

			timeMinutes += 20;
		}

		toastStore.show(`Сгенерировано ${numbers.length} блоков`, 'success');
		autoTextarea = '';
	}

	// ===== Переход на страницу дня =====
	function goToDay() {
		if (!lastSavedDate) return;
		goto(`${base}/day?date=${lastSavedDate}`);
	}

	// ===== Обработка ввода только цифр =====
	function handleNumberInput(e) {
		const input = e.currentTarget;
		input.value = input.value.replace(/\D/g, '');
	}

	// ===== Инициализация — один блок =====
	onMount(() => {
		addBlock();
	});
</script>

<div class="import-page">
	<header class="header">
		<button class="btn-back" onclick={() => goto(`${base}/day`)}>← Назад</button>
		<h1>Импорт заметок</h1>
	</header>

	<!-- ===== Общая дата (три поля) ===== -->
	<div class="global-date-row">
		<label>Общая дата:</label>
		<div class="date-fields">
			<input
				type="number"
				class="date-input-small"
				placeholder="День"
				bind:value={globalDay}
				min="1"
				max="31"
				oninput={handleNumberInput}
			/>
			<span class="date-sep">/</span>
			<input
				type="number"
				class="date-input-small"
				placeholder="Месяц"
				bind:value={globalMonth}
				min="1"
				max="12"
				oninput={handleNumberInput}
			/>
			<span class="date-sep">/</span>
			<input
				type="number"
				class="date-input-small"
				placeholder="Год"
				bind:value={globalYear}
				min="2020"
				max="2030"
				oninput={handleNumberInput}
			/>
		</div>
		<span class="hint">
			{formatGlobalDate() || 'введите день, месяц, год'}
		</span>
	</div>

	<!-- ===== Ручной ввод + Автоматический ввод (details) ===== -->
	<details class="auto-details">
		<summary class="auto-summary">📝 Ручной ввод</summary>
		<div class="auto-content">
			<div class="controls">
				<button class="btn-add" onclick={addBlock}>➕ Добавить</button>
				<button class="btn-clear" onclick={clearAll}>🗑️ Очистить</button>
			</div>
		</div>
	</details>

	<!-- ===== Автоматический ввод (details) ===== -->
	<details class="auto-details" open>
		<summary class="auto-summary">⚡ Автоматический ввод</summary>
		<div class="auto-content">
			<div class="auto-row">
				<label>Числа (через запятую):</label>
				<textarea
					bind:value={autoTextarea}
					placeholder="Например: 1000, 1500, 2000, 2500"
					rows="3"
					class="auto-textarea"
				></textarea>
			</div>
			<button class="btn-generate" onclick={generateFromAuto}>🚀 Сгенерировать</button>
			<p class="auto-hint">
				Блоки создадутся с датой из поля "Общая дата", время с 9:00 с шагом 20 минут
			</p>
		</div>
	</details>

	<div class="blocks-container">
		<div class="blocks">
			{#each blocks as block, index}
				<div class="block" class:even={index % 2 === 0}>
					<div class="block-header">
						<span class="block-number">#{index + 1}</span>
						<button class="btn-remove" onclick={() => removeBlock(block.id)}>✕</button>
					</div>

					<div class="block-fields">
						<div class="field-group">
							<label>Дата</label>
							<input type="date" bind:value={block.date} />
						</div>

						<div class="field-group">
							<label>Время</label>
							<input type="time" bind:value={block.time} step="900" />
						</div>

						<div class="field-group">
							<label>Сумма (sum)</label>
							<input
								type="number"
								bind:value={block.sum}
								min="1"
								step="100"
								onfocus={(e) => {
									const input = e.currentTarget;
									if (input.value === '0') input.select();
								}}
							/>
						</div>

						<div class="field-group">
							<label>Пол</label>
							<select bind:value={block.gender}>
								<option value="male">Мужской</option>
								<option value="female">Женский</option>
								<option value="male_bearded">Борода</option>
								<option value="colorist">Колорист</option>
								<option value="child">Детский</option>
							</select>
						</div>

						<div class="field-group">
							<label>% мастера</label>
							<input type="number" bind:value={block.myPercent} min="0" max="100" step="5" />
						</div>

						<div class="field-group">
							<label>Оплата</label>
							<select bind:value={block.pay}>
								<option value="cash">Наличные</option>
								<option value="card1">Карта 1</option>
								<option value="card2">Карта 2</option>
								<option value="crypto">Крипта</option>
							</select>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<footer class="footer">
		<div class="footer-buttons">
			<!-- <button class="btn-view-day" onclick={goToDay} disabled={!isSaved}>
				📅 Посмотреть день
			</button> -->
			<button class="btn-save" onclick={saveAll} disabled={isLoading}>
				{isLoading ? 'Сохранение...' : '💾 Сохранить все'}
			</button>
		</div>
	</footer>
</div>

<style>
	.import-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		max-height: 100vh;
		background: var(--clr-bg-primary, #f5f5f5);
		overflow: hidden;
	}

	.header {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px 16px;
		background: var(--clr-bg-card, #ffffff);
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	.header h1 {
		flex: 1;
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		color: var(--clr-text-primary, #1a1a1a);
	}

	.btn-back {
		padding: 6px 12px;
		border: none;
		border-radius: 8px;
		background: var(--clr-bg-primary, #f0f0f0);
		cursor: pointer;
		font-size: 14px;
	}

	/* ===== Общая дата ===== */
	.global-date-row {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 16px;
		background: var(--clr-bg-card, #ffffff);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		flex-wrap: wrap;
	}

	.global-date-row label {
		font-weight: 600;
		font-size: 14px;
		color: var(--clr-text-primary, #1a1a1a);
	}

	.date-fields {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.date-input-small {
		width: 50px;
		padding: 6px 6px;
		border: 1px solid var(--clr-border, #ddd);
		border-radius: 6px;
		font-size: 14px;
		text-align: center;
	}

	.date-input-small:focus {
		outline: none;
		border-color: var(--clr-teal, #0d9488);
	}

	.date-sep {
		font-size: 16px;
		font-weight: 600;
		color: var(--clr-text-secondary, #666);
		padding: 0 2px;
	}

	.global-date-row .hint {
		font-size: 13px;
		color: var(--clr-text-secondary, #888);
	}

	/* ===== Details ===== */
	.auto-details {
		flex-shrink: 0;
		background: var(--clr-bg-card, #ffffff);
		border-top: 1px solid rgba(0, 0, 0, 0.06);
		padding: 8px 16px;
	}

	.auto-summary {
		font-weight: 600;
		font-size: 14px;
		cursor: pointer;
		color: var(--clr-text-primary, #1a1a1a);
		padding: 4px 0;
	}

	.auto-content {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 8px 0 12px 0;
	}

	/* ===== Управление ===== */
	.controls {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}

	.btn-add {
		padding: 8px 16px;
		border: none;
		border-radius: 8px;
		background: var(--clr-teal, #0d9488);
		color: white;
		cursor: pointer;
		font-weight: 600;
	}

	.btn-clear {
		padding: 8px 16px;
		border: none;
		border-radius: 8px;
		background: var(--clr-bg-primary, #f0f0f0);
		cursor: pointer;
		font-weight: 600;
	}

	/* ===== Блоки ===== */
	.blocks-container {
		max-height: 300px;
		overflow-y: auto;
	}

	.blocks {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 8px 0;
	}

	.block {
		background: var(--clr-bg-card, #ffffff);
		border-radius: 12px;
		padding: 12px 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		border: 1px solid var(--clr-border, #eee);
	}

	.block.even {
		background: var(--clr-bg-secondary, #fafafa);
	}

	.block-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	.block-number {
		font-weight: 600;
		font-size: 14px;
		color: var(--clr-text-secondary, #666);
	}

	.btn-remove {
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 50%;
		background: var(--clr-error, #e74c3c);
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
	}

	.block-fields {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 8px;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.field-group label {
		font-size: 11px;
		font-weight: 600;
		color: var(--clr-text-secondary, #666);
		text-transform: uppercase;
	}

	.field-group input,
	.field-group select {
		padding: 6px 8px;
		border: 1px solid var(--clr-border, #ddd);
		border-radius: 6px;
		font-size: 14px;
		background: var(--clr-bg-primary, #fff);
	}

	.field-group input:focus,
	.field-group select:focus {
		outline: none;
		border-color: var(--clr-teal, #0d9488);
	}

	/* ===== Автоматический ввод ===== */
	.auto-row {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.auto-row label {
		font-size: 14px;
		font-weight: 500;
		color: var(--clr-text-primary, #1a1a1a);
		min-width: 80px;
	}

	.auto-textarea {
		flex: 1;
		min-width: 200px;
		padding: 8px 10px;
		border: 1px solid var(--clr-border, #ddd);
		border-radius: 8px;
		font-size: 14px;
		resize: vertical;
		font-family: inherit;
	}

	.auto-textarea:focus {
		outline: none;
		border-color: var(--clr-teal, #0d9488);
	}

	.btn-generate {
		padding: 8px 20px;
		border: none;
		border-radius: 8px;
		background: var(--clr-warning, #f59e0b);
		color: white;
		cursor: pointer;
		font-weight: 600;
		align-self: flex-start;
	}

	.btn-generate:hover {
		background: var(--clr-warning-dark, #d97706);
	}

	.auto-hint {
		font-size: 12px;
		color: var(--clr-text-secondary, #888);
		margin: 0;
	}

	/* ===== Футер ===== */
	.footer {
		flex-shrink: 0;
		padding: 12px 16px;
		background: var(--clr-bg-card, #ffffff);
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		margin-top: auto;
	}

	.footer-buttons {
		display: flex;
		gap: 12px;
	}

	.btn-save {
		flex: 1;
		padding: 12px;
		border: none;
		border-radius: 10px;
		background: var(--clr-teal, #0d9488);
		color: white;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-save:hover:not(:disabled) {
		background: var(--clr-teal-dark, #0f766e);
	}

	.btn-save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-view-day {
		padding: 12px 20px;
		border: none;
		border-radius: 10px;
		background: var(--clr-info, #3b82f6);
		color: white;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
		white-space: nowrap;
	}

	.btn-view-day:hover:not(:disabled) {
		background: var(--clr-info-dark, #2563eb);
	}

	.btn-view-day:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* ===== Адаптив ===== */
	@media (max-width: 600px) {
		.date-input-small {
			width: 40px;
			font-size: 13px;
		}

		.footer-buttons {
			flex-direction: column;
		}

		.btn-view-day {
			width: 100%;
		}

		.block-fields {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
