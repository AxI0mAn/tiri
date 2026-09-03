<!-- src/lib/components/Cards/ShowCard.svelte -->

<script>
	// @ts-ignore
	import { base } from '$app/paths';
	// @ts-ignore
	import { goto } from '$app/navigation'; // Импортируем нормально наверх
	import { onMount } from 'svelte';

	import BtnImg from '$lib/components/Btn/BtnImg.svelte';
	import { formatTime } from '$lib/utils/dateHelpers.js';
	import { appState } from '$lib/store/appState.svelte.js';
	import { constructorStore } from '$lib/store/ConstructorStore.svelte.js';
	import { canEditEntry } from '$lib/components/services/reportGuard';

	let { entry } = $props();

	const isNote = entry.type === 'note' || entry.types === 'note';
	const isReminder = entry.type === 'reminder' || entry.types === 'reminder';

	let canEdit = $state(true);

	onMount(async () => {
		canEdit = await canEditEntry(entry, entry.dateStr);
	});

	function getTime() {
		if (isReminder && entry.value?.remind?.time) {
			return entry.value.remind.time; // строка "14:30"
		}
		return formatTime(entry.timestamp);
	}

	// Получаем иконку гендера из конструктора
	function getGenderIcon() {
		const gender = entry.value?.gender;
		if (!gender) return null;

		const genderField = constructorStore.schema?.gender;
		if (!genderField) return null;

		const option = genderField.options?.[gender];
		if (!option) return null;

		return {
			src: option.iconWebp || option.iconPng || '',
			alt: option.label || gender,
			class: option.optionClass || ''
		};
	}

	// Получаем иконку оплаты из конструктора
	function getPayIcon() {
		const pay = entry.value?.pay;
		if (!pay) return null;

		const payField = constructorStore.schema?.pay;
		if (!payField) return null;

		const option = payField.options?.[pay];
		if (!option) return null;

		return {
			src: option.iconWebp || option.iconPng || '',
			alt: option.label || pay,
			class: option.optionClass || ''
		};
	}

	function handleEdit() {
		if (!canEdit) return;
		appState.editEntryId = entry.id;
		appState.editEntryDate = entry.dateStr;
		goto(`${base}/edit`);
	}

	const sum = entry.value?.percent?.sum || 0;
	const perc = entry.value?.percent?.myPercent;

	// === -📝=TODO=📝- === 3е сентября
	import { deleteEntry } from '$lib/utils/db.js';
	import { toastStore } from '$lib/store/toastStore.svelte.js';

	async function handleDelete() {
		if (confirm(`Удалить запись ${entry.id}?`)) {
			try {
				await deleteEntry(entry.id);
				toastStore.show('Запись удалена', 'success');
				// Обновить список
				if (typeof window !== 'undefined') {
					window.dispatchEvent(
						new CustomEvent('db:entry_saved', {
							detail: { ...entry, _deleted: true }
						})
					);
				}
			} catch (error) {
				toastStore.show('Ошибка удаления', 'error');
			}
		}
	}
	// === -📝=TODO=📝- === 3е сентября
</script>

<div
	class="show-card"
	class:is-note={isNote}
	class:is-reminder={isReminder}
	class:is-allMy={perc === 100}
>
	<div class="cardInfo">
		<span class="time">{getTime()}</span>

		{#if getGenderIcon()}
			<BtnImg
				src={getGenderIcon().src}
				alt={getGenderIcon().alt || 'Пол'}
				size={44}
				customClass="iconCard {getGenderIcon().class || ''}"
				onclick={() => {}}
			/>
		{/if}
		{#if isNote && getPayIcon()}
			<BtnImg
				src={getPayIcon().src}
				alt={getPayIcon().alt || 'Оплата'}
				size={44}
				customClass="iconCard {getPayIcon().class || ''}"
				onclick={() => {}}
			/>
		{/if}

		<span class="sum">{sum}</span>
	</div>
	{#if canEdit}
		<button class="edit-btn" onclick={handleEdit} aria-label="Редактировать">
			<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor">
				<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-width="2" />
				<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-width="2" />
			</svg>
		</button>
	{/if}
	<!-- TODO нужно ли ??????????? -->
	<!-- <button class="delete-btn" onclick={handleDelete} aria-label="Удалить"> 🗑️ </button>  -->
</div>

<style lang="scss">
	@use '../../../../styles/_variables.scss' as *;

	.show-card {
		display: flex;
		flex-flow: row nowrap;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		max-height: 10vh;
		min-height: 56px;
		padding: 8px 12px;
		border-radius: 10px;
		background: $clr-bg-card;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.show-card.is-note {
		background: $clr-teal-soft;
	}

	.show-card.is-reminder {
		background: $clr-pink;
	}

	.show-card.is-allMy {
		background: transparent;
	}

	.cardInfo {
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
		gap: 1vw;
	}

	.time {
		font-size: 14px;
		font-weight: 500;
		color: var(--clr-text-secondary, #555);
		min-width: 50px;
		flex-shrink: 0;
	}

	.sum {
		font-size: 16px;
		font-weight: 600;
		color: var(--clr-text-primary, #1a1a1a);
		flex: 1;
		min-width: 40px;
	}

	.edit-btn {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.05);
		color: var(--clr-text-secondary, #666);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.edit-btn:hover {
		background: rgba(0, 0, 0, 0.1);
		color: var(--clr-text-primary, #1a1a1a);
	}

	.edit-btn:active {
		transform: scale(0.92);
	}

	/* Стили для BtnImg внутри карточки */
	:global(.iconCard) {
		flex-shrink: 0;
	}
</style>
