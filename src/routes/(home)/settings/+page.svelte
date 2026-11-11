<script>
	import BtnBack from '$lib/components/Btn/BtnBack.svelte';
	import { appStore } from '$lib/store/appStore.svelte';

	import CheckBox from '$lib/components/input/CheckBox.svelte';
	import Radio from '$lib/components/input/Radio.svelte';
	import SettingsConstructor from '$lib/components/aPage/SettingsConstructor.svelte';
	import InputText from '$lib/components/input/InputText.svelte';
	import Select from '$lib/components/input/Select.svelte';
	import { getBrowserLanguage } from '$lib/utils/getBrowserLanguage';

	// Динамическая валидация userName через $derived
	let nameError = $derived(appStore.master.trim().length === 0 ? 'Имя не может быть пустым' : '');

	// Константы:
	// для языка интерфейса
	let selectedLang = $state('RU');
	// для роли пользователя
	let selectedRole = $state('masterWorker');
	// для профессии пользователя
	let selectedProf = $state('hair');
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
	<h2>Настройки пользователя:</h2>
	<div class="settings-container options-group">
		<section class="setting-group">
			<span class="label">Имя пользователя</span>
			<InputText placeholder="Мастер" bind:value={appStore.master} error={nameError} />
		</section>

		<section class="setting-group">
			<span class="label">Роль пользователя</span>
			<Select bind:value={selectedRole} options={appStore.roleOptions} label="" placeholder="" />
		</section>

		<section class="setting-group">
			<span class="label">Профессия пользователя</span>
			<Select bind:value={selectedProf} options={appStore.profOptions} label="" placeholder="" />
		</section>
	</div>
	<h2>Настройки интерфейса:</h2>
	<div class="settings-container options-group">
		<section class="setting-group">
			<span class="label">Язык приложения</span>
			<Select bind:value={selectedLang} options={appStore.langOptions} label="" placeholder="" />
		</section>

		<section class="setting-group">
			<span class="label">Color theme</span>
			<div class="radio-group">
				<Radio bind:group={appStore.theme} value="light" label="Light" />
				<Radio bind:group={appStore.theme} value="dark" label="Dark" />
			</div>
		</section>

		<section class="setting-group">
			<CheckBox bind:checked={appStore.swipeUse} label="Использовать свайп." />
			<span class="setting-hint"
				>Включите для навигации свайпом, выключите, чтоб использовать только кнопки</span
			>
		</section>
	</div>

	<div class="settings-container">
		<h2>Конструктор заметки.</h2>
		<h2>Настройте так - как Вам удобно!</h2>
		<h2>Вы можете в любой момент подлючать и отключать нужные Вам опции!</h2>

		<SettingsConstructor />
	</div>
</div>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.settings-page {
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

	.options-group {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 16px;
		border-radius: 16px;
		transition:
			background-color 0.25s ease,
			opacity 0.25s ease;

		outline: 2px solid $clr-white;
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

	.radio-group {
		display: flex;
		flex-flow: row wrap;
		gap: 8px;
	}

	@media (max-height: 500px) and (orientation: landscape),
		(max-width: 500px) and (orientation: portrait) {
		.header {
			font-size: 2rem;
		}
	}
</style>
