<!-- src/routes/(form)/edit/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	// @ts-ignore
	import { goto } from '$app/navigation';
	// @ts-ignore
	import { base } from '$app/paths';
	import BtnBack from '$lib/components/Btn/BtnBack.svelte';
	import BtnText from '$lib/components/Btn/BtnText.svelte';
	import RenderForm from '$lib/components/aPage/RenderForm.svelte';
	import ModalConfirm from '$lib/components/aBlock/modal/ModalConfirm.svelte';
	import { appState } from '$lib/store/appState.svelte.js';
	import { toastStore } from '$lib/store/toastStore.svelte.js';
	import { saveEntry, deleteEntry } from '$lib/utils/db.js';
	import { createLocalTimestamp, formatDateISOLocal } from '$lib/utils/dateHelpers.js';

	// Состояние
	let entry = $state(null);
	let updatedEntry = $state(null);
	let isLoading = $state(true);
	let error = $state(null);
	let isReminder = $state(false);
	let isNote = $state(false);
	let constructorStore = $state(null);
	let formRef = $state(null);
	let showConfirmModal = $state(false);

	// Загрузка записи
	async function loadEntry() {
		isLoading = true;
		error = null;

		try {
			//  Берем id ТОЛЬКО из appState
			const entryId = appState.editEntryId;
			if (!entryId) {
				error = 'ID записи не указан';
				return;
			}

			const dateStr = appState.editEntryDate;
			if (!dateStr) {
				error = 'Дата записи не указана';
				return;
			}

			// === -📝=TODO=📝- ===
			console.log('[loadEntry] appState.editEntryId:', appState.editEntryId);
			console.log('[loadEntry] appState.editEntryDate:', appState.editEntryDate);

			const { getAllThisDayRecords } = await import('$lib/utils/db.js');
			const records = await getAllThisDayRecords(dateStr);
			const foundEntry = records.find((record) => record.id === entryId);

			if (!foundEntry) {
				error = 'Запись не найдена';
				return;
			}

			entry = foundEntry;
			isReminder = foundEntry.types === 'reminder' || foundEntry.type === 'reminder';
			isNote = foundEntry.types === 'note' || foundEntry.type === 'note';

			if (isNote) {
				const { constructorStore: noteStore } =
					await import('$lib/store/ConstructorStore.svelte.js');
				constructorStore = noteStore;
			} else if (isReminder) {
				const { constructorReminder } = await import('$lib/store/ConstructorStore.svelte.js');
				constructorStore = constructorReminder;
			}
		} catch (err) {
			console.error('[edit] Ошибка загрузки:', err);
			error = 'Не удалось загрузить запись';
		} finally {
			isLoading = false;
		}
	}

	// Колбэк из RenderForm
	function handleFormUpdate(draft) {
		console.log('[handleFormUpdate] draft:', draft);

		updatedEntry = {
			id: entry.id,
			timestamp: draft.timestamp,
			types: draft.types || draft.type,
			type: draft.types || draft.type,
			dateStr: entry.dateStr,
			yearMonth: entry.yearMonth,
			year: entry.year,
			dateCreate: entry.dateCreate,
			value: JSON.parse(JSON.stringify(draft.value))
		};

		console.log('[handleFormUpdate] updatedEntry:', updatedEntry);
	}

	// Сохранение (для заметок)
	async function handleSave() {
		if (!entry) return;

		try {
			const entryValue = JSON.parse(JSON.stringify(entry.value || {}));

			//  Гарантируем уникальность ID
			const newId = `${entry.types || entry.type}_${Date.now()}`;

			const newEntry = {
				...entry,
				id: newId,
				value: entryValue
			};

			//  Сначала сохраняем, потом удаляем
			await saveEntry(newEntry);
			await deleteEntry(entry.id);

			toastStore.show('Запись сохранена', 'success');

			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('db:entry_saved', {
						detail: newEntry
					})
				);
			}

			goBack();
		} catch (err) {
			console.error('[edit] Ошибка сохранения:', err);
			toastStore.show('Ошибка при сохранении', 'error');
		}
	}

	// Перенести (для напоминаний)
	async function handleReschedule() {
		if (!entry || !isReminder) return;

		if (!entry.value?.remind?.date || !entry.value?.remind?.time) {
			toastStore.show('Заполните дату и время в поле "Напоминание"', 'error');
			return;
		}

		try {
			const entryValue = JSON.parse(JSON.stringify(entry.value || {}));
			const { date, time } = entryValue.remind;
			const [year, month, day] = date.split('-').map(Number);
			const [hours, minutes] = time.split(':').map(Number);

			//  Создаем timestamp в ЛОКАЛЬНОМ времени
			const newTimestamp = createLocalTimestamp(date, time);

			const newEntry = {
				...entry,
				id: `reminder_${newTimestamp}`,
				timestamp: newTimestamp,
				dateStr: date,
				yearMonth: date.slice(0, 7),
				year: year,
				dateCreate: new Date().toISOString().split('T')[0],
				value: entryValue
			};

			//  Сначала сохраняем, потом удаляем
			await saveEntry(newEntry);
			await deleteEntry(entry.id);

			toastStore.show(`Напоминание перенесено на ${date} ${time}`, 'success');

			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('db:entry_saved', {
						detail: newEntry
					})
				);
			}

			goBack();
		} catch (err) {
			console.error('[edit] Ошибка переноса:', err);
			toastStore.show('Ошибка при переносе', 'error');
		}
	}

	// Выполнено (reminder → note)
	async function handleComplete() {
		if (!entry || !isReminder) return;

		try {
			const { saveEntry, deleteEntry } = await import('$lib/utils/db.js');

			const entryValue = JSON.parse(JSON.stringify(entry.value || {}));

			const now = Date.now();
			const today = new Date(now).toISOString().split('T')[0];

			const newId = `note_${now}`;

			// ✅ Получаем дефолтные значения из конструктора
			let defaultSum = 0;
			let defaultMyPercent = 0;
			let defaultTips = 0;

			try {
				const constructorData = localStorage.getItem('card_constructor_notes_v1');
				if (constructorData) {
					const schema = JSON.parse(constructorData);

					// Получаем значения num из percent.options
					if (schema.percent?.options) {
						const options = schema.percent.options;
						defaultSum = options.sum?.num ?? 0;
						defaultMyPercent = options.myPercent?.num ?? 0;
						defaultTips = options.tips?.num ?? 0;
					}
				}
			} catch (e) {
				console.warn('[handleComplete] Ошибка чтения конструктора:', e);
			}

			const newEntry = {
				id: `note_${now}`,
				types: 'note',
				type: 'note',
				timestamp: now,
				dateStr: today,
				yearMonth: today.slice(0, 7),
				year: new Date(now).getFullYear(),
				dateCreate: today,
				value: {
					gender: entryValue.gender || 'male',
					notes: entryValue.notes || { name: '', phone: '', text: '' },
					percent: {
						sum: defaultSum,
						myPercent: defaultMyPercent,
						tips: defaultTips
					},
					pay: null
				}
			};

			//  1.1. Сохраняем новую заметку
			await saveEntry(newEntry);

			//  2. Удаляем старое напоминание
			await deleteEntry(entry.id);

			toastStore.show('Напоминание выполнено → заполните поля заметки', 'success');

			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('db:entry_saved', {
						detail: newEntry
					})
				);
			}

			// ✅ 3. Обновляем appState для перехода на страницу дня
			appState.now_mode = 'tiri';
			appState.now_date = today;

			// 4.1. Устанавливаем режим до перехода
			appState.now_mode = 'edit';
			appState.editEntryId = newEntry.id;
			appState.editEntryDate = newEntry.dateStr;

			// 4.2. Переходим на страницу дня
			goto(`${base}/day`);

			// 4.3. Через 200ms (после fade-out) переходим на редактирование
			setTimeout(() => {
				goto(`${base}/edit`);
			}, 50);

			// ✅ 5. После перехода открываем заметку для редактирования
			// Используем setTimeout, чтобы дождаться перехода
			setTimeout(() => {
				appState.editEntryId = newEntry.id;
				appState.editEntryDate = newEntry.dateStr;
				goto(`${base}/edit`);
			}, 100);
		} catch (err) {
			console.error('[edit] Ошибка выполнения:', err);
			toastStore.show('Ошибка при выполнении', 'error');
		}
	}

	// Удаление
	async function handleDelete() {
		if (!entry) return;

		try {
			//  Используем deleteEntry из db.js
			await deleteEntry(entry.id);

			toastStore.show('Запись удалена', 'success');

			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('db:entry_saved', {
						detail: { ...entry, _deleted: true }
					})
				);
			}

			goBack();
		} catch (err) {
			console.error('[edit] Ошибка удаления:', err);
			toastStore.show('Ошибка при удалении', 'error');
		}
	}

	function openDeleteConfirm() {
		showConfirmModal = true;
	}

	function goBack() {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			window.history.back();
		} else {
			goto(`${base}/day`);
		}
	}

	onMount(() => {
		loadEntry();
	});
