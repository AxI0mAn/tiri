<script>
	// src/routes/(date)/day/+page.svelte
	import { appState } from '$lib/store/appState.svelte';

	import HomeHeader from '$lib/components/aBlock/homeHeader/homeHeader.svelte';
	import QuickMenu from '$lib/components/aBlock/QuickMenu.svelte';
	import SwipeDay from '$lib/components/aPage/day/SwipeDay.svelte';
</script>

<div class="showDay">
	<header class="headerWrapper" id="top-anchor">
		<HomeHeader />
	</header>

	<main class="field_main">
		<SwipeDay />
	</main>

	<footer>
		<h2>footer</h2>
		<!-- <QuickMenu /> -->
	</footer>
</div>

<style lang="scss">
	header {
		margin: 0 auto;
		// --- РЕЖИМ: DESKTOP & TABLET LANDSCAPE ---
		@media (min-width: 1024px), (orientation: landscape) and (min-width: 768px) {
			min-width: 60vw;
		}
		// --- РЕЖИМ: MOBILE & TABLET PORTRAIT ---
		@media (max-width: 1023px) and (orientation: portrait), (max-width: 767px) {
			min-width: 80vw;
		}
		// --- МОБИЛЬНЫЙ   ---
		@media (max-width: 501px) {
			min-width: 100vw;
		}
	}

	.showDay {
		width: 100vw;
		max-height: 100vh;
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: var(--clr-bg-primary, #f5f5f5);
	}

	.headerWrapper {
		flex-shrink: 0;
		z-index: 10;
	}

	.field_main {
		flex: 1;
		min-height: 0;
		overflow: hidden;
		position: relative;
	}

	footer {
		flex-shrink: 0;
		z-index: 10;
	}
</style>
