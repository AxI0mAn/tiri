<script>
	/**
	 * домашняя страница
	$routes/+page.svelte
	 */

	// ------------- ссылки с учётом локализации в будущем
	// @ts-ignore
	import { base } from '$app/paths';

	// может быть открыт только один <details>
	import { onMount } from 'svelte';
	import { initAccordion } from '$lib/utils/initAccordion';

	onMount(() => {
		// Код внутри onMount никогда не запустится на сервере
		initAccordion(); // аккордеон из нескольких <details> для домашнего каталога
	});

	// Double Tap Issue - перехватывает первый клик на мобильном устройстве
	import { initTouchHover } from '$lib/utils/initTouchHover';
	$effect(() => {
		initTouchHover('.catalog__card');
	});

	// кнопка ВВЕРХ
	import { createScrollTopButton } from '$lib/utils/createScrollTopButton';

	$effect(() => {
		// Запускаем создание и сохраняем функцию удаления
		const destroyButton = createScrollTopButton('top-anchor');

		// Эта часть сработает, когда пользователь уйдет с этой страницы
		return () => {
			destroyButton();
		};
	});

	//
	import HomeHeader from '$lib/components/aBlock/homeHeader/homeHeader.svelte';

	// ------------- логотипы для ссылок на страницы калькуляторов

	import Picture from '$lib/components/Picture/Picture.svelte';

	// ----------------

	// -------------- рекламные вертикальные банеры для десктоп шире 1023

	import AdvertisementVert from '$lib/components/advertisement/AdvertisementVert.svelte';

	// -------------- рекламные горизонтальные банеры для не десктоп уже 1023

	import AdvertisementGor from '$lib/components/advertisement/advertisementGor.svelte';

	//-------------------
	// кнопки
	import BtnText from '$lib/components/Btn/BtnText.svelte';
	import BtnImg from '$lib/components/Btn/BtnImg.svelte';

	import imgDate from '$lib/assets/iconPic/128/date.webp';
	import imgFlauer3d from '$lib/assets/iconPic/128/flauer3d.webp';
	import imgAdd from '$lib/assets/iconPic/128/add.webp';
	import imgDone from '$lib/assets/iconPic/128/done.webp';
</script>

<div class="app-wrapper">
	<aside class="field_left">
		<!-- <AdvertisementVert setBanners="1" /> -->
	</aside>
	<main class="field_main" id="catalogAllFeatures">
		<div class="headerWrapper" id="top-anchor"><HomeHeader /></div>

		<h1 class="slogan font-digits">Привет, я Tiri</h1>
		<div class="testText">
			<h2>Приложение, которое помагает Мастерам работающим на проценте.</h2>
			<h2>Со мной проще вести запись и учёт клиентов, сохранять и рассчитывать доход.</h2>
			<h2>Всё сохраняется ТОЛЬКО на твоём устройстве.</h2>
			<h2>Ничего не попадает в сеть!</h2>
			<h2><em>Твои секреты - только твои!</em></h2>
		</div>

		<!-- <a href="{base}/month">Calendar from month</a> -->
		<!-- <a href="{base}/admin">ВВод заметок за прошлый период</a> -->

		<div class="testComponents">
			<div class="btnTested">
				<a href="{base}/newReminder" class="testLink">
					<span>Запись</span>
					<BtnImg
						src={imgAdd}
						alt="test btn img"
						size={88}
						onclick="null"
						customClass="actionBtnImg"
					/>
				</a>
				<a href="{base}/day" class="testLink">
					<span>Сегодня</span>
					<BtnImg
						src={imgDate}
						alt="test btn img"
						size={88}
						onclick="null"
						customClass="actionBtnImg"
					/>
				</a>
				<a href="{base}/settings" class="testLink">
					<span>Настройки</span>
					<BtnImg
						src={imgFlauer3d}
						alt="test btn img"
						size={88}
						onclick="null"
						customClass="actionBtnImg"
					/>
				</a>
			</div>
		</div>
		<h2 class="inset">Learn more</h2>
	</main>
	<aside class="field_right">
		<!-- <AdvertisementVert setBanners="2" /> -->
		<!-- advertisement картинки и банеры ?? -->
		<!-- <div class="realExamples">
			<h2>Real-World Examples</h2>
			<h2>Solve everyday math problems with practical examples.</h2>
		</div> -->
	</aside>