</script>

<div class="edit-page">
	<header class="header">
		<BtnBack />
		<h1 class="header-title">Редактирование</h1>
	</header>

	<main class="content">
		{#if isLoading}
			<div class="loading">Загрузка...</div>
		{:else if error}
			<div class="error">{error}</div>
		{:else if entry && constructorStore}
			<RenderForm
				{constructorStore}
				type={entry.type || entry.types}
				bind:entry
				hideActions={true}
			/>

			<footer class="form-actions">
				{#if isNote}
					<BtnText buttonText="Удалить" onclick={openDeleteConfirm} customClass="btn-delete" />
					<BtnText buttonText="Сохранить" onclick={handleSave} customClass="btn-save" />
				{:else if isReminder}
					<BtnText buttonText="Удалить" onclick={openDeleteConfirm} customClass="btn-delete" />
					<BtnText buttonText="Выполнено" onclick={handleComplete} customClass="btn-complete" />
					<BtnText buttonText="Перенести" onclick={handleReschedule} customClass="btn-reschedule" />
				{/if}
			</footer>
		{/if}
	</main>
</div>

<!-- Модалка подтверждения удаления -->
<ModalConfirm
	isOpen={showConfirmModal}
	title="Удаление записи"
	message="Вы уверены, что хотите удалить эту запись?"
	onConfirm={handleDelete}
	onCancel={() => {
		showConfirmModal = false;
	}}
/>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.edit-page {
		display: flex;
		flex-direction: column;
		background: rgba($clr-bg-rgb, 0.8);
	}
	.edit-page.is-note {
		background: rgba($clr-teal-rgb, 0.6);
	}
	.edit-page.is-reminder {
		background: rgba($clr-pink-rgb, 0.6);
	}

	.header {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		padding: 8px 16px;
		background: $clr-pink;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		min-height: 56px;
	}

	.header-title {
		flex: 1;
		text-align: center;
		font-size: 18px;
		font-weight: 600;
		color: var(--clr-text-primary, #1a1a1a);
		margin: 0;
	}

	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		padding: 16px;
		gap: 16px;
	}

	.loading,
	.error {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--clr-text-secondary, #999);
		font-size: 14px;
	}

	.error {
		color: var(--clr-error, #e74c3c);
	}

	/* Кнопки действий */
	.form-actions {
		flex-shrink: 0;
		display: flex;
		gap: 10px;
		padding: 12px 0;
		flex-wrap: wrap;
		justify-content: center;
	}

	.form-actions :global(.btn-delete) {
		background: var(--clr-error, #e74c3c) !important;
		color: white !important;
	}

	.form-actions :global(.btn-save) {
		background: var(--clr-teal, #0d9488) !important;
		color: white !important;
	}

	.form-actions :global(.btn-complete) {
		background: var(--clr-success, #22c55e) !important;
		color: white !important;
	}

	.form-actions :global(.btn-reschedule) {
		background: var(--clr-warning, #f59e0b) !important;
		color: white !important;
	}
</style>
