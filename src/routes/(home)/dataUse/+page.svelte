<script>
	// src/routes/(home)/install/+page.svelte
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

<svelte:head>
	<meta name="robots" content="index,follow" />
	<title>tiri install</title>
</svelte:head>

<header class="header" id="top-anchor">
	<BtnBack />
	<h1 class="headerSlogan">Ваши данные в приложении</h1>
</header>

<main class="homeTextPage installPage">
	<h2>Удалить все данные с этого устройства</h2>
	<h2>Создать резервную копию данных на этом устройстве</h2>
	<h2>Сохранить резервную копию данных в облаке</h2>
	<h2>Миграция данных на другое устройство</h2>
</main>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	// src/styles/_homePages.scss
	.installPage {
		color: rgba($clr-text-main-rgb, 0.8);
		letter-spacing: 0.1rem;
	}
	.card h2 {
		color: $clr-teal-soft;
	}
</style>
