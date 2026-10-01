<script>
	import Advertisement from '$lib/components/advertisement/advertisement.svelte';

	import srcWebp0 from '$lib/assets/banerVert916/ascetxtVert.webp';
	import srcWebp2 from '$lib/assets/banerVert916/pazVert3.webp';
	import srcWebpTiri from '$lib/assets/banerVert916/fotoVert.webp';

	const banersPageLeft = [
		{
			link: '#',
			alt: 'tiri',
			src: {
				webp: srcWebpTiri
			}
		}
		// {
		// 	link: 'https://axi0man.github.io/ascetxt/',
		// 	alt: 'txt note',
		// 	src: {
		// 		webp: srcWebp0,
		// 	}
		// },
		// {
		// 	link: 'https://axi0man.github.io/axI0_Puzzle/',
		// 	alt: 'Puzzle banner',
		// 	src: {
		// 		webp: srcWebp2,
		// 	}
		// }
	];

	import srcWebpR1 from '$lib/assets/banerVert916/calcAllVert.webp';
	import srcWebpR2 from '$lib/assets/banerVert916/calcEnginVert.webp';
	import srcWebpR3 from '$lib/assets/banerVert916/calcFractVert.webp';
	import srcWebpR4 from '$lib/assets/banerVert916/calcTrigVert.webp';

	const banersPageRight = [
		{
			link: 'https://axi0man.github.io/axio_calcul/',
			alt: 'Calculator banner',
			src: {
				webp: srcWebpR1
			}
		},
		{
			link: 'https://axi0man.github.io/axio_calcul/engineer/',
			alt: 'Calculator banner',
			src: {
				webp: srcWebpR2
			}
		},
		{
			link: 'https://axi0man.github.io/axio_calcul/fraction/',
			alt: 'Calculator banner',
			src: {
				webp: srcWebpR3
			}
		},
		{
			link: 'https://axi0man.github.io/axio_calcul/trigonometry/',
			alt: 'Calculator banner',
			src: {
				webp: srcWebpR4
			}
		}
	];

	let { setBanners = '1' } = $props();

	// Реактивно вычисляем нужный массив баннеров при изменении пропса
	let bannerSet = $derived(setBanners === '1' ? banersPageLeft : banersPageRight);
</script>

<Advertisement
	baners={bannerSet}
	customClass="vertBaner"
	effect="EffectLeftRight"
	interval="7000"
/>
