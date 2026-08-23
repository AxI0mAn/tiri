<!-- src/lib/components/RenderForm.svelte -->
<script>
	import { untrack } from 'svelte';
	import { FormDraftManager } from '$lib/store/FormStore.svelte.js';
	import BtnImg from '$lib/components/Btn/BtnImg.svelte';
	import InputNumber from '$lib/components/input/InputNumber.svelte';
	import InputRange from '$lib/components/input/InputRange.svelte';

	/**
	 * @typedef {'note' | 'reminder'} FormType
	 */

	/**
	 * @typedef {Object} Props
	 * @property {Object} constructorStore
	 * @property {FormType} [type]
	 * @property {Function} [onSave]
	 * @property {Function} [onCancel]
	 */

	/** @type {Props} */
	let { constructorStore, type = 'note', onSave = () => {}, onCancel = () => {} } = $props();

	// untrack() отключает отслеживание первичного чтения пропсов Svelte 5,
	// избавляя от предупреждения state_referenced_locally
	const manager = untrack(() => new FormDraftManager(type, constructorStore));

	let dateObj = $derived(new Date(manager.draft.timestamp));

	let formattedTime = $derived(
		dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	);

	// Исправлено: скобка закрывает весь объект настроек
	let formattedDate = $derived(
		dateObj.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })
	);

	async function handleSave() {
		await manager.save();
		onSave();
	}

	function handleCancel() {
		manager.clearDraft();
		onCancel();
	}
</script>

<div class="render-form">
	<!-- Хедер формы -->
	<header
		class="form-header"
		class:bg-note={type === 'note'}
		class:bg-reminder={type === 'reminder'}
	>
		<span class="header-title">
			{#if type === 'note'}
				'Заметка'
			{:else}
				'Напоминание'
			{/if}
		</span>
		<div class="datetime-block">
			<span class="time">{formattedTime}</span>
			<span class="date">{formattedDate}</span>
		</div>
	</header>

	<!-- Список полей -->
	<div class="fields-container">
		{#each Object.entries(constructorStore.schema || {}) as [fieldKey, field]}
			{#if field.choose !== false && fieldKey !== 'dateTime'}
				<section class="field-block">
					{#if field.label || field.title}
						<div class="field-title">
							{#if field.label}<h3>{field.label}</h3>{/if}
							{#if field.title}<p class="field-subtitle">{field.title}</p>{/if}
						</div>
					{/if}

					<div class="options-grid">
						{#each Object.entries(field.options || {}) as [optKey, option]}
							{#if option.select === true}
								{#if typeof option.num !== 'number'}
									<div class="btn-wrapper">
										<BtnImg
											src={option.iconWebp || option.iconPng || ''}
											alt={option.label || optKey}
											customClass={manager.draft.value[fieldKey] === optKey
												? 'action'
												: 'notAction'}
											onclick={() => manager.selectOption(fieldKey, optKey)}
										/>
									</div>
								{:else}
									<div class="numeric-card">
										{#if option.label}
											<span class="option-label">{option.label}</span>
										{/if}

										<InputNumber
											bind:value={manager.draft.value[fieldKey][optKey]}
											min={option.min ?? 0}
											max={option.max ?? Infinity}
											step={option.step ?? 1}
										/>

										{#if typeof option.min === 'number' && typeof option.max === 'number'}
											<InputRange
												bind:value={manager.draft.value[fieldKey][optKey]}
												min={option.min}
												max={option.max}
												step={option.step ?? 1}
											/>
										{/if}
									</div>
								{/if}
							{/if}
						{/each}
					</div>
				</section>
			{/if}
		{/each}
	</div>

	<!-- Кнопки действия -->
	<footer class="form-actions">
		<button type="button" class="btn-cancel" onclick={handleCancel}>Отмена</button>
		<button type="button" class="btn-save" onclick={handleSave}>Сохранить</button>
	</footer>
</div>

<!-- 
ПРИМЕНЕНИЕ
<script>
  import RenderForm from '$lib/components/RenderForm.svelte';
  
  // Импортируем ваши сторы схем
  import { constructorStore } from '$lib/store/constructorStore.svelte.js';
  import { constructorReminder } from '$lib/store/constructorReminder.svelte.js';

  function handleSave() {
    console.log('Форма успешно сохранена!');
  }

  function handleCancel() {
    console.log('Редактирование отменено');
  }
</script>

 Для ЗАМЕТКИ 
<RenderForm
  type="note"
  constructorStore={constructorStore}
  onSave={handleSave}
  onCancel={handleCancel}
/>

 Для НАПОМИНАНИЯ 
<RenderForm
  type="reminder"
  constructorStore={constructorReminder}
  onSave={handleSave}
  onCancel={handleCancel}
/>
-->

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.render-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
		max-width: 600px;
		margin: 0 auto;

		.form-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 12px 16px;
			border-radius: 12px;
			color: $clr-text-main;

			&.bg-note {
				background-color: $clr-bg-dark;
			}

			&.bg-reminder {
				background-color: $clr-bg-card;
			}

			.header-title {
				font-weight: 700;
				font-size: 1.1rem;
			}

			.datetime-block {
				display: flex;
				align-items: center;
				gap: 10px;
				font-weight: 500;
				font-size: 0.95rem;

				.time {
					opacity: 0.9;
				}

				.date {
					opacity: 0.75;
				}
			}
		}

		.field-block {
			background-color: rgba($clr-bg-card, 0.4);
			border-radius: 12px;
			padding: 14px;
			margin-bottom: 12px;

			.field-title {
				margin-bottom: 10px;

				h3 {
					font-size: 0.95rem;
					color: $clr-text-main;
					margin: 0;
				}

				.field-subtitle {
					font-size: 0.8rem;
					color: rgba($clr-text-main, 0.6);
					margin: 2px 0 0 0;
				}
			}
		}

		.options-grid {
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
			align-items: center;
		}

		.numeric-card {
			display: flex;
			flex-direction: column;
			gap: 8px;
			width: 100%;
			padding: 8px 0;

			.option-label {
				font-size: 0.85rem;
				color: $clr-text-main;
			}
		}

		.form-actions {
			display: flex;
			gap: 12px;
			margin-top: 12px;

			button {
				flex: 1;
				padding: 12px;
				border-radius: 10px;
				font-weight: 600;
				border: none;
				cursor: pointer;

				&.btn-save {
					background-color: $clr-teal;
					color: #000;
				}

				&.btn-cancel {
					background-color: rgba($clr-text-main, 0.1);
					color: $clr-text-main;
				}
			}
		}
	}
</style>
