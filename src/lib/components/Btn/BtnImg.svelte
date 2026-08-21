<script>
	// src/lib/components/Btn/BtnImg.svelte

	/**
	 * @typedef {Object} Props
	 * @property {string} [src=''] - Путь к изображению без расширения
	 * @property {string} [alt=''] - Описание для accessibility
	 * @property {number|string} [size=64] - Размер кнопки в px
	 * @property {(() => void)|null} [onclick=null] - Обработчик клика
	 * @property {string} [customClass=''] - Дополнительные CSS-классы (без класса - в одном круге, .gender - снизу овал, .icon - в двойном круге, .notAction для .gender И .action для .icon - вид как при :active)
	 */

	/*
    Применение: 
      <BtnImg src={imgMale} alt="test btn img" size={64} onclick="null" customClass="gender" />
      <BtnImg src={imgCash} alt="test btn img" size={88} onclick="null" customClass="icon" />
      <BtnImg src={imgDate} alt="test btn img" size={44} onclick="null" customClass="" />
    */

	let { src = '', alt = '', size = 64, onclick = null, customClass = '' } = $props();

	let parsedSize = $derived.by(() => {
		const num = typeof size === 'number' ? size : parseFloat(size);
		if (isNaN(num) || num <= 0) return 64;
		return Math.round(num);
	});

	let basePath = $derived.by(() => {
		if (typeof src !== 'string') return '';
		return src.trim().replace(/\.(png|webp)$/i, '');
	});

	let webpSrc = $derived(basePath ? `${basePath}.webp` : '');
	let pngSrc = $derived(basePath ? `${basePath}.png` : '');
	let hasImage = $derived(basePath.length > 0);

	$effect(() => {
		if (!hasImage) return;
		const imgWebp = new Image();
		imgWebp.src = webpSrc;
		const imgPng = new Image();
		imgPng.src = pngSrc;
	});

	function handleClick(event) {
		if (typeof onclick === 'function') {
			onclick(event);
		}
	}
</script>

<button
	type="button"
	class="btn-img {customClass}"
	style="--btn-size: {parsedSize}px;"
	onclick={handleClick}
	aria-label={alt || null}
