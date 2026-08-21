<script>
	import BtnBack from '$lib/components/Btn/BtnBack.svelte';
	import { appStore } from '$lib/store/appStore.svelte';
	import SettingsConstructor from '$lib/components/aPage/SettingsConstructor.svelte';

	// Константы для выбора
	const languages = ['RU']; //, 'EN', 'UA', 'PT', 'ES'];
</script>

<svelte:head>
	<meta name="robots" content="index,follow" />
	<title>amoca settings</title>
</svelte:head>

<header class="header">
	<BtnBack />
	<h1 class="headerSlogan">settings</h1>
</header>

<div class="homeTextPage settings-page">
	<section class="setting-group">
		<span class="label">Interface language</span>
		<select bind:value={appStore.lang} class="custom-select">
			{#each languages as l}
				<option value={l}>{l}</option>
			{/each}
		</select>
	</section>

	<section class="setting-group">
		<span class="label">Interface language</span>
		<select bind:value={appStore.lang} class="custom-select">
			{#each languages as l}
				<option value={l}>{l}</option>
			{/each}
		</select>
	</section>

	<div class="settings-container">
		<h2>Конструктор заметки</h2>

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
		margin: 0 auto;
		max-width: 50vmin;
		margin-bottom: 25px;
		display: flex;
		flex-direction: column;
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
