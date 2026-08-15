
/**
 * src/lib/config/mathMenuMaps.js
 * Это Реестр существующих вариантов страниц для группы математических страниц для переключения в <details> в правом верхнем углу - как быстрый переход к другому калькулятору внутри группы
 * инструкция в /home/daxio/Desktop/Link to Projects/svelte5doc/assets/CODING/Система динамических меню и анимаций.docx
*/

// import mathBasicWebp from '$lib/assets/iconPic/64/png_math_basic.webp';
// import mathBasicJpeg from '$lib/assets/iconPic/64/png_math_basic.jpeg';
// import mathEngineerWebp from '$lib/assets/iconPic/64/png_math_engineer.webp';
// import mathEngineerJpeg from '$lib/assets/iconPic/64/png_math_engineer.jpeg';
// import mathTrigonometryWebp from '$lib/assets/iconPic/64/png_math_trigonometry.webp';
// import mathTrigonometryJpeg from '$lib/assets/iconPic/64/png_math_trigonometry.jpeg';
// import srcFraction_jpeg from '$lib/assets/iconPic/64/png_Fraction.jpeg';
// import srcFraction_webp from '$lib/assets/iconPic/64/png_Fraction.webp';


// export const menuMaps = {
//   math: [
//     {
//       name: 'BASIC', // ДОЛЖЕН СОВПАДАТЬ С 	appState.now_mode = 'BASIC'; НА СТРАНИЦЕ src/routes/(math)/basic/+page.svelte
//       href: '/basic',
//       img: {
//         webp: mathBasicWebp,
//         jpeg: mathBasicJpeg
//       }
//     },
//     {
//       name: 'ENGINEER',
//       href: '/engineer',
//       img: {
//         webp: mathEngineerWebp,
//         jpeg: mathEngineerJpeg
//       }
//     },
//     {
//       name: 'TRIGONOMETRY',
//       href: '/trigonometry',
//       img: {
//         webp: mathTrigonometryWebp,
//         jpeg: mathTrigonometryJpeg
//       }
//     },
//     {
//       name: 'FRACTION',
//       href: '/fraction',
//       img: {
//         webp: srcFraction_jpeg,
//         jpeg: srcFraction_webp
//       }
//     },
//   ],
//   geometry: []
// };


/**
 * Применение в src/routes/+layout.svelte
 *
 * в <script>
 *  // ============ плавные переходы для работы QuickMenu.svelte
  import { menuMaps } from '$lib/config/mathMenuMaps';
  // АВТОМАТИЧЕСКАЯ ЛОГИКА:
  // 1. Берем все массивы из menuMaps (basic, engineer, и т.д.)
  // 2. Объединяем их в один плоский массив .flat()
  // 3. Проверяем, есть ли текущий путь в этом списке
  let isGroupPage = $derived(
    Object.values(menuMaps)
      .flat()
      .some((item) => item.href === $page.url.pathname)
  );
  // КАСТОМНЫЙ ПЕРЕХОД: Blur + Fade
  function blurFade(node, { duration = 300, delay = 0, amount = 10 }) {
    return {
      delay,
      duration,
      easing: cubicInOut,
      css: (t) => {
        // t — это число от 0 до 1 (прогресс анимации)
        // Нам нужно, чтобы при t=0 (начало) было размытие и прозрачность,
        // а при t=1 (конец) — четкость и полная видимость.
        return `
          opacity: ${t};
          filter: blur(${(1 - t) * amount}px);
        `;
      }
    };
  }

  в вёрстке
  {#key $page.url.pathname}
  <div
    class="page-wrapper"
    class:animating={isGroupPage}
    in:blurFade={{
      duration: isGroupPage ? 200 : 0,
      delay: isGroupPage ? 100 : 0,
      amount: 6
    }}
    out:blurFade={{
      duration: isGroupPage ? 50 : 0,
      amount: 12
    }}
  >
    {@render children()}
  </div>
{/key}
 */