<!-- src/routes/(date)/allNotes/components/StickerGrid.svelte -->
<script>
	import { fade } from 'svelte/transition';
	import Sticker from './Sticker.svelte';

	let { stickers = [], expandedId = null } = $props();

	function isExpanded(id) {
		return expandedId === id;
	}
</script>

<div class="sticker-grid">
	{#each stickers as sticker (sticker.id)}
		<Sticker {sticker} isExpanded={isExpanded(sticker.id)} />
	{/each}

	{#if stickers.length === 0}
		<div class="empty-state">
			<span class="empty-icon">📭</span>
			<p>Нет стикеров с заметками</p>
			<span class="empty-hint">Добавьте текст в поле "Заметки" при создании записи</span>
		</div>
	{/if}
</div>

<style>
	.sticker-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
		justify-content: center;
		padding: 20px;
		min-height: 400px;
		align-content: flex-start;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: 60px 20px;
		color: #999;
	}

	.empty-icon {
		font-size: 64px;
		margin-bottom: 16px;
	}

	.empty-state p {
		font-size: 18px;
		margin-bottom: 8px;
	}

	.empty-hint {
		font-size: 14px;
		color: #bbb;
	}

	/* Адаптив */
	@media (max-width: 768px) {
		.sticker-grid {
			gap: 16px;
			padding: 12px;
		}
	}
</style>
