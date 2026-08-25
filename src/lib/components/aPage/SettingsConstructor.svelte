<script>
	// src/lib/components/aPage/SettingsConstructor.svelte
	/** 
   Компонент предназначается для визуального конструирования настроек (для заказов или напоминаний) на основе динамической схемы, с автосохранением в localStorage.
     Благодаря дефолтному импорту стора, компонент поддерживается в двух форматах вызова.
    ПРИМЕНЕНИЕ описано ниже 
   */

	import { onDestroy } from 'svelte';

	import { constructorStore as defaultStore } from '$lib/store/ConstructorStore.svelte.js';
	import { rebuildReminderSchema } from '$lib/store/rebuildReminder';

	import CheckBox from '../input/CheckBox.svelte';
	import SelectStatus from '../input/SelectStatus.svelte';
	import BtnImg from '../Btn/BtnImg.svelte';
	import InputNumber from '../input/InputNumber.svelte';
	import InputRange from '../input/InputRange.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import( '$lib/store/ConstructorStore.svelte.js').ConstructorStore} [constructorStore] - Экземпляр стора
	 * @property {string} [customClass='']
	 */

	let { constructorStore = defaultStore, customClass = '' } = $props();

	// Функция определения типа опции (1: картинка, 2: инпуты, 3: инпуты + картинка)
	function getOptionType(opt) {
		const hasNum = typeof opt.num !== 'undefined';
		const hasImg = Boolean(opt.iconWebp || opt.iconPng || opt.src);

		if (hasNum && hasImg) return 3;
		if (hasNum) return 2;
		return 1;
	}

	function getImgPath(opt) {
		const rawPath = opt.iconWebp || opt.iconPng || opt.src || '';
		return rawPath.replace(/\.(png|webp)$/i, '');
	}

	let selectStatusRefs = $state({});

	function triggerSelectStatus(fieldKey, optionKey) {
		const key = `${fieldKey}_${optionKey}`;
		const ref = selectStatusRefs[key];
		if (ref) {
			const btn = ref.querySelector('.status-trigger') || ref.querySelector('button');
			if (btn) btn.click();
		}
	}

	// При уходе со страницы пересобираем шаблон напоминалки в localStorage
	onDestroy(() => {
		rebuildReminderSchema();
	});
</script>

