<!-- src/routes/(home)/admin/+page.svelte -->
<script>
	// массовое добавление заметок за прошлый период

	import { onMount } from 'svelte';
	// @ts-ignore
	import { goto } from '$app/navigation';
	// @ts-ignore
	import { base } from '$app/paths';
	import { toastStore } from '$lib/store/toastStore.svelte.js';
	import { saveEntry, getAllThisDayRecords } from '$lib/utils/db.js';
	import { getTodayDate } from '$lib/utils/dateHelpers.js';

	// Состояние блоков
	let blocks = $state([]);
	let isLoading = $state(false);
	let today = getTodayDate();

	// Дефолтные значения
	const DEFAULT_GENDER = 'male';
	const DEFAULT_MY_PERCENT = 50;
	const DEFAULT_PAY = 'cash';
	const DEFAULT_YEAR = 2026;
	const DEFAULT_YEAR_MONTH = '2026-09';

	// Добавить новый блок
	function addBlock() {
		const now = Date.now();
		blocks = [
			...blocks,
			{
				id: `block_${now}`,
				date: DEFAULT_YEAR_MONTH,
				time: '09:00',
				sum: 0,
				gender: DEFAULT_GENDER,
				myPercent: DEFAULT_MY_PERCENT,
				pay: DEFAULT_PAY
			}
		];
	}

	// Удалить блок
	function removeBlock(id) {
		if (blocks.length <= 1) {
			toastStore.show('Должен быть хотя бы один блок', 'warning');
			return;
		}
		blocks = blocks.filter((block) => block.id !== id);
	}

	// Очистить все блоки (кроме одного)
	function clearAll() {
		if (blocks.length === 0) {
			addBlock();
			return;
		}

		const firstBlock = blocks[0];
		blocks = [
			{
				...firstBlock,
				id: `block_${Date.now()}`,
				date: DEFAULT_YEAR_MONTH,
				time: '09:00',
				sum: 0
			}
		];
		toastStore.show('Все блоки очищены', 'info');
	}

	// Сохранить все заметки
	async function saveAll() {
		if (blocks.length === 0) {
			toastStore.show('Нет данных для сохранения', 'warning');
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
					// Формируем timestamp из даты и времени
					const [year, month, day] = block.date.split('-').map(Number);
					const [hours, minutes] = block.time.split(':').map(Number);
					const timestamp = new Date(year, month - 1, day, hours, minutes).getTime();

					// Формируем заметку
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
			}
		} catch (err) {
			console.error('[Import] Ошибка:', err);
			toastStore.show('Ошибка при сохранении', 'error');
		} finally {
			isLoading = false;
		}
	}

	// Инициализация — один блок
	onMount(() => {
		addBlock();
	});
</script>

<div class="import-page">
	<header class="header">
		<button class="btn-back" onclick={() => goto(`${base}/day`)}>← Назад</button>
		<h1>Импорт заметок</h1>
	</header>

	<div class="controls">
		<button class="btn-add" onclick={addBlock}>➕ Добавить</button>
		<button class="btn-clear" onclick={clearAll}>🗑️ Очистить</button>
	</div>

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
						<input type="number" bind:value={block.sum} min="1" step="100" />
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

	<footer class="footer">
		<button class="btn-save" onclick={saveAll} disabled={isLoading}>
			{isLoading ? 'Сохранение...' : '💾 Сохранить все'}
		</button>
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

	.controls {
		flex-shrink: 0;
		display: flex;
		gap: 8px;
		padding: 8px 16px;
		background: var(--clr-bg-card, #ffffff);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
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

	.blocks {
		flex: 1;
		overflow-y: auto;
		padding: 12px 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.block {
		background: var(--clr-bg-card, #ffffff);
		border-radius: 12px;
		padding: 12px 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
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

	.footer {
		flex-shrink: 0;
		padding: 12px 16px;
		background: var(--clr-bg-card, #ffffff);
		border-top: 1px solid rgba(0, 0, 0, 0.08);
	}

	.btn-save {
		width: 100%;
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
</style>
