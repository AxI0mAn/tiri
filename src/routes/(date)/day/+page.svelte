<script>
	// src/routes/(date)/day/+page.svelte
	// @ts-ignore
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	import BtnImg from '$lib/components/Btn/BtnImg.svelte';
	import imgAdd from '$lib/assets/iconPic/128/add.webp';
	import imgDone from '$lib/assets/iconPic/128/done.webp';

	import BtnCreateZReport from '$lib/components/Btn/BtnCreateZReport.svelte';

	import HomeHeader from '$lib/components/aBlock/homeHeader/homeHeader.svelte';
	import SwipeDay from '$lib/components/aPage/day/SwipeDay.svelte';

	import { canAddNote } from '$lib/components/services/reportGuard';
	import { getTodayDate } from '$lib/utils/dateHelpers.js';
	import { appState } from '$lib/store/appState.svelte.js';

	import AdvertisementGor from '$lib/components/advertisement/advertisementGor.svelte';

	let canAddNoteToday = $state(true);
	// === -📝=TODO=📝- 3у сентября=== раскоментируй onMount
	// onMount(async () => {
	// 	const today = getTodayDate();
	// 	canAddNoteToday = await canAddNote(today);

	// });
</script>

<div class="showDay">
	<header class="headerWrapper" id="top-anchor">
		<HomeHeader />
	</header>

	<main class="field_main">
		<SwipeDay />
	</main>

	<footer>
		<!-- <QuickMenu /> -->
		<a
			href="{base}/newNote"
			class="iconLink"
			class:disabled={!canAddNoteToday}
			onclick={(e) => {
				if (!canAddNoteToday) {
					e.preventDefault();
				}
			}}
		>
			<!-- <span>Выполнено</span> -->
			<BtnImg
				src={imgDone}
				alt="test btn img"
				size={88}
				customClass="actionBtnImg {!canAddNoteToday ? 'opacity-50' : ''}"
			/>
		</a>
		<a href="{base}/newReminder" class="iconLink">
			<!-- <span>Запись</span> -->
			<BtnImg src={imgAdd} alt="test btn img" size={88} onclick="null" customClass="actionBtnImg" />
		</a>

		<BtnCreateZReport />
	</footer>
	<AdvertisementGor setBanners="1" />
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
		width: 80%;
		flex-shrink: 0;
		z-index: 10;
		margin: 0 auto;
		display: flex;
		flex-flow: row nowrap;
		justify-content: space-evenly;
		align-items: center;
		.iconLink {
			padding: 0.5rem;
			width: 20%;
			min-width: fit-content;
			display: flex;
			flex-flow: column nowrap;
			justify-content: center;
			align-items: center;
			gap: 0.5rem;
			span {
				font-size: calc(0.4rem + 0.6vw);
				text-transform: uppercase;
				font-weight: 777;
			}
		}
	}

	.iconLink.disabled {
		opacity: 0.5;
		pointer-events: none;
		cursor: not-allowed;
	}

	.opacity-50 {
		opacity: 0.5;
	}
</style>
