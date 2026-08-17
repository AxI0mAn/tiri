<script>
	// src/lib/components/aBlock/homeHeader/homeHeader.svelte

	import NavBurger from '$lib/components/NavBurger/NavBurger.svelte';
	import BtnShare from '$lib/components/Btn/BtnShare.svelte';
	import { appStore } from '$lib/store/appStore.svelte';

	import Picture from '$lib/components/Picture/Picture.svelte';
	import srcLogoText_webp from '$lib/assets/logo_text3d.webp';
	import srcLogoText_png from '$lib/assets/logo_text3d.png';
</script>

<header class="home__header">
	<div><NavBurger /></div>
	<div class="logoText">
		<Picture
			src={{
				webp: srcLogoText_webp,
				jpeg: srcLogoText_png
			}}
			alt="Логотип текст"
			class="bg-image"
			loading="lazy"
			decoding="async"
			// width={128}
			// height={64}
		/>
	</div>
	<div class="shareNow">
		<BtnShare />
	</div>
</header>

<style lang="scss">
	.home__header {
		background-color: transparent; // Используем наш утвержденный акцент
		width: 100%;
		padding: 0.25rem 0.5rem;
		display: flex;
		flex-flow: row nowrap;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;

		// Текст внутри коралловой шапки должен быть темным для контраста
		color: $clr-bg;

		.logoText {
			width: 10vw;
			aspect-ratio: 2/1;
		}

		.shareNow {
			padding-right: 1rem;
			min-height: 100%;
			min-width: 3rem;
			aspect-ratio: 1/1;
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 1rem;
		}
	}
</style>
