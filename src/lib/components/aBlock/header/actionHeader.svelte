<script>
	// @ts-ignore
	import { base } from '$app/paths';
	import BtnBack from '$lib/components/Btn/BtnBack.svelte';
	import BtnImg from '$lib/components/Btn/BtnImg.svelte';

	let { customClass = '', modeTitle = '', customLink = '', src = '' } = $props();
</script>

<header class={customClass}>
	<div class="header-left">
		<BtnBack />
	</div>
	<div class="header-center">
		<span class="mode-title">{modeTitle}</span>
	</div>
	<div class="header-right">
		<a href="{base}/{customLink}" class="">
			<BtnImg {src} alt="Справка" size={44} customClass="actionBtnImg faqLink" />
		</a>
	</div>
</header>

<style lang="scss">
	@use '../../../../styles/_variables.scss' as *;
	header {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0.5rem;
		min-height: 56px;

		.header-left,
		.header-right {
			display: flex;
			align-items: center;
			min-width: 60px;
		}

		.header-right {
			justify-content: flex-end;
		}

		.header-center {
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;

			.mode-title {
				font-size: 1.1rem;
				font-weight: 700;
				color: $clr-text-main;
				letter-spacing: 0.05em;
				padding: 0.5rem 1rem;
				border: 2px solid $clr-white;
				border-radius: 10%;
				background-color: $clr-bg;
			}
		}
	}
</style>
