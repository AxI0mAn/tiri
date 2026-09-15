<!-- src/routes/(date)/recipes/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	// @ts-ignore
	import { base } from '$app/paths';

	import HomeHeader from '$lib/components/aBlock/header/homeHeader.svelte';
	import AdvertisementGor from '$lib/components/advertisement/advertisementGor.svelte';
	import BtnImg from '$lib/components/Btn/BtnImg.svelte';
	import AccordionDetails from '$lib/components/aBlock/AccordionDetails.svelte';
	import ModalConfirm from '$lib/components/aBlock/modal/ModalConfirm.svelte';

	import { toastStore } from '$lib/store/toastStore.svelte.js';
	import { getAllRecipes, saveService, deleteService } from '$lib/utils/db.js';
	import { shareRecipe } from '$lib/components/services/recipeService.js';

	import imgAdd from '$lib/assets/iconPic/128/add.webp';

	// ===== СОСТОЯНИЕ =====
	let recipes = $state([]);
	let isLoading = $state(true);

	// Редактирование: id записи, которая сейчас редактируется
	let editingId = $state(null);
	let editingTitle = $state('');
	let editingMessage = $state('');

	// Модалка подтверждения удаления
	let showDeleteModal = $state(false);
	let deleteTargetId = $state(null);

	// ===== ЗАГРУЗКА =====
	async function loadRecipes() {
		isLoading = true;
		try {
			recipes = await getAllRecipes();
			console.log(`[recipes] Загружено рецептов: ${recipes.length}`);
		} catch (error) {
			console.error('[recipes] Ошибка загрузки:', error);
			recipes = [];
		} finally {
			isLoading = false;
		}
	}

	// ===== СОЗДАНИЕ НОВОГО =====
	async function createNewRecipe() {
		const now = Date.now();
		const today = new Date().toISOString().slice(0, 10);

		const newRecipe = {
			id: `recipe_${now}`,
			type: 'recipe',
			types: 'recipe',
			timestamp: now,
			dateCreate: today,
			dateStr: today,
			year: new Date().getFullYear(),
			yearMonth: today.slice(0, 7),
			value: {
				title: '',
				message: ''
			}
		};

		// ✅ Сразу ставим в начало списка и открываем на редактирование
		recipes = [newRecipe, ...recipes];
		editingId = newRecipe.id;
		editingTitle = '';
		editingMessage = '';
	}

	// ===== СОХРАНЕНИЕ РЕДАКТИРОВАНИЯ =====
	async function saveEdit(recipe) {
		const today = new Date().toISOString().slice(0, 10);

		// Валидация
		if (!editingTitle.trim()) {
			toastStore.show('Введите заголовок рецепта', 'warning');
			return;
		}

		const updated = {
			...recipe,
			dateStr: today, // ✅ Дата изменения
			yearMonth: today.slice(0, 7),
			value: {
				title: editingTitle.trim(),
				message: editingMessage.trim()
			}
		};

		try {
			await saveService(updated);

			// Обновляем в списке
			recipes = recipes.map((r) => (r.id === updated.id ? updated : r));
			editingId = null;
			editingTitle = '';
			editingMessage = '';

			toastStore.show('Рецепт сохранён', 'success');
		} catch (error) {
			console.error('[recipes] Ошибка сохранения:', error);
			toastStore.show('Ошибка при сохранении', 'error');
		}
	}

	// ===== ОТМЕНА РЕДАКТИРОВАНИЯ =====
	function cancelEdit(recipe) {
		// Если title пустой и запись не сохранена — удаляем из списка
		if (!recipe.value?.title && !recipe._saved) {
			recipes = recipes.filter((r) => r.id !== recipe.id);
		}

		editingId = null;
		editingTitle = '';
		editingMessage = '';
	}

	// ===== РЕДАКТИРОВАНИЕ СУЩЕСТВУЮЩЕГО =====
	function startEdit(recipe) {
		editingId = recipe.id;
		editingTitle = recipe.value?.title || '';
		editingMessage = recipe.value?.message || '';
	}

	// ===== УДАЛЕНИЕ =====
	function openDeleteModal(id) {
		deleteTargetId = id;
		showDeleteModal = true;
	}

	async function confirmDelete() {
		if (!deleteTargetId) return;

		const idToDelete = deleteTargetId;

		try {
			await deleteService(idToDelete);

			// ✅ Новый массив + фильтрация
			recipes = [...recipes].filter((r) => r.id !== idToDelete);

			// ✅ Сброс состояния редактирования, если удалили редактируемый
			if (editingId === idToDelete) {
				editingId = null;
				editingTitle = '';
				editingMessage = '';
			}

			toastStore.show('Рецепт удалён', 'success');
		} catch (error) {
			console.error('[recipes] Ошибка удаления:', error);
			toastStore.show('Ошибка при удалении', 'error');
		} finally {
			showDeleteModal = false;
			deleteTargetId = null;
		}
	}

	// ===== ОТПРАВКА =====
	async function sendRecipe(recipe) {
		const title = recipe.value?.title || '';
		const message = recipe.value?.message || '';

		const result = await shareRecipe(title, message);
		toastStore.show(result.message, result.success ? 'success' : 'error');
	}

	// ===== ФОРМАТИРОВАНИЕ ДАТЫ =====
	function formatDate(dateStr) {
		if (!dateStr) return '';
		const [year, month, day] = dateStr.split('-');
		return `${day}.${month}.${year}`;
	}

	onMount(() => {
		loadRecipes();
	});