</div>

<!-- <footer>
	<ul>
		  <li><a href="{base}/install"><span>How install App.</span></a></li>
		<li><a href="{base}/share"><span>How share App.</span></a></li>   
		<li><a href="{base}/faq"><span>FAQ</span></a></li>
		<li><a href="{base}/instructionAll"><span>Instruction for App.</span></a></li>
		<li><p></p></li>
		<li><a href="{base}/privacyPolicy"><span>Privacy Policy</span></a></li>
		<li><a href="{base}/disclaimer"><span>Disclaimer</span></a></li>
		<li><p></p></li>
		<li><a href="{base}/about"><span>About</span></a></li>
		<li><a href="{base}/contactUs"><span>Contact Us</span></a></li>
	</ul>
	<div class="footer_logo">
		<h2>"Logo for this App"</h2>
		<h2 class="slogan">
			<span class="allFunc">One familiar interface </span>
			<span class="allCalc">for many Calculators</span>
			<span class=""> that work together.</span>
		</h2>
	</div>
</footer> -->

<style lang="scss">
	@use '../styles/variables';
	.testComponents {
		width: 100%;
		display: flex;
		flex-flow: column wrap;
		gap: 1rem;
	}
	.btnTested {
		width: 100%;
		display: flex;
		flex-flow: row wrap;
		justify-content: space-around;
		align-items: center;
	}
	.testLink {
		border: 2px solid $clr-white;
		border-radius: 1rem;
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
	.testText {
		display: flex;
		flex-flow: column nowrap;
		justify-content: center;
		gap: 1.5rem;
		max-width: 80%;
		font-size: 1.25rem;
		font-weight: 777;
		letter-spacing: 0.25rem;
		line-height: 1.75rem;
	}
	.field_left,
	.field_right {
		color: $clr-text-main;
	}

	.advertisementGor {
		display: none;
	}
	// --- РЕЖИМ: MOBILE & TABLET PORTRAIT ---
	@media (max-width: 1023px) and (orientation: portrait), (max-width: 767px) {
		.field_left,
		.field_right {
			display: none;
		}
		.advertisementGor {
			display: block;
		}
	}

	.field_main {
		width: 100%;
		padding: 0.4rem;
		box-shadow: $shadow-deep;

		display: flex;
		flex-flow: column nowrap;
		justify-content: space-between;
		align-items: center;
		gap: 24px;

		position: relative;
	}
	.headerWrapper {
		width: 100%;
		z-index: 999;
	}
	.slogan {
		width: 90%;
		display: flex;
		flex-flow: column wrap;
		justify-content: center;
		align-items: center;

		margin-bottom: 2rem;
		line-height: calc(1.8vh + 1rem);
		font-size: calc(1.2vh + 1rem); // 2.4rem;
		text-align: center;
		color: $clr-text-accent;
		.allCalc {
			color: $clr-text-main;
			font-weight: 100;
		}
	}

	p {
		max-width: 92%;
		text-align: center;
		letter-spacing: 0.25rem;
		line-height: 1.4rem;
		font-size: 1.2rem;
		font-weight: 400;
		margin-bottom: 1.4rem;
	}

	.inset {
		color: $clr-text-main;
		text-shadow: 1px 1px 1px rgba($clr-text-main-rgb, 0.9);
	}

	/* Состояние Hover для устройств с мышью */
	@media (hover: hover) {
		.catalog__card:hover {
			box-shadow: -4px 4px 2px 2px rgba($clr-pink, 0.5);
			outline: 4px solid $clr-pink;

			transition: box-shadow 0.05s;
			transition: all 0.5s;

			transform: rotate3d(1, 1, 0, 20deg);
			transform-style: preserve-3d;
		}

		.catalog__card:hover .catalog__card--title {
			box-shadow: 0px 0px 30px rgba($clr-teal, 0.9);
			border-top: 1px solid rgba($clr-teal, 0.2);
			border-bottom: 1px solid rgba($clr-teal, 0.2);
			color: $clr-text-main;
			min-width: 100%;
			width: fit-content;
			min-height: 4rem;
			// font-size: 2rem;
			font-size: calc(1vh + 1rem);

			padding: 2px 4px;
			text-shadow: -2px 2px 2px rgba($clr-teal, 0.9);

			transition: all 0.35s;

			transform: translateZ(50px) scale(1);
		}

		.catalog__card:hover::before {
			position: absolute;
			bottom: -2px;
			content: '';
			background: transparent;
			width: 0%;
			height: 0px;
			transition: all 0.5s;
		}
	}

	.catalog__card:active:not(.isHovered) {
		box-shadow: -4px 4px 2px 2px rgba(0, 0, 0, 0.3);
		outline: none;
		box-shadow: none;
		text-decoration: none;

		transition: all 0.1s;
		transform: rotate3d(0, 0, 0, 20deg);
		transform-style: preserve-3d;
	}

	.catalog__card:active:not(.isHovered) .catalog__card--title {
		backdrop-filter: blur(0px);
		box-shadow: none;
		border-top: none;
		border-bottom: none;
		color: rgba($clr-teal, 0.9);
		padding-top: 2px;
		padding-bottom: 2px;
		text-shadow: none;
		transition: all 0.35s;

		transform: translateZ(0px);
	}

	//=========================

	footer {
		padding: 1rem;
		margin: 0 auto;
		width: 100%;
		display: flex;
		flex-flow: row wrap;
		justify-content: space-around;
		align-items: center;
		background-color: transparent;
		padding-bottom: 1rem;
		@media screen and (max-width: 500px) {
			padding: 1rem;
			flex-flow: column-reverse wrap;
			gap: 0.5rem;
		}
		ul {
			margin-bottom: 1rem;
			@media screen and (max-width: 500px) {
				margin-top: 1rem;
			}
		}
		li {
			color: $clr-text-main;
			margin-bottom: 0.5rem;

			&:hover {
				color: $clr-text-main;
				transition: all 0.35s;
			}

			@media screen and (max-width: 500px) {
				text-align: center;
			}
		}
		.footer_logo {
			max-height: 100px;
			aspect-ratio: 1/1;
		}
		.slogan {
			max-width: fit-content;
		}
	}

	/* Состояние "Первого клика" для мобильных (через класс .isHovered ) */
	:global(.catalog__card.isHovered) {
		box-shadow: -4px 4px 2px 2px rgba($clr-pink, 0.5);
		outline: 4px solid $clr-pink;

		transition: box-shadow 0.05s;
		transition: all 0.5s;

		transform: rotate3d(1, 1, 0, 20deg);
		transform-style: preserve-3d;
	}

	:global(.catalog__card.isHovered .catalog__card--title) {
		box-shadow: 0px 0px 30px rgba($clr-teal, 0.9);
		border-top: 1px solid rgba($clr-teal, 0.2);
		border-bottom: 1px solid rgba($clr-teal, 0.2);
		color: $clr-text-main;
		min-width: 100%;
		width: fit-content;
		min-height: 4rem;
		// font-size: 2rem;
		font-size: calc(1vh + 1rem);

		padding: 2px 4px;
		text-shadow: -2px 2px 2px rgba($clr-teal, 0.9);

		transition: all 0.05s;

		transform: translateZ(50px) scale(1);
	}

	:global(.catalog__card.isHovered::before) {
		position: absolute;
		bottom: -2px;
		content: '';
		background: transparent;
		width: 0%;
		height: 0px;
		transition: all 0.5s;
	}
</style>
