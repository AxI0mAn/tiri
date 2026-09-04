<!-- src/routes/(date)/allNotes/components/FilterBar.svelte -->
<script>
	import { getTodayDate, getDateOffset } from '$lib/utils/dateHelpers.js';

	let { filters, onFilterChange } = $props();

	const today = getTodayDate();
	const monthAgo = getDateOffset(today, -30);

	// ✅ Инициализируем из пропа или дефолта
	let dateFrom = $state(filters?.dateFrom || monthAgo);
	let dateTo = $state(filters?.dateTo || today);
	let search = $state(filters?.search || '');

	// ✅ Функция обновления фильтров (вызывается только по действиям пользователя)
	function updateFilters() {
		onFilterChange({
			dateFrom,
			dateTo,
			search
		});
	}

	// ✅ Синхронизация с пропом (если фильтры меняются извне)
	$effect(() => {
		if (filters) {
			dateFrom = filters.dateFrom || monthAgo;
			dateTo = filters.dateTo || today;
			search = filters.search || '';
		}
	});

	function clearFilters() {
		dateFrom = monthAgo;
		dateTo = today;
		search = '';
		// ✅ После очистки сразу обновляем
		updateFilters();
	}

	// ✅ Обработчики изменений инпутов
	function handleDateFromChange(e) {
		dateFrom = e.target.value;
		updateFilters();
	}

	function handleDateToChange(e) {
		dateTo = e.target.value;
		updateFilters();
	}

	function handleSearchChange(e) {
		search = e.target.value;
		updateFilters();
	}
</script>

<div class="filter-bar">
	<div class="filter-group">
		<label>
			<span class="label-icon">📅</span>
			<span>с</span>
			<input type="date" bind:value={dateFrom} max={today} class="filter-input" />
		</label>
		<label>
			<span>по</span>
			<input type="date" bind:value={dateTo} max={today} class="filter-input" />
		</label>
	</div>

	<div class="filter-group search-group">
		<span class="search-icon">🔍</span>
		<input
			type="text"
			bind:value={search}
			placeholder="Поиск по имени или телефону..."
			class="search-input"
		/>
		{#if search}
			<button class="clear-btn" onclick={clearFilters} aria-label="Очистить поиск"> ✕ </button>
		{/if}
	</div>

	<div class="filter-info">
		{#if dateFrom || dateTo}
			<span class="filter-badge">
				📅 {dateFrom || '...'} — {dateTo || '...'}
			</span>
		{/if}
		{#if search}
			<span class="filter-badge">
				🔍 {search}
			</span>
		{/if}
		{#if dateFrom || dateTo || search}
			<button class="clear-all-btn" onclick={clearFilters}> ✕ Очистить всё </button>
		{/if}
	</div>
</div>

<style>
	.filter-bar {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px 20px;
		background: var(--clr-bg-card, #ffffff);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		position: sticky;
		top: 0;
		z-index: 10;
		backdrop-filter: blur(8px);
		background: rgba(255, 255, 255, 0.95);
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.filter-group label {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 14px;
		color: var(--clr-text-secondary, #666);
	}

	.filter-input {
		padding: 6px 10px;
		border: 1px solid var(--clr-border, #ddd);
		border-radius: 8px;
		font-size: 14px;
		background: var(--clr-bg-primary, #f5f5f5);
		transition: border-color 0.2s;
		max-width: 160px;
	}

	.filter-input:focus {
		outline: none;
		border-color: var(--clr-teal, #0d9488);
	}

	.search-group {
		flex: 1;
		position: relative;
	}

	.search-icon {
		font-size: 18px;
		color: var(--clr-text-secondary, #999);
	}

	.search-input {
		flex: 1;
		padding: 8px 12px;
		padding-right: 36px;
		border: 1px solid var(--clr-border, #ddd);
		border-radius: 8px;
		font-size: 14px;
		background: var(--clr-bg-primary, #f5f5f5);
		transition: border-color 0.2s;
		min-width: 100px;
		width: 100%;
		max-width: 20rem;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--clr-teal, #0d9488);
	}

	.clear-btn {
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: var(--clr-text-secondary, #999);
		font-size: 16px;
		cursor: pointer;
		padding: 4px 8px;
	}

	.clear-btn:hover {
		color: var(--clr-text-primary, #333);
	}

	.filter-info {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		margin-top: 4px;
	}

	.filter-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 10px;
		background: var(--clr-teal-soft, #e6f5f0);
		border-radius: 12px;
		font-size: 12px;
		color: var(--clr-teal, #0d9488);
	}

	.clear-all-btn {
		background: none;
		border: none;
		color: var(--clr-error, #e74c3c);
		font-size: 13px;
		cursor: pointer;
		padding: 4px 8px;
	}

	.clear-all-btn:hover {
		text-decoration: underline;
	}

	.label-icon {
		font-size: 16px;
	}

	/* Адаптив */
	@media (max-width: 600px) {
		.filter-bar {
			padding: 12px 16px;
			gap: 8px;
		}

		.filter-group {
			gap: 4px;
		}

		.filter-input {
			max-width: 120px;
			font-size: 13px;
			padding: 4px 8px;
		}

		.search-input {
			font-size: 13px;
			padding: 6px 10px;
		}
	}
</style>
