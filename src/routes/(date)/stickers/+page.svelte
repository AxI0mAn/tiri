<!-- src/routes/(date)/allNotes/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import BtnBack from '$lib/components/Btn/BtnBack.svelte';
	import FilterBar from '$lib/components/aBlock/sticker/FilterBar.svelte';
	import StickerGrid from '$lib/components/aBlock/sticker/StickerGrid.svelte';
	import { loadAllStickers, filterStickers } from '$lib/store/stickersStore.svelte';
	import { getTodayDate } from '$lib/utils/dateHelpers.js';

	// Состояние
	let allStickers = $state([]);
	let filteredStickers = $state([]);
	let isLoading = $state(true);
	let expandedId = $state(null);
	let isExpanded = $state(false);

	// Фильтры
	let filters = $state({
		dateFrom: '',
		dateTo: getTodayDate(),
		search: ''
	});

	// Обработчик изменения фильтров
	function handleFilterChange(newFilters) {
		filters = newFilters;
		applyFilters();
	}

	// Применение фильтров с анимацией
	function applyFilters() {
		filteredStickers = filterStickers(allStickers, filters);
	}

	// Обработчик клика по стикеру (для увеличения/уменьшения)
	function handleStickerClick(id) {
		if (expandedId === id) {
			expandedId = null;
			isExpanded = false;
		} else {
			expandedId = id;
			isExpanded = true;
		}
	}

	// Обработчик клика вне стикера (закрыть увеличенный)
	function handleBackdropClick() {
		if (expandedId) {
			expandedId = null;
			isExpanded = false;
		}
	}

	// Загрузка данных
	onMount(() => {
		async function loadData() {
			isLoading = true;
			try {
				allStickers = await loadAllStickers();
				console.log('[AllNotes] Загружено:', allStickers.length);
				applyFilters();
			} catch (error) {
				console.error('[AllNotes] Ошибка загрузки:', error);
				allStickers = [];
				filteredStickers = [];
			} finally {
				isLoading = false;
			}
		}

		loadData();

		const handler = () => {
			loadAllStickers().then((stickers) => {
				allStickers = stickers;
				applyFilters();
			});
		};
		window.addEventListener('db:entry_saved', handler);
		return () => window.removeEventListener('db:entry_saved', handler);
	});
</script>

<div class="all-notes-page">
	<header class="header">
		<BtnBack />
		<h1>📝 Блокнот заметок</h1>
		<span class="counter">Всего {filteredStickers.length} шт.</span>
	</header>

	<FilterBar {filters} onFilterChange={handleFilterChange} />

	{#if isLoading}
		<div class="loading">Загрузка стикеров...</div>
	{:else}
		<StickerGrid stickers={filteredStickers} {expandedId} />
	{/if}

	{#if isExpanded}
		<div
			class="backdrop"
			role="button"
			tabindex="0"
			onclick={handleBackdropClick}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					handleBackdropClick();
				}
			}}
			transition:fade={{ duration: 200 }}
		></div>
	{/if}
</div>

<style>
	.all-notes-page {
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
		justify-content: flex-start;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		background: var(--clr-bg-card, #ffffff);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		min-height: 56px;
	}

	.header h1 {
		flex: 1;
		margin: 0;
		font-size: 20px;
		font-weight: 600;
		color: var(--clr-text-primary, #1a1a1a);
	}

	.counter {
		font-size: 14px;
		color: var(--clr-text-secondary, #666);
		background: var(--clr-bg-primary, #f5f5f5);
		padding: 4px 12px;
		border-radius: 12px;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--clr-text-secondary, #999);
		font-size: 16px;
	}

	.backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(4px);
		z-index: 99;
	}

	/* Адаптив */
	@media (max-width: 768px) {
		.header h1 {
			font-size: 17px;
		}

		.counter {
			font-size: 12px;
			padding: 2px 10px;
		}
	}
</style>