</script>

<div class="recipes-page">
	<!-- Шапка -->
	<HomeHeader />

	<!-- Основной контент -->
	<main class="content">
		<h1 class="page-title">📖 Рецепты</h1>

		{#if isLoading}
			<div class="loading">Загрузка...</div>
		{:else if recipes.length === 0}
			<div class="empty-state">
				<p>Рецептов пока нет</p>
				<p class="hint">Нажмите + ниже, чтобы создать первый рецепт</p>
			</div>
		{:else}
			<div class="recipes-list">
				{#key recipes.length}
					{#each recipes as recipe (recipe.id)}
						<AccordionDetails castomClass="recipe-accordion" name="recipes-accordion">
							{#snippet summary()}
								{#if editingId === recipe.id}
									<input
										type="text"
										class="recipe-title-input"
										placeholder="Название рецепта"
										bind:value={editingTitle}
										onclick={(e) => e.stopPropagation()}
									/>
								{:else}
									<h3 class="recipe-title">
										{recipe.value?.title || 'Без названия'}
									</h3>
								{/if}
							{/snippet}

							<div class="recipe-body">
								{#if editingId === recipe.id}
									<!-- Режим редактирования -->
									<textarea
										class="recipe-message-input"
										placeholder="Текст рецепта..."
										bind:value={editingMessage}
										rows="8"
									></textarea>

									<div class="recipe-actions">
										<button
											type="button"
											class="btn-action btn-cancel"
											onclick={() => cancelEdit(recipe)}
											title="Отмена"
										>
											✕
										</button>
										<button
											type="button"
											class="btn-action btn-save"
											onclick={() => saveEdit(recipe)}
											title="Сохранить"
										>
											✓
										</button>
									</div>
								{:else}
									<!-- Режим просмотра -->
									<p class="recipe-message">{recipe.value?.message || 'Нет текста'}</p>

									<div class="recipe-meta">
										Создан: {formatDate(recipe.dateCreate)}
										{#if recipe.dateStr !== recipe.dateCreate}
											· Изменён: {formatDate(recipe.dateStr)}
										{/if}
									</div>

									<div class="recipe-actions">
										<button
											type="button"
											class="btn-action"
											onclick={() => startEdit(recipe)}
											title="Редактировать"
										>
											<svg
												viewBox="0 0 24 24"
												width="20"
												height="20"
												fill="none"
												stroke="currentColor"
											>
												<path
													d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
													stroke-width="2"
												/>
												<path
													d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
													stroke-width="2"
												/>
											</svg>
										</button>

										<button
											type="button"
											class="btn-action"
											onclick={() => openDeleteModal(recipe.id)}
											title="Удалить"
										>
											<svg
												viewBox="0 0 24 24"
												width="20"
												height="20"
												fill="none"
												stroke="currentColor"
											>
												<polyline points="3 6 5 6 21 6" stroke-width="2" />
												<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke-width="2" />
												<path d="M10 11v6M14 11v6" stroke-width="2" />
											</svg>
										</button>

										<button
											type="button"
											class="btn-action"
											onclick={() => sendRecipe(recipe)}
											title="Отправить"
										>
											<svg
												viewBox="0 0 24 24"
												width="20"
												height="20"
												fill="none"
												stroke="currentColor"
											>
												<line x1="22" y1="2" x2="11" y2="13" stroke-width="2" />
												<polygon points="22 2 15 22 11 13 2 9 22 2" stroke-width="2" />
											</svg>
										</button>
									</div>
								{/if}
							</div>
						</AccordionDetails>
					{/each}
				{/key}
			</div>
		{/if}
	</main>

	<!-- Футер -->
	<footer>
		<button
			type="button"
			class="btn-add-recipe"
			onclick={createNewRecipe}
			aria-label="Создать рецепт"
		>
			<BtnImg src={imgAdd} alt="Создать рецепт" size={64} customClass="actionBtnImg" />
		</button>
	</footer>

	<!-- Реклама -->
	<AdvertisementGor setBanners="1" />

	<!-- Модалка удаления -->
	<ModalConfirm
		isOpen={showDeleteModal}
		title="Удаление рецепта"
		message="Вы уверены, что хотите удалить этот рецепт?"
		onConfirm={confirmDelete}
		onCancel={() => {
			showDeleteModal = false;
			deleteTargetId = null;
		}}
	/>
</div>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.recipes-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		max-height: 100vh;
		overflow: hidden;
		background: $clr-bg;

		margin: 0 auto;
		@media (min-width: 1024px), (orientation: landscape) and (min-width: 768px) {
			max-width: 60vw;
		}
		@media (max-width: 1023px) and (orientation: portrait), (max-width: 767px) {
			max-width: 80vw;
		}
		@media (max-width: 501px) {
			max-width: 100vw;
		}
	}

	.content {
		flex: 1;
		overflow-y: auto;
		padding: 12px 16px 16px;
		display: flex;
		flex-direction: column;
	}

	.page-title {
		margin: 0 0 16px 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: $clr-text-main;
		text-align: center;
	}

	.loading,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: $clr-text-main;
		opacity: 0.6;
		font-size: 14px;
		text-align: center;
		gap: 8px;
	}

	.empty-state .hint {
		font-size: 12px;
		opacity: 0.7;
	}

	/* ===== Список рецептов ===== */
	.recipes-list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	/* ===== Аккордеон рецепта ===== */
	:global(.recipe-accordion) {
		background: $clr-bg-card;
		border-radius: 1rem;
		margin-bottom: 0.75rem;
		box-shadow: $shadow-inset;
		overflow: hidden;

		summary {
			list-style: none;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 1rem 1.25rem;
			background: transparent;
			transition: background 0.2s ease;
			gap: 12px;

			&::-webkit-details-marker {
				display: none;
			}

			&::marker {
				display: none;
				content: '';
			}

			&::after {
				content: '';
				width: 0.5rem;
				height: 0.5rem;
				border-right: 2px solid $clr-teal;
				border-bottom: 2px solid $clr-teal;
				transform: rotate(45deg);
				transition: transform 0.3s ease;
				flex-shrink: 0;
			}

			&:hover {
				background: rgba($clr-teal, 0.08);
			}
		}

		&[open] summary::after {
			transform: rotate(-135deg);
		}
	}

	/* ===== Заголовок ===== */
	.recipe-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: $clr-text-main;
		flex: 1;
		text-align: left;
	}

	.recipe-title-input {
		flex: 1;
		padding: 8px 12px;
		border: 2px solid $clr-teal;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		font-family: inherit;
		background: $clr-bg;
		color: $clr-text-main;
		outline: none;

		&::placeholder {
			opacity: 0.5;
		}
	}

	/* ===== Тело рецепта ===== */
	.recipe-body {
		padding: 0 1.25rem 1rem 1.25rem;
		color: $clr-text-main;
	}

	.recipe-message {
		font-size: 14px;
		line-height: 1.6;
		white-space: pre-wrap;
		word-break: break-word;
		margin: 0 0 12px 0;
		color: $clr-text-main;
	}

	.recipe-message-input {
		width: 100%;
		padding: 10px 12px;
		border: 2px solid rgba($clr-text-main, 0.2);
		border-radius: 10px;
		font-size: 14px;
		font-family: inherit;
		background: $clr-bg;
		color: $clr-text-main;
		outline: none;
		resize: vertical;
		min-height: 120px;
		margin-bottom: 12px;

		&:focus {
			border-color: $clr-teal;
		}
	}

	.recipe-meta {
		font-size: 11px;
		color: $clr-text-main;
		opacity: 0.5;
		margin-bottom: 12px;
	}

	/* ===== Кнопки действий ===== */
	.recipe-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		flex-wrap: wrap;
	}

	.btn-action {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: 50%;
		background: rgba($clr-text-main, 0.08);
		color: $clr-text-main;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 16px;
		font-weight: 700;

		&:hover {
			background: rgba($clr-teal, 0.2);
			color: $clr-teal;
		}

		&:active {
			transform: scale(0.92);
		}
	}

	.btn-save {
		background: rgba($clr-teal, 0.15);
		color: $clr-teal;

		&:hover {
			background: $clr-teal;
			color: white;
		}
	}

	.btn-cancel {
		background: rgba($clr-error, 0.1);
		color: $clr-error;

		&:hover {
			background: $clr-error;
			color: white;
		}
	}

	/* ===== Футер ===== */
	footer {
		flex-shrink: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 12px 16px;
	}

	.btn-add-recipe {
		width: 80px;
		height: 80px;
		border: none;
		border-radius: 50%;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.08);
		}

		&:active {
			transform: scale(0.95);
		}
	}
</style>
