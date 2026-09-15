// vite.config.js

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';
import autoprefixer from 'autoprefixer';
// import { SvelteKitPWA } from '@vite-pwa/sveltekit';  - PWA не работает оффлайн
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate', // Автообновление при появлении новой версии
			// injectRegister: null, // Мы регистрируем вручную в +layout.svelte, это надежнее
			injectRegister: 'auto', // Автоматически регистрировать SW и следить за обновлениями
			manifest: false, //  манифест из static
			// outDir: 'build',              //  куда положить sw.js
			// buildBase: '/tiri/',          // base для GitHub Pages
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,json,jpg,jpeg}'],
				skipWaiting: true,        // Не ждать закрытия вкладок
				clientsClaim: true,       // Сразу перехватывать управление
				cleanupOutdatedCaches: true, // Удалять старые кэши
				// Для GitHub Pages меняем на полный путь
				navigateFallback: '/tiri/index.html',
				navigateFallbackAllowlist: [/^(?!\/__).*/],
			},
			devOptions: {
				enabled: false, // Оставляем false для тестов Lighthouse!
				type: 'module',
				suppressWarnings: true
			},
			// ✅ ВАЖНО: указать правильные пути
			// srcDir: 'src',
			// filename: 'service-worker.js',
			// strategies: 'generateSW',
			// injectManifest: {},
			// ✅ Для SvelteKit нужен интеграционный путь
			// kit: {
			// 	includeVersionFile: true,
			// },
		})
	],

	resolve: {
		alias: {
			//   алиас
			'$utils': path.resolve('./src/lib/components/utils'),
		},
	},

	server: {
		// Возвращаем твою оптимизацию
		watch: {
			ignored: ['**/node_modules/**']
		}
	},

	css: {
		postcss: {
			plugins: [
				// Твоя точная настройка автопрефиксера
				autoprefixer({
					overrideBrowserslist: ['last 2 versions', 'not dead']
				})
			],
		},

		preprocessorOptions: {
			scss: {
				// Твой исправленный и надежный способ импорта
				additionalData: `
          @use "${path.resolve('src/styles/variables').replace(/\\/g, '/')}" as *;
          @use "${path.resolve('src/styles/mixins').replace(/\\/g, '/')}" as *;
        `
			}
		},

		//   Настройки CSS-модулей
		modules: {
			localsConvention: 'camelCase',
			generateScopedName: '[name]__[local]--[hash:base64:5]',
		},
	},

	// Добавим это для уменьшения веса билда (из прошлых советов)
	build: {
		sourcemap: false,
		minify: 'terser'
	}
});