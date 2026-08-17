<script>
	// @ts-ignore
	import { base } from '$app/paths';
	import BtnBack from '$lib/components/Btn/BtnBack.svelte';

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
</script>

<header class="header" id="top-anchor">
	<BtnBack />
	<h1 class="headerSlogan">Instruction for App.</h1>
</header>

<main class="homeTextPage faqPage">
	<section class="section">
		<div class="card">
			<a class="bigLink" href="{base}/instructionInterface">
				<h2>Getting Started</h2>
				<ul>
					<li>A .</li>
					<li>C .</li>
					<li>R .</li>
					<li>Q .</li>
					<li>Q .</li>
				</ul>
				<p class="learnMore">Get Started</p>
			</a>
		</div>
	</section>
</main>

<style lang="scss">
	.card {
		margin-bottom: 1rem;
		background-color: transparent;
		&:hover {
			box-shadow: $shadow-neon-coral;
			.learnMore {
				color: $clr-pink;
				border-right: 1px double $clr-pink;
				border-radius: 0.5rem;
			}
		}
		.bigLink {
			width: 100%;
			height: 100%;
		}
		.learnMore {
			text-align: right;
			margin-top: 0.5rem;
			padding: 0.5rem 2rem;
		}
	}
</style>
