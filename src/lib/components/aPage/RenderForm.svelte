<!-- src/lib/components/RenderForm.svelte -->
<script>
	import { untrack } from 'svelte';

	import { FormDraftManager } from '$lib/store/FormStore.svelte.js';
	import { formatTime, formatDateFromTimestamp } from '$lib/utils/dateHelpers.js';

	import BtnImg from '$lib/components/Btn/BtnImg.svelte';
	import BtnText from '$lib/components/Btn/BtnText.svelte';

	import InputNumber from '$lib/components/input/InputNumber.svelte';
	import InputRange from '$lib/components/input/InputRange.svelte';
	import InputText from '$lib/components/input/InputText.svelte';
	import InputTel from '$lib/components/input/InputTel.svelte';
	import InputDate from '$lib/components/input/InputDate.svelte';
	import InputTime from '$lib/components/input/InputTime.svelte';
	import Textarea from '$lib/components/input/Textarea.svelte';

	/**
	 * @typedef {'note' | 'reminder'} FormType
	 */

	/**
	 * @typedef {Object} Props
	 * @property {Object} constructorStore - экземпляр ConstructorStore
	 * @property {FormType} [type] - тип формы ('note' | 'reminder')
	 * @property {Object} [entry] - существующая запись для редактирования
	 * @property {Function} [onUpdate] - колбэк при изменении данных
	 * @property {Function} [onSave] - колбэк при сохранении
	 * @property {Function} [onCancel] - колбэк при отмене
	 * @property {boolean} [hideActions=false] - скрыть footer с кнопками
	 */

	/** @type {Props} */
	let {
		constructorStore,
		type = 'note',
		entry = $bindable(null),
		onUpdate = () => {},
		onSave = () => {},
		onCancel = () => {},
		hideActions = false
	} = $props();

	// Добавляем флаг сохранения, чтоб отследить момент сохранения. Если сохранено, то кнопка "Сохранить" - не активна
	let isSaving = $state(false);

	// Создаем менеджер формы
	const manager = untrack(() => {
		const m = new FormDraftManager(type, constructorStore);

		if (entry) {
			m.draft = {
				id: entry.id,
				timestamp: entry.timestamp,
				types: entry.types || entry.type,
				value: JSON.parse(JSON.stringify(entry.value))
			};
		}

		return m;
	});

	// Единственный $effect — синхронизация формы → entry
	$effect(() => {
		if (entry && manager.draft) {
			const snapshot = $state.snapshot(manager.draft);
			const newEntry = {
				...entry,
				value: JSON.parse(JSON.stringify(snapshot.value)),
				timestamp: snapshot.timestamp,
				types: snapshot.types || entry.types
			};

			// Обновляем entry только если данные изменились
			if (JSON.stringify(entry) !== JSON.stringify(newEntry)) {
				entry = newEntry;
			}
		}
	});

	// Добавляем реактивный список ошибок, отслеживающий изменения внутри manager.draft:
	let validationErrors = $derived(manager.getValidationErrors());

	// Используем функции из dateHelpers.js (локальное время)
	let formattedTime = $derived(formatTime(manager.draft.timestamp));
	let formattedDate = $derived(formatDateFromTimestamp(manager.draft.timestamp));

	async function handleSave() {
		// Если уже идёт сохранение — выходим
		if (isSaving) return;

		isSaving = true;
		try {
			await manager.save();
			onSave();
		} catch (error) {
			console.error('[RenderForm] Ошибка сохранения:', error);
		} finally {
			isSaving = false;
		}
	}

	function handleCancel() {
		manager.clearDraft();
		onCancel();
	}

	/**
	 * Определяет класс для BtnImg на основе состояния выбора
	 * @param {string} fieldKey - ключ поля
	 * @param {string} optKey - ключ опции
	 * @param {boolean} isSingleView - одна ли опция
	 * @param {boolean} isSelected - выбрана ли эта опция
	 * @returns {string} - класс для BtnImg
	 */
	function getBtnClass(fieldKey, optKey, isSingleView, isSelected) {
		if (!isSingleView) return '';

		const value = manager.draft.value[fieldKey];
		const hasSelection = value !== null && value !== undefined;

		if (!hasSelection) return '';

		return isSelected ? 'action' : 'notAction';
	}

	/**
	 * Возвращает текущее состояние черновика из формы
	 * @returns {Object} - копия draft
	 */
	function getDraft() {
		return $state.snapshot(manager.draft);
	}

	/**
	 * Возвращает текущее значение value из формы
	 * @returns {Object} - копия value
	 */
	function getValue() {
		return JSON.parse(JSON.stringify(manager.draft.value));
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
				Заметка
			{:else}
				Напоминание
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
			{#if field.choose !== false && fieldKey !== 'dateTime' && !(type === 'reminder' && fieldKey === 'pay')}
				<!-- Стилизация блока поля через field.fieldClass -->
				<section class="field-block {field.fieldClass || ''}">
					<!-- Отображаем label поля -->
					{#if field.label}
						<div class="field-title">
							<h3>{field.label}</h3>
						</div>
					{/if}

					<div class="options-grid">
						{#each Object.entries(field.options || {}) as [optKey, option]}
							{#if option.select === true && !(type === 'reminder' && fieldKey === 'percent' && optKey !== 'sum')}
								{@const viewList = option.formView || ['BtnImg']}
								{@const isSingleView = viewList.length === 1}
								{@const isSelected = manager.draft.value[fieldKey] === optKey}

								<!-- Стилизация строки опции через option.optionClass -->
								<div class="option-row" class:multi-view={!isSingleView}>
									{#each viewList as viewType}
										<!-- BtnImg -->
										{#if viewType === 'BtnImg' || viewType === 'btnIcon'}
											<div class="btn-wrapper">
												<BtnImg
													src={option.iconWebp || option.iconPng || ''}
													alt={option.label || optKey}
													size={isSingleView ? 88 : 64}
													customClass="{getBtnClass(
														fieldKey,
														optKey,
														isSingleView,
														isSelected
													)} {option.optionClass || ''}"
													onclick={isSingleView
														? () => manager.selectOption(fieldKey, optKey)
														: null}
												/>
											</div>
										{/if}

										<!-- Textarea -->
										{#if viewType === 'Textarea' || viewType === 'textArea'}
											<div class="input-wrapper flex-grow">
												{#if typeof manager.draft.value[fieldKey] === 'object' && manager.draft.value[fieldKey] !== null}
													<!-- ✅ Инициализируем значение, если undefined -->
													{(manager.draft.value[fieldKey][optKey] ??= '') && ''}
													<Textarea
														bind:value={manager.draft.value[fieldKey][optKey]}
														placeholder={option.placeholder || ''}
														label={isSingleView ? option.label || '' : ''}
													/>
												{:else}
													<!-- ✅ Инициализируем значение, если undefined -->
													{(manager.draft.value[fieldKey] ??= '') && ''}
													<Textarea
														bind:value={manager.draft.value[fieldKey]}
														placeholder={option.placeholder || ''}
														label={isSingleView ? option.label || '' : ''}
													/>
												{/if}
											</div>
										{/if}

										<!-- InputText -->
										{#if viewType === 'InputText' || viewType === 'inputText'}
											<div class="input-wrapper flex-grow">
												{#if typeof manager.draft.value[fieldKey] === 'object' && manager.draft.value[fieldKey] !== null}
													<!-- ✅ Инициализируем значение, если undefined -->
													{(manager.draft.value[fieldKey][optKey] ??= '') && ''}
													<InputText
														bind:value={manager.draft.value[fieldKey][optKey]}
														placeholder={option.placeholder || ''}
														label={isSingleView ? option.label || '' : ''}
														customClass={option.customClass || ''}
													/>
												{:else}
													<!-- ✅ Инициализируем значение, если undefined -->
													{(manager.draft.value[fieldKey] ??= '') && ''}
													<InputText
														bind:value={manager.draft.value[fieldKey]}
														placeholder={option.placeholder || ''}
														label={isSingleView ? option.label || '' : ''}
														customClass={option.customClass || ''}
													/>
												{/if}
											</div>
										{/if}

										<!-- InputTel -->
										{#if viewType === 'InputTel' || viewType === 'inputTel'}
											<div class="input-wrapper flex-grow">
												{#if typeof manager.draft.value[fieldKey] === 'object' && manager.draft.value[fieldKey] !== null}
													<!-- ✅ Инициализируем значение, если undefined -->
													{(manager.draft.value[fieldKey][optKey] ??= '') && ''}
													<InputTel
														bind:value={manager.draft.value[fieldKey][optKey]}
														placeholder={option.placeholder || ''}
														label={isSingleView ? option.label || '' : ''}
														customClass={option.customClass || ''}
													/>
												{:else}
													<!-- ✅ Инициализируем значение, если undefined -->
													{(manager.draft.value[fieldKey] ??= '') && ''}
													<InputTel
														bind:value={manager.draft.value[fieldKey]}
														placeholder={option.placeholder || ''}
														label={isSingleView ? option.label || '' : ''}
														customClass={option.customClass || ''}
													/>
												{/if}
											</div>
										{/if}

										<!-- InputNumber -->
										{#if viewType === 'InputNumber' || viewType === 'inputNumber'}
											<div class="input-wrapper">
												{#if typeof manager.draft.value[fieldKey] === 'object' && manager.draft.value[fieldKey] !== null}
													<!-- ✅ Инициализируем значение, если undefined -->
													{@const _init = manager.draft.value[fieldKey][optKey] ??= 0}
													<InputNumber
														bind:value={manager.draft.value[fieldKey][optKey]}
														min={option.min ?? 0}
														max={option.max ?? Infinity}
														step={option.step ?? 1}
														label={isSingleView ? option.label || '' : ''}
														customClass={option.customClass || ''}
													/>
												{:else}
													<!-- ✅ Инициализируем значение, если undefined -->
													{@const _init = manager.draft.value[fieldKey] ??= 0}
													<InputNumber
														bind:value={manager.draft.value[fieldKey]}
														min={option.min ?? 0}
														max={option.max ?? Infinity}
														step={option.step ?? 1}
														label={isSingleView ? option.label || '' : ''}
														customClass={option.customClass || ''}
													/>
												{/if}
											</div>
										{/if}

										<!-- InputRange -->
										{#if viewType === 'InputRange' || viewType === 'inputRange'}
											<div class="input-wrapper flex-grow">
												{#if typeof manager.draft.value[fieldKey] === 'object' && manager.draft.value[fieldKey] !== null}
													<!-- ✅ Инициализируем значение, если undefined -->
													{(manager.draft.value[fieldKey][optKey] ??= 0) && ''}
													<InputRange
														bind:value={manager.draft.value[fieldKey][optKey]}
														min={option.min ?? 0}
														max={option.max ?? 100}
														step={option.step ?? 1}
														label={isSingleView ? option.label || '' : ''}
													/>
												{:else}
													<!-- ✅ Инициализируем значение, если undefined -->
													{(manager.draft.value[fieldKey] ??= 0) && ''}
													<InputRange
														bind:value={manager.draft.value[fieldKey]}
														min={option.min ?? 0}
														max={option.max ?? 100}
														step={option.step ?? 1}
														label={isSingleView ? option.label || '' : ''}
													/>
												{/if}
											</div>
										{/if}

										<!-- InputDate -->
										{#if viewType === 'InputDate' || viewType === 'inputDate'}
											<div class="input-wrapper">
												{#if typeof manager.draft.value[fieldKey] === 'object' && manager.draft.value[fieldKey] !== null}
													<!-- Инициализируем ключ, если его ещё нет, чтобы избежать undefined -->
													{(manager.draft.value[fieldKey][optKey] ??= '') && ''}
													<InputDate
														bind:value={manager.draft.value[fieldKey][optKey]}
														min={option.min || ''}
														max={option.max || ''}
														label={isSingleView ? option.label || '' : ''}
													/>
												{:else}
													<InputDate
														bind:value={manager.draft.value[fieldKey]}
														min={option.min || ''}
														max={option.max || ''}
														label={isSingleView ? option.label || '' : ''}
													/>
												{/if}
											</div>
										{/if}

										<!-- InputTime -->
										{#if viewType === 'InputTime' || viewType === 'inputTime'}
											<div class="input-wrapper">
												{#if typeof manager.draft.value[fieldKey] === 'object' && manager.draft.value[fieldKey] !== null}
													<!-- Инициализируем ключ, если его ещё нет, чтобы избежать undefined -->
													{(manager.draft.value[fieldKey][optKey] ??= '') && ''}
													<InputTime
														bind:value={manager.draft.value[fieldKey][optKey]}
														label={isSingleView ? option.label || '' : ''}
													/>
												{:else}
													<InputTime
														bind:value={manager.draft.value[fieldKey]}
														label={isSingleView ? option.label || '' : ''}
													/>
												{/if}
											</div>
										{/if}
									{/each}
								</div>
							{/if}
						{/each}
					</div>
				</section>
			{/if}
		{/each}
	</div>

	<!-- Блок подсказок над кнопками -->
	{#if validationErrors.length > 0}
		<div class="validation-hints">
			{#each validationErrors as error}
				<div class="hint-item">
					<span class="hint-icon">⚠️</span>
					<span class="hint-text">{error}</span>
				</div>
			{/each}
		</div>
	{/if}
	<!-- ✅ FOOTER — показываем только если hideActions === false -->
	{#if !hideActions}
		<footer class="form-actions">
			<!-- Кнопки действия -->
			<BtnText buttonText="Отмена" onclick={handleCancel} />
			<BtnText
				buttonText="Сохранить"
				disabled={!manager.isValid || isSaving}
				onclick={handleSave}
				customClass="btn-save {!manager.isValid || isSaving ? 'disabled' : ''}"
			/>
		</footer>
	{/if}
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
		gap: 1rem;
		width: 100%;
		max-width: 600px;
		margin: 0 auto;
		padding: 0.5rem;

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
			border-bottom: 2px solid $clr-white;
			box-shadow: 0px -2px 4px 0px $clr-white;
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
			justify-content: center;
			.option-row {
				display: flex;
				flex-flow: row;
				justify-content: center;
				align-items: center;
				gap: 0.25rem;
			}
		}

		.field-block.percentField,
		.field-block.notesField {
			.options-grid {
				flex-flow: row wrap;
			}
		}

		// === -📝=TODO=📝- ===
		// нужно было выделить поле ввода суммы
		// оно должно быть первым!!!
		.field-block.percentField {
			.option-row:nth-of-type(1) {
				order: 1;
			}
			.option-row:nth-of-type(2) {
				order: -1;
				min-width: 100%;
				.input-wrapper {
					min-width: 60%;
					.input-number-field {
						min-width: 300px;
					}
				}
			}
			.option-row:nth-of-type(3) {
				order: 0;
			}
		}

		.field-block.notesField .option-row:last-child {
			flex: 1 1 100%;
			.input-wrapper {
				width: 100%; // !important;
			}
		}

		.field-block.notesField {
			justify-content: flex-start;
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
					&.btn-save.disabled,
					.btn-save:disabled {
						opacity: 0.5 !important;
						cursor: not-allowed !important;
						pointer-events: none !important;
					}
				}

				&.btn-cancel {
					background-color: rgba($clr-text-main, 0.1);
					color: $clr-text-main;
				}
			}
		}
		.form-actions {
			margin: 0 auto;
			padding: 1rem auto;
			flex-shrink: 0;
			display: flex;
			gap: 12px;
			justify-content: center;
			border-top: 1px solid rgba(0, 0, 0, 0.06);
		}
	}
</style>