<div class="settings-constructor {customClass}">
	{#each Object.entries(constructorStore.schema) as [fieldKey, field]}
		{@const isFieldDisabled = !field.required && !field.choose}

		<section
			class="options-list"
			class:is-required={field.required}
			class:is-chosen={!field.required && field.choose}
			class:is-disabled={isFieldDisabled}
		>
			<header class="field-header">
				<div class="header-left">
					{#if !field.required}
						<CheckBox bind:checked={field.choose} label="" />
					{/if}
					<h4 class="field-label">{field.label}</h4>
				</div>
				{#if field.title}
					<p class="field-title">{field.title}</p>
				{/if}
			</header>

			<div class="options-grid {field.fieldClass || ''}">
				{#each Object.entries(field.options || {}) as [optionKey, opt]}
					{@const optType = getOptionType(opt)}
					{@const isOptRequired = field.required || opt.required}
					{@const isOptSelected = opt.select}
					{@const isOptDisabled = isFieldDisabled || (!isOptRequired && !isOptSelected)}
					{@const statusKey = `${fieldKey}_${optionKey}`}

					<div
						class="option-card type-{optType}"
						class:opt-required={isOptRequired}
						class:opt-selected={!isOptRequired && isOptSelected}
						class:opt-deselected={!isOptRequired && !isOptSelected}
						class:is-disabled={isFieldDisabled}
					>
						<div class="card-content" class:content-disabled={isOptDisabled}>
							<!-- ТИП 1: Картинка -->
							{#if optType === 1}
								<div class="image-wrapper">
									<BtnImg
										src={getImgPath(opt)}
										alt={opt.label || ''}
										size={64}
										customClass={opt.optionClass || ''}
										onclick={() =>
											!isFieldDisabled &&
											!isOptRequired &&
											triggerSelectStatus(fieldKey, optionKey)}
									/>
								</div>

								<!-- ТИП 2: Числовые инпуты -->
							{:else if optType === 2}
								<div class="inputs-wrapper">
									<InputNumber
										bind:value={opt.num}
										min={opt.min}
										max={opt.max}
										step={opt.step}
										disabled={isOptDisabled}
									/>

									{#if typeof opt.min !== 'undefined' && typeof opt.max !== 'undefined'}
										<InputRange
											bind:value={opt.num}
											min={opt.min}
											max={opt.max}
											step={opt.step || 1}
											disabled={isOptDisabled}
										/>
									{/if}
								</div>

								<!-- ТИП 3: Инпуты + Картинка -->
							{:else if optType === 3}
								<div class="type3-layout">
									<div class="inputs-wrapper">
										<InputNumber
											bind:value={opt.num}
											min={opt.min}
											max={opt.max}
											step={opt.step}
											disabled={isOptDisabled}
										/>

										{#if typeof opt.min !== 'undefined' && typeof opt.max !== 'undefined'}
											<InputRange
												bind:value={opt.num}
												min={opt.min}
												max={opt.max}
												step={opt.step || 1}
												disabled={isOptDisabled}
											/>
										{/if}
									</div>

									<div class="image-wrapper">
										<BtnImg
											src={getImgPath(opt)}
											alt={opt.label || ''}
											size={54}
											customClass="icon"
											onclick={() =>
												!isFieldDisabled &&
												!isOptRequired &&
												triggerSelectStatus(fieldKey, optionKey)}
										/>
									</div>
								</div>
							{/if}

							<!-- Селектор статуса -->
							{#if !isOptRequired}
								<div class="status-container" bind:this={selectStatusRefs[statusKey]}>
									<SelectStatus
										bind:value={
											() => (opt.select ? 'use' : 'not_use'),
											(v) => constructorStore.setOptionSelect(fieldKey, optionKey, v === 'use')
										}
										disabled={isFieldDisabled}
									/>
								</div>
							{/if}
						</div>

						{#if opt.label}
							<span class="option-label">{opt.label}</span>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{/each}
</div>

<!-- 
ПРИМЕНЕНИЕ 

Как теперь выглядит вызов на любой вашей странице или в родительском компоненте:
Вариант 1 (Для заказов — с использованием основного стора):
Svelte
<script>
  import SettingsConstructor from '$lib/components/input/SettingsConstructor.svelte';
  import { constructorStore } from '$lib/store/ConstructorStore.svelte.js';
</script>

<SettingsConstructor {constructorStore} />
(Или даже просто <SettingsConstructor/> — так как constructorStore подтянется автоматически как дефолтный значение).

Вариант 2 (Для напоминаний — если передаете второй экземпляр):
Svelte
<script>
  import SettingsConstructor from '$lib/components/input/SettingsConstructor.svelte';
  import { constructorReminder } from '$lib/store/ConstructorStore.svelte.js';
</script>

<SettingsConstructor constructorStore={constructorReminder} />

-->

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.settings-constructor {
		display: flex;
		flex-direction: column;
		gap: 24px;
		width: 100%;

		.options-list {
			display: flex;
			flex-direction: column;
			gap: 16px;
			padding: 20px;
			border-radius: 16px;
			transition:
				background-color 0.25s ease,
				opacity 0.25s ease;

			&.is-required {
				background-color: transparent;
			}

			&.is-chosen {
				background-color: rgba($clr-bg-dark-rgb, 0.6);
			}

			&.is-disabled {
				background-color: rgba($clr-bg-card-rgb, 0.6);

				.options-grid {
					opacity: 0.8;
					pointer-events: none;
				}
			}

			.field-header {
				display: flex;
				flex-direction: column;
				gap: 4px;

				.header-left {
					display: flex;
					align-items: center;
					gap: 12px;
				}

				.field-label {
					margin: 0;
					font-size: 1.1rem;
					font-weight: 700;
					color: $clr-text-main;
				}

				.field-title {
					margin: 0;
					font-size: 0.85rem;
					color: $clr-text-accent;
				}
			}

			.options-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
				gap: 16px;
				transition: opacity 0.2s ease;
			}
		}

		.option-card {
			position: relative;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			padding: 16px;
			border-radius: 14px;
			background: rgba($clr-bg-card-rgb, 0.6);
			box-sizing: border-box;
			transition:
				outline-color 0.2s ease,
				opacity 0.2s ease;

			&.opt-required {
				outline: 2px solid $clr-white;
			}

			&.opt-selected {
				outline: 2px solid $clr-teal;
			}

			&.opt-deselected {
				outline: 2px solid $clr-pink;
			}

			&.is-disabled {
				outline-color: transparent !important;
			}

			/* 
    Управление карточкой, когда внутри открыт SelectStatus 
    или фокус находится внутри карточки
  */
			/* Используем :global() для класса из дочернего компонента SelectStatus */
			&:has(:global(.select-status.is-open)),
			&:has(:global(.select-status:focus-within)) {
				.card-content.content-disabled {
					opacity: 1 !important; // Снимаем прозрачность с контента
				}
			}

			.card-content {
				position: relative;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				width: 100%;
				gap: 10px;

				&.content-disabled {
					opacity: 0.4;
					transition: opacity 0.2s ease;
				}

				/* 
      Альтернативно: прямое переопределение на самом .card-content, 
      если открыт SelectStatus внутри него
    */
				&:has(:global(.select-status.is-open)),
				&:has(:global(.select-status:focus-within)) {
					opacity: 1 !important;
				}
			}

			.status-container {
				position: absolute;
				top: -8px;
				right: -8px;
				z-index: 5;
			}

			.option-label {
				font-size: 0.85rem;
				font-weight: 600;
				color: $clr-text-accent;
				text-align: center;
				user-select: none;
			}

			.type3-layout {
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 12px;
				width: 100%;

				.inputs-wrapper {
					flex: 1;
				}
			}

			.inputs-wrapper {
				display: flex;
				flex-direction: column;
				gap: 8px;
				width: 100%;
			}
		}
	}
</style>