>
	<!-- 1. Конусный фон (только для .gender) -->
	<div class="cone-bg" aria-hidden="true"></div>

	<!-- 2. Овал / Круги -->
	<div class="oval">
		<div class="oval-outer" aria-hidden="true">
			<div class="oval-inner">
				<div class="bg-layer bg-hover"></div>
				<div class="bg-layer bg-active"></div>
			</div>
		</div>
	</div>

	<!-- 3. Изображение -->
	{#if hasImage}
		<picture class="picture-wrapper">
			<source srcset={webpSrc} type="image/webp" />
			<source srcset={pngSrc} type="image/png" />
			<img
				src={pngSrc}
				{alt}
				class="img-content"
				loading="eager"
				fetchpriority="high"
				decoding="sync"
			/>
		</picture>
	{/if}
</button>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	/* БАЗОВЫЕ СТИЛИ */
	.btn-img {
		position: relative;
		width: var(--btn-size);
		height: var(--btn-size);
		padding: 8px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		outline: none;
		cursor: pointer;
		user-select: none;
		box-sizing: border-box;
		border-radius: 50%;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			opacity 0.15s ease;
		-webkit-tap-highlight-color: transparent;

		.cone-bg {
			display: none;
		}
	}

	.picture-wrapper {
		position: relative;
		z-index: 3;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.img-content {
		width: 98%;
		height: auto;
		object-fit: contain;
		pointer-events: none;
	}

	.bg-layer {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	/* ==========================================================================
     1. DEFAULT РЕЖИМ (По умолчанию, когда нет .gender и .icon)
     Одно кольцо $clr-white, :hover -> $clr-teal, :active/.action -> неоморфизм
     ========================================================================== */
	.btn-img:not(.gender):not(.icon) {
		.oval {
			position: absolute;
			inset: 4px;
			z-index: 1;

			.oval-outer {
				width: 100%;
				height: 100%;
				border-radius: 50%;
				border: none; /* Внешний круг отключен */
				padding: 0;
			}

			.oval-inner {
				position: relative;
				width: 100%;
				height: 100%;
				border-radius: 50%;
				border: 2px solid $clr-white;
				box-sizing: border-box;
				overflow: hidden;
				transition: border-color 0.2s ease;
			}
		}

		.bg-hover {
			background: $clr-teal;
		}

		/* Hover */
		&:hover {
			.oval-inner {
				border-color: $clr-teal;
			}
			.bg-hover {
				opacity: 1;
			}
		}

		/* Active & Action (Неоморфизм) */
		&:active,
		&.action {
			transform: scale(0.95);
			box-shadow:
				inset 3px 3px 6px rgba(0, 0, 0, 0.45),
				inset -3px -3px 6px rgba(255, 255, 255, 0.15);

			.oval-inner {
				border-color: $clr-pink;
			}
			.bg-hover {
				opacity: 0;
			}
			.bg-active {
				opacity: 1;
				background: $clr-pink;
			}
		}
	}

	/* ==========================================================================
     2. РЕЖИМ .GENDER (Коррекция bottom под разницу размеров)
     ========================================================================== */
	.btn-img.gender {
		.cone-bg {
			display: block;
			position: absolute;
			inset: 4px;
			z-index: 1;
			opacity: 0;
			background: $clr-white;
			clip-path: polygon(50% 20%, 100% 70%, 80% 95%, 20% 95%, 0 70%);
			transition: opacity 0.2s ease;
			pointer-events: none;
		}

		.oval {
			width: 100%;
			position: absolute;
			left: 0;
			/* Динамический расчет сдвига овала в зависимости от --btn-size */
			bottom: 0;
			z-index: 2;

			.oval-outer {
				position: relative;
				width: 100%;
				aspect-ratio: 3 / 1;
				border-radius: 50%;
				border: 2px solid $clr-pink;
				padding: 2px;
				box-sizing: border-box;
				pointer-events: none;
				transition: border-color 0.2s ease;
			}

			.oval-inner {
				position: relative;
				width: 100%;
				height: 100%;
				border-radius: 50%;
				border: 2px solid $clr-teal;
				background: radial-gradient(circle at 50% 100%, $clr-teal 0%, $clr-white 100%);
				box-sizing: border-box;
				overflow: hidden;
				transition: border-color 0.2s ease;
			}
		}

		.bg-hover {
			background-color: $clr-white;
		}

		.bg-active {
			background: $clr-pink;
		}

		&:hover {
			.oval-outer,
			.oval-inner {
				border-color: $clr-teal;
			}
			.bg-hover,
			.cone-bg {
				opacity: 1;
			}
		}

		&:active,
		&.notAction {
			transform: scale(0.92);
			opacity: 0.5;

			.oval-outer,
			.oval-inner {
				border-color: $clr-pink;
			}
			.bg-hover {
				opacity: 0;
			}
			.bg-active {
				opacity: 1;
			}
			.cone-bg {
				opacity: 0;
			}
		}
	}

	/* ==========================================================================
     3. РЕЖИМ .ICON (Два кольца, неоморфизм при active/action)
     ========================================================================== */
	.btn-img.icon {
		.oval {
			position: absolute;
			inset: 4px;
			z-index: 1;

			.oval-outer {
				width: 100%;
				height: 100%;
				border-radius: 50%;
				border: 2px solid rgba(255, 255, 255, 0.6);
				padding: 3px;
				box-sizing: border-box;
				transition: border-color 0.2s ease;
			}

			.oval-inner {
				position: relative;
				width: 100%;
				height: 100%;
				border-radius: 50%;
				border: 2px solid rgba(255, 255, 255, 0.6);
				box-sizing: border-box;
				overflow: hidden;
				transition: border-color 0.2s ease;
			}
		}

		.bg-hover {
			background: radial-gradient(circle at 50% 50%, $clr-white 0%, $clr-teal 100%);
		}

		.bg-active {
			background: $clr-pink;
		}

		&:hover {
			.oval-outer,
			.oval-inner {
				border-color: $clr-teal;
			}
			.bg-hover {
				opacity: 1;
			}
		}

		&:active,
		&.action {
			transform: scale(0.95);
			box-shadow:
				inset 3px 3px 6px rgba(0, 0, 0, 0.45),
				inset -3px -3px 6px rgba(255, 255, 255, 0.15);

			.oval-outer,
			.oval-inner {
				border-color: $clr-pink;
			}
			.bg-hover {
				opacity: 0;
			}
			.bg-active {
				opacity: 1;
			}
		}
		&.notAction {
			transform: scale(0.92);
			opacity: 0.5;
		}
	}

	.btn-img:focus-visible {
		outline: 2px solid $clr-teal;
		outline-offset: 4px;
	}
</style>
