<script>
	import BtnBack from '$lib/components/Btn/BtnBack.svelte';
	import { appStore } from '$lib/store/appStore.svelte';

	import CheckBox from '$lib/components/input/CheckBox.svelte';
	import SettingsConstructor from '$lib/components/aPage/SettingsConstructor.svelte';
	import InputText from '$lib/components/input/InputText.svelte';
	import Select from '$lib/components/input/Select.svelte';
	import { getBrowserLanguage } from '$lib/utils/getBrowserLanguage';

	// Динамическая валидация userName через $derived
	let nameError = $derived(appStore.master.trim().length === 0 ? 'Имя не может быть пустым' : '');

	// Константы для языка интерфейса
	let selectedLang = $state('RU');
</script>

<svelte:head>
	<meta name="robots" content="index,follow" />
	<title>tiri settings</title>
</svelte:head>

<header class="header">
	<BtnBack />
	<h1 class="headerSlogan">настройки</h1>
</header>

<div class="homeTextPage settings-page">
	<section class="setting-group">
		<span class="label">Имя мастера</span>
		<InputText placeholder="Мастер" bind:value={appStore.master} error={nameError} />
	</section>

	<section class="setting-group">
		<span class="label">Язык приложения</span>
		<Select bind:value={selectedLang} options={appStore.langOptions} label="" placeholder="" />
	</section>

	<section class="setting-group">
		<CheckBox bind:checked={appStore.swipeDay} label=" " />
		<span class="setting-hint">Включите для навигации свайпом,</span><span class="setting-hint"
			>выключите, чтоб использовать только кнопки</span
		>
	</section>

	<div class="settings-container">
		<h2>Конструктор заметки.</h2>
		<h2>Настройте так - как Вам удобно!</h2>
		<h2>Вы можете в любой момент подлючать и отключать нужные Вам опции!</h2>

		<SettingsConstructor />
	</div>
</div>

<style lang="scss">
	.settings-page {
		// color: $clr-teal; // #00d1ff
		padding: 20px;
		font-family: sans-serif;
		min-height: 100vh;
	}

	.header {
		display: flex;
		flex-flow: row wrap;
		justify-content: flex-start;
		align-items: center;
		padding: 2rem;
		gap: 2rem;

		.headerSlogan {
			font-size: 3rem;
			display: inline-block;
		}
	}
	@media (max-height: 500px) and (orientation: landscape),
		(max-width: 500px) and (orientation: portrait) {
		.headerSlogan {
			font-size: 2rem;
		}
	}

	.setting-group {
		// margin: 0 auto;
		max-width: 60vmin;
		margin-bottom: 25px;
		padding: 1rem 2rem;
		display: flex;
		flex-flow: row wrap;
		align-items: center;
		gap: 10px;
	}

	.label {
		color: $clr-text-main;
		font-size: 0.85rem;
		text-transform: uppercase;
	}

	/* Стилизация Select */
	.custom-select {
		min-width: fit-content;
		max-width: 25vmin;
		background: $clr-bg-dark;
		color: $clr-text-main;
		border: 1px solid $clr-white;
		padding: 10px;
		border-radius: 6px;
		outline: none;

		&:focus {
			border-color: $clr-teal;
		}
	}

	@media (max-height: 500px) and (orientation: landscape),
		(max-width: 500px) and (orientation: portrait) {
		.header {
			font-size: 2rem;
		}
	}
</style>
