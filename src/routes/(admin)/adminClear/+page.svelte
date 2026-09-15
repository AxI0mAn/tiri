<!-- src/routes/(admin)/adminClear/+page.svelte -->
<script>
	// набор утилит для удминистрирования записей в хранилище
	import { onMount } from 'svelte';
	// @ts-ignore
	import { goto } from '$app/navigation';
	// @ts-ignore
	import { base } from '$app/paths';

	import { appStore } from '$lib/store/appStore.svelte.js';
	import BtnBack from '$lib/components/Btn/BtnBack.svelte';
	import BtnText from '$lib/components/Btn/BtnText.svelte';
	import BtnImg from '$lib/components/Btn/BtnImg.svelte';
	import { toastStore } from '$lib/store/toastStore.svelte.js';

	import { createReportsInRange } from '$lib/components/services/reportGenerator';
	import { CalculationsPeriod } from '$lib/components/services/calculationsPeriod.js';
	import { getReportsByMonth } from '$lib/utils/db.js';

	import ModalBackdrop from '$lib/components/aBlock/modal/ModalBackdrop.svelte';
	import Modal_ReportsProgress from '$lib/components/aBlock/modal/Modal_ReportsProgress.svelte';

	// ===== СОСТОЯНИЕ =====
	let password = $state('');
	let isAuthorized = $state(false);
	let logs = $state([]);
	let isProcessing = $state(false);

	// Состояния для блоков
	let dateZReport = $state('');
	let dateAllDay = $state('');

	// Состояния для массового создания отчётов
	// ===== БЛОК 1.5: Создание всех Z-отчётов за период =====
	let periodFromMonth = $state('');
	let periodFromYear = $state(new Date().getFullYear().toString());
	let periodToMonth = $state('');
	let periodToYear = $state(new Date().getFullYear().toString());

	// ===== Состояние прогресса =====
	let showProgressModal = $state(false);
	let progressPhase = $state('');
	let progressCurrent = $state(0);
	let progressTotal = $state(0);
	let progressDate = $state('');
	let abortRequested = $state(false);

	// ✅ Обработка прерывания
	function handleAbort() {
		abortRequested = true;
		addLog('🛑 Запрошено прерывание. Завершаем текущий день...', true);
	}

	// ===== ФУНКЦИИ =====
	function checkPassword() {
		// const today = new Date();
		// const day = String(today.getDate()).padStart(2, '0');
		// const month = String(today.getMonth() + 1).padStart(2, '0');
		// const year = today.getFullYear();
		// const correctPassword = `${day}${month}${year}`;

		let correctPassword = '';

		// ✅ Если ssap пустой — доступ сразу
		if (!appStore.ssap || appStore.ssap === '') {
			isAuthorized = true;
			addLog('✅ Пароль не требуется (ssap пустой). Доступ разрешён.');
			return;
		} else {
			correctPassword = appStore.ssap;
		}

		if (password === correctPassword) {
			isAuthorized = true;
			addLog('✅ Пароль верный. Доступ разрешён.');
			password = '';
		} else {
			addLog('❌ Неверный пароль. Доступ запрещён.');
			password = '';
		}
	}

	function addLog(message, isError = false) {
		const timestamp = new Date().toLocaleTimeString();
		logs = [{ time: timestamp, message, isError }, ...logs];
	}

	function clearLogs() {
		logs = [];
	}

	// ===== БЛОК 0: Оффлайн-готовность =====
	let offlineStatus = $state({
		checking: true,
		ready: false,
		updating: false,
		details: {
			swActive: false,
			cacheExists: false,
			cacheFiles: 0,
			indexCached: false,
			indexedDBAvailable: false
		}
	});

	// ===== БЛОК 0: Проверка оффлайн-готовности =====
	async function checkOfflineReadiness() {
		offlineStatus.checking = true;

		const details = {
			swActive: false,
			cacheExists: false,
			cacheFiles: 0,
			indexCached: false,
			indexedDBAvailable: false
		};

		try {
			// 1. Service Worker активен
			details.swActive = !!(
				typeof navigator !== 'undefined' &&
				navigator.serviceWorker &&
				navigator.serviceWorker.controller
			);

			// 2. Кэш существует
			if (typeof caches !== 'undefined') {
				const cacheNames = await caches.keys();
				details.cacheExists = cacheNames.length > 0;

				// 3. Ищем кэш с максимальным числом файлов
				if (details.cacheExists) {
					let bestCacheKeys = [];

					for (const name of cacheNames) {
						const cache = await caches.open(name);
						const keys = await cache.keys();
						if (keys.length > bestCacheKeys.length) {
							bestCacheKeys = [...keys];
						}
					}

					details.cacheFiles = bestCacheKeys.length;

					// 4. index.html или корень в кэше
					if (bestCacheKeys.length > 0) {
						details.indexCached = bestCacheKeys.some((req) => {
							const url = req.url;
							return (
								url.endsWith('/tiri/index.html') ||
								url === location.origin + '/tiri/' ||
								url.endsWith('/tiri/') ||
								url.includes('index.html')
							);
						});
					}
				}
			}

			// 5. IndexedDB доступен
			try {
				const db = await new Promise((resolve, reject) => {
					const req = indexedDB.open('LiveTiriDB');
					const timeout = setTimeout(() => reject(new Error('timeout')), 3000);
					req.onsuccess = () => {
						clearTimeout(timeout);
						resolve(req.result);
					};
					req.onerror = () => {
						clearTimeout(timeout);
						reject(req.error);
					};
				});
				details.indexedDBAvailable = !!db;
			} catch {
				details.indexedDBAvailable = false;
			}

			// ===== ИТОГ =====
			offlineStatus.details = details;
			offlineStatus.ready =
				details.swActive &&
				details.cacheExists &&
				details.cacheFiles >= 10 &&
				details.indexedDBAvailable;

			console.log('[checkOfflineReadiness] Результат:', details);
		} catch (error) {
			console.error('[checkOfflineReadiness] Ошибка:', error);
			offlineStatus.ready = false;
		} finally {
			offlineStatus.checking = false;
		}
	}

	// ===== БЛОК 1: Удалить Z-отчёт =====
	async function deleteZReport() {
		if (!isAuthorized) {
			addLog('❌ Введите пароль для выполнения действий.', true);
			return;
		}
		if (!dateZReport) {
			addLog('❌ Введите дату для удаления Z-отчёта.', true);
			return;
		}

		isProcessing = true;
		try {
			const { getReport_Z_date, deleteReport } = await import('$lib/utils/db.js');

			const report = await getReport_Z_date(dateZReport);
			if (!report) {
				addLog(`⚠️ Z-отчёт за ${dateZReport} не существует, поэтому не удалён.`, true);
				return;
			}

			// ✅ Удаляем Z-отчёт из report_day
			const deleted = await deleteReport('day', dateZReport);
			if (deleted) {
				addLog(`✅ Z-отчёт за ${dateZReport} успешно удалён.`);
				dateZReport = '';
			} else {
				addLog(`⚠️ Z-отчёт за ${dateZReport} не найден при удалении.`, true);
			}
		} catch (error) {
			console.error('[admin/clear] Ошибка:', error);
			addLog(`❌ Ошибка при удалении Z-отчёта: ${error.message}`, true);
		} finally {
			isProcessing = false;
		}
	}

	// ===== БЛОК 1.5: Создать Z-отчёты =====
	// Создать все отчёты за период от Дата1 до Дата2
	async function createAllReports() {
		if (!isAuthorized) {
			addLog('❌ Введите пароль для выполнения действий.', true);
			return;
		}

		// Валидация
		if (!periodFromMonth || !periodFromYear || !periodToMonth || !periodToYear) {
			addLog('❌ Заполните все поля периода (месяц и год).', true);
			return;
		}

		const fromMonth = String(periodFromMonth).padStart(2, '0');
		const toMonth = String(periodToMonth).padStart(2, '0');
		const fromYear = parseInt(periodFromYear, 10);
		const toYear = parseInt(periodToYear, 10);

		// Формируем даты начала и конца периода
		const startDate = `${fromYear}-${fromMonth}-01`;
		const lastDayOfToMonth = new Date(toYear, parseInt(toMonth, 10), 0).getDate();
		const endDate = `${toYear}-${toMonth}-${String(lastDayOfToMonth).padStart(2, '0')}`;

		// ✅ Проверка: Дата1 > Дата2
		if (startDate > endDate) {
			addLog(`❌ Дата начала (${startDate}) больше даты окончания (${endDate}).`, true);
			return;
		}

		// ✅ Инициализация
		abortRequested = false;
		progressPhase = 'Дневные Z-отчёты';
		progressCurrent = 0;
		progressTotal = 0;
		progressDate = '';
		showProgressModal = true;

		addLog(`🚀 Начинаем создание отчётов с ${startDate} по ${endDate}...`);

		try {
			const stats = await createReportsInRange({
				startDate,
				endDate,
				direction: 'forward',
				onProgress: (current, total, dateStr, phase) => {
					progressCurrent = current;
					progressTotal = total;
					progressDate = dateStr;
					if (phase) progressPhase = phase;
				},
				onLog: (message, isError) => addLog(message, isError),
				shouldStop: () => abortRequested,
				createMonthly: true
			});

			showProgressModal = false;

			// ===== ИТОГОВЫЕ ЛОГИ =====
			addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━');
			addLog(`🏁 Создание отчётов завершено!`);
			addLog(`✅ Создано Z-отчётов: ${stats.created}`);

			if (stats.skippedNoNotes > 0) {
				addLog(`⚠️ Пропущено (нет заметок): ${stats.skippedNoNotes}`);
			}
			if (stats.skippedHasReminders > 0) {
				addLog(`⚠️ Пропущено (есть напоминания): ${stats.skippedHasReminders}`, true);
			}
			if (stats.skippedExists > 0) {
				addLog(`⚠️ Пропущено (уже существует): ${stats.skippedExists}`);
			}
			if (stats.errors > 0) {
				addLog(`❌ Ошибок: ${stats.errors}`, true);
			}

			// ✅ Проблемные дни (с напоминаниями)
			if (stats.problemDays.length > 0) {
				addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━');
				addLog('⚠️ ДНИ С НАПОМИНАНИЯМИ (Z-отчёт НЕ создан):', true);
				for (const dateStr of stats.problemDays) {
					addLog(`   ❌ ${dateStr} — есть не выполненное напоминание!`, true);
				}
			}

			// ✅ Месяцы
			if (stats.months.size > 0) {
				addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━');
				addLog(`📊 Созданы X- и Z-отчёты за месяцы:`);
				for (const yearMonth of stats.months) {
					addLog(`   ✅ ${yearMonth}`);
				}
			}

			addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━');
		} catch (error) {
			console.error('[admin/clear] Ошибка:', error);
			addLog(`❌ Критическая ошибка: ${error.message}`, true);
			showProgressModal = false;
		}
	}

	// ===== БЛОК 1.5: Обновить X- и Z-отчёт этого месяца =====
	async function updateAllReportsThisMonth() {
		if (!isAuthorized) {
			addLog('❌ Введите пароль для выполнения действий.', true);
			return;
		}

		// ✅ Текущий календарный месяц
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const yearMonth = `${year}-${month}`;

		await updateMonthReports(yearMonth);
	}

	// ===== БЛОК 1.5: Обновить X- и Z-отчёт предыдущего месяца =====
	async function updateAllReportsPrewMonth() {
		if (!isAuthorized) {
			addLog('❌ Введите пароль для выполнения действий.', true);
			return;
		}

		// ✅ Предыдущий календарный месяц
		const now = new Date();
		now.setMonth(now.getMonth() - 1);
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const yearMonth = `${year}-${month}`;

		await updateMonthReports(yearMonth);
	}

	// ===== Общая логика обновления отчётов за месяц =====
	async function updateMonthReports(yearMonth) {
		// Показываем модалку прогресса
		abortRequested = false;
		progressPhase = `Обновление отчётов за ${yearMonth}`;
		progressCurrent = 0;
		progressTotal = 1;
		progressDate = yearMonth;
		showProgressModal = true;

		addLog(`🔄 Обновляем отчёты за ${yearMonth}...`);

		try {
			// 1. Загружаем дневные Z-отчёты за месяц
			const dayReports = await getReportsByMonth(yearMonth);

			if (dayReports.length === 0) {
				addLog(`⚠️ За ${yearMonth} нет дневных отчётов, пропускаем.`, true);
				showProgressModal = false;
				return;
			}

			// 2. Создаём X- и Z-отчёты
			const period = new CalculationsPeriod(yearMonth);
			const xReport = period.report_X_month(dayReports);
			const zReport = period.report_Z_month(dayReports);

			// 3. Сохраняем (перезаписываем)
			await period.save_X_month(xReport);
			await period.save_Z_month(zReport);

			// 4. Итог
			progressCurrent = 1;
			addLog(`✅ X- и Z-отчёты за ${yearMonth} обновлены (${dayReports.length} дней).`);
		} catch (error) {
			console.error('[admin/clear] Ошибка обновления:', error);
			addLog(`❌ Ошибка обновления за ${yearMonth}: ${error.message}`, true);
		} finally {
			showProgressModal = false;
		}
	}

	// ===== БЛОК 2: Удалить всё за день =====
	async function deleteAllDay() {
		if (!isAuthorized) {
			addLog('❌ Введите пароль для выполнения действий.', true);
			return;
		}
		if (!dateAllDay) {
			addLog('❌ Введите дату для удаления записей за день.', true);
			return;
		}

		isProcessing = true;
		try {
			const { getAllThisDayRecords, getReport_Z_date, deleteEntry, deleteReport } =
				await import('$lib/utils/db.js');

			const records = await getAllThisDayRecords(dateAllDay);
			const hasRecords = records.length > 0;

			const report = await getReport_Z_date(dateAllDay);
			const hasReport = !!report;

			if (!hasRecords && !hasReport) {
				addLog(`⚠️ За ${dateAllDay} нет записей и Z-отчёта. Ничего не удалено.`, true);
				return;
			}

			// 1. Удаляем записи (заметки и напоминания)
			let deletedCount = 0;
			if (hasRecords) {
				for (const record of records) {
					try {
						await deleteEntry(record.id);
						deletedCount++;
					} catch (e) {
						console.warn(`[deleteAllDay] Не удалось удалить ${record.id}:`, e);
					}
				}
			}

			// 2. Удаляем Z-отчёт
			if (hasReport) {
				await deleteReport('day', dateAllDay);
			}

			// 3. Отчёт
			let message = `✅ За ${dateAllDay} удалено:`;
			if (deletedCount > 0) message += ` ${deletedCount} записей;`;
			if (hasReport) message += ` Z-отчёт;`;
			addLog(message);
			dateAllDay = '';
		} catch (error) {
			console.error('[admin/clear] Ошибка:', error);
			addLog(`❌ Ошибка при удалении записей за день: ${error.message}`, true);
		} finally {
			isProcessing = false;
		}
	}

	// ===== СОСТОЯНИЕ МОДАЛКИ для БЛОК 3: Полный сброс=====
	let showResetModal = $state(false);

	// ===== БЛОК 3: Сброс настроек (открывает модалку) =====
	function openResetModal() {
		if (!isAuthorized) {
			addLog('❌ Введите пароль для выполнения действий.', true);
			return;
		}
		showResetModal = true;
	}

	// ===== БЛОК 3: Полный сброс (выполняется из модалки) =====
	async function confirmResetSettings() {
		showResetModal = false;

		if (!isAuthorized) {
			addLog('❌ Введите пароль для выполнения действий.', true);
			return;
		}

		isProcessing = true;
		try {
			const { crashData } = await import('$lib/utils/db.js');

			// 1. Очищаем localStorage
			const localStorageKeys = [
				'app_settings',
				'card_constructor_notes_v1',
				'card_constructor_reminds_v1',
				'draft_entry',
				'report_settings',
				'show_delete_btn_expiry' // тоже очищаем
			];
			let clearedLocal = 0;
			for (const key of localStorageKeys) {
				if (localStorage.getItem(key) !== null) {
					localStorage.removeItem(key);
					clearedLocal++;
				}
			}

			// 2. Очищаем IndexedDB через crashData
			await crashData();

			addLog(
				`✅ Сброс настроек выполнен. Очищено ${clearedLocal} ключей в localStorage и все данные в IndexedDB.`
			);
		} catch (error) {
			console.error('[admin/clear] Ошибка:', error);
			addLog(`❌ Ошибка при сбросе настроек: ${error.message}`, true);
		} finally {
			isProcessing = false;
		}
	}

	// ===== БЛОК 4: Показать кнопку удаления =====
	let deleteButtonActive = $state(false);
	let deleteButtonExpiry = $state('');

	// Проверка статуса при загрузке
	function checkDeleteButtonStatus() {
		if (typeof window === 'undefined') return;

		const expiry = localStorage.getItem('show_delete_btn_expiry');
		if (expiry) {
			const expiryTime = parseInt(expiry, 10);
			if (Date.now() < expiryTime) {
				deleteButtonActive = true;
				deleteButtonExpiry = new Date(expiryTime).toLocaleTimeString();
				return;
			}
		}
		deleteButtonActive = false;
		deleteButtonExpiry = '';
	}

	// Включить кнопку на 1 час
	function enableDeleteButton() {
		if (!isAuthorized) {
			addLog('❌ Введите пароль для выполнения действий.', true);
			return;
		}

		const expiryTime = Date.now() + 60 * 60 * 1000; // 1 час
		localStorage.setItem('show_delete_btn_expiry', String(expiryTime));
		deleteButtonActive = true;
		deleteButtonExpiry = new Date(expiryTime).toLocaleTimeString();
		addLog(`✅ Кнопка удаления включена до ${deleteButtonExpiry}`);
	}

	// ===== БЛОК 6: Резервное копирование =====
	let restoreFileInput = $state(null);
	let isBackupProcessing = $state(false);

	// Создать бэкап
	async function createBackup() {
		if (!isAuthorized) {
			addLog('❌ Введите пароль для выполнения действий.', true);
			return;
		}

		isBackupProcessing = true;
		addLog('💾 Создаём резервную копию...');

		try {
			const { downloadBackup } = await import('$lib/utils/db.js');
			const result = await downloadBackup();

			if (result.success) {
				addLog(`✅ ${result.message}`);
				addLog('📁 Файл сохранён в папку "Загрузки"');
				addLog(
					'⚠️ Старые копии в папке "Загрузки" не удаляются автоматически — удалите их вручную'
				);
			} else {
				addLog(`❌ ${result.message}`, true);
			}
		} catch (error) {
			console.error('[admin/clear] Ошибка бэкапа:', error);
			addLog(`❌ Критическая ошибка: ${error.message}`, true);
		} finally {
			isBackupProcessing = false;
		}
	}

	// Восстановить из бэкапа
	async function restoreBackup() {
		if (!isAuthorized) {
			addLog('❌ Введите пароль для выполнения действий.', true);
			return;
		}

		const file = restoreFileInput?.files?.[0];
		if (!file) {
			addLog('❌ Файл бэкапа не выбран.', true);
			return;
		}

		// Подтверждение
		const confirmed = confirm(
			'⚠️ ВНИМАНИЕ!\n\nВосстановление из бэкапа ПОЛНОСТЬЮ ЗАМЕНИТ все текущие данные в хранилище устройства!\n\nПродолжить?'
		);
		if (!confirmed) {
			addLog('⚠️ Восстановление отменено пользователем.');
			return;
		}

		isBackupProcessing = true;
		addLog(`📂 Читаем файл: ${file.name}...`);

		try {
			const text = await file.text();
			const backup = JSON.parse(text);

			addLog(`📦 Бэкап от ${backup.createdAt || 'неизвестно'}, версия БД: ${backup.version}`);

			const { restoreFromBackup } = await import('$lib/utils/db.js');
			const result = await restoreFromBackup(backup);

			if (result.success) {
				addLog(`✅ ${result.message}`);
				addLog('🔄 Рекомендуется перезагрузить страницу');
			} else {
				addLog(`❌ ${result.message}`, true);
			}
		} catch (error) {
			console.error('[admin/clear] Ошибка восстановления:', error);
			addLog(`❌ Ошибка чтения файла: ${error.message}`, true);
		} finally {
			isBackupProcessing = false;
			// Сбрасываем input
			if (restoreFileInput) restoreFileInput.value = '';
		}
	}

	onMount(() => {
		// ✅ Авто-авторизация
		if (!appStore.ssap || appStore.ssap === '') {
			isAuthorized = true;
		}

		// ✅ Проверка офлайн-готовности
		checkOfflineReadiness();

		// ✅ Проверка кнопки удаления
		checkDeleteButtonStatus();

		// ✅ Слушаем обновление SW
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				console.log('[adminClear] Новый SW активирован, перезагружаем...');
				offlineStatus.updating = true;
				offlineStatus.ready = false;
				offlineStatus.checking = false;

				setTimeout(() => {
					window.location.reload();
				}, 1500);
			});

			// ✅ Проверяем обновления сразу при монтировании
			navigator.serviceWorker.getRegistrations().then((regs) => {
				regs.forEach((reg) => reg.update());
			});
		}

		// ✅ Проверка обновлений каждые 300 минут
		const updateInterval = setInterval(
			() => {
				if ('serviceWorker' in navigator) {
					navigator.serviceWorker.getRegistrations().then((regs) => {
						regs.forEach((reg) => reg.update());
					});
				}
			},
			300 * 60 * 1000
		);

		// ✅ Проверка кнопки удаления каждые 10 минут
		const deleteBtnInterval = setInterval(
			() => {
				checkDeleteButtonStatus();
			},
			10 * 60 * 1000
		);

		// ✅ Очистка при размонтировании
		return () => {
			clearInterval(updateInterval);
			clearInterval(deleteBtnInterval);
		};
	});

	// ===== ОБРАБОТКА ENTER =====
	function handleKeyDown(e) {
		if (e.key === 'Enter') {
			checkPassword();
		}
	}
</script>

<div class="admin-clear-page">
	<!-- Шапка -->
	<header class="header">
		<BtnBack />
		<h1>🧹 Администрирование</h1>
	</header>

	<!-- Пароль -->
	<div class="block password-block">
		<h2>🔐 Пароль</h2>
		<p class="warning">Введите пароль для разблокировки всех действий.</p>
		<div class="password-row">
			<input
				type="password"
				placeholder="Введите пароль"
				bind:value={password}
				onkeydown={handleKeyDown}
				class="password-input"
				disabled={isAuthorized}
			/>
			<BtnText
				buttonText={isAuthorized ? '✅ Разблокировано' : '🔓 Разблокировать'}
				onclick={checkPassword}
				disabled={isAuthorized || isProcessing}
				customClass={isAuthorized ? 'btn-success' : 'btn-primary'}
			/>
		</div>
		{#if isAuthorized}
			<p class="success">✅ Доступ разрешён. Все кнопки активны.</p>
		{/if}
	</div>

	<!-- Блок 0: Оффлайн-готовность -->
	<div
		class="block offline-block"
		class:offline-ready={offlineStatus.ready && !offlineStatus.checking && !offlineStatus.updating}
		class:offline-not-ready={!offlineStatus.ready &&
			!offlineStatus.checking &&
			!offlineStatus.updating}
		class:offline-updating={offlineStatus.updating}
	>
		<h2>📡 Оффлайн-режим</h2>

		{#if offlineStatus.updating}
			<!-- ✅ СОСТОЯНИЕ: Обновление -->
			<div class="offline-indicator offline-blue">
				<div class="spinner-small spinner-blue"></div>
				<span class="offline-text">🔄 Загружается новая версия...</span>
			</div>
			<p class="offline-hint">
				Обновление уже готово. Страница перезагрузится автоматически через мгновение.
			</p>
		{:else if offlineStatus.checking}
			<!-- СОСТОЯНИЕ: Проверка -->
			<div class="offline-indicator offline-checking">
				<div class="spinner-small"></div>
				<span class="offline-text">Проверка готовности...</span>
			</div>
		{:else if offlineStatus.ready}
			<!-- СОСТОЯНИЕ: Готов к оффлайн -->
			<div class="offline-indicator offline-green">
				<div class="dot dot-green"></div>
				<span class="offline-text">Готов к оффлайн работе!</span>
			</div>
		{:else}
			<!-- СОСТОЯНИЕ: Только онлайн -->
			<div class="offline-indicator offline-red">
				<div class="dot dot-red"></div>
				<span class="offline-text">ТОЛЬКО ОНЛАЙН!</span>
			</div>
			<div class="offline-details">
				<p>Service Worker: <strong>{offlineStatus.details.swActive ? '✅' : '❌'}</strong></p>
				<p>Кэш существует: <strong>{offlineStatus.details.cacheExists ? '✅' : '❌'}</strong></p>
				<p>
					Файлов в кэше: <strong>{offlineStatus.details.cacheFiles}</strong>
					{#if offlineStatus.details.cacheFiles < 10}
						<span class="warn">(нужно ≥ 10)</span>
					{/if}
				</p>
				<p>
					IndexedDB доступен: <strong
						>{offlineStatus.details.indexedDBAvailable ? '✅' : '❌'}</strong
					>
				</p>
			</div>
		{/if}

		<div class="row">
			<BtnText
				buttonText="🔄 Проверить снова"
				onclick={checkOfflineReadiness}
				disabled={offlineStatus.checking || offlineStatus.updating || isProcessing}
				customClass="btn-check"
			/>
		</div>
	</div>

	<!-- Блок 1: Удалить Z-отчёт -->
	<div class="block danger-block">
		<h2>🗑️ Блок 1: Удалить Z-отчёт за день</h2>
		<p class="warning">
			⚠️ Удаляет Z-отчёт за указанную дату. Данные заметок и напоминаний сохраняются.
		</p>
		<div class="row">
			<input type="date" bind:value={dateZReport} class="date-input" />
			<BtnText
				buttonText="Удалить Z-отчёт"
				onclick={deleteZReport}
				disabled={!isAuthorized || isProcessing}
				customClass="btn-danger"
			/>
		</div>
	</div>

	<!-- Блок 1.5: Создать все Z-отчёты за период -->
	<div class="block">
		<h2>📊 Блок 1.5: Создать все Z-отчёты за период</h2>
		<p class="warning">
			⚠️ Создаёт Z-отчёты за каждый день периода, где есть заметки и нет напоминаний. Затем создаёт
			X- и Z-отчёты за каждый месяц периода.
		</p>
		<div class="row period-row">
			<label>С:</label>
			<input
				type="number"
				class="period-input-small"
				placeholder="ММ"
				bind:value={periodFromMonth}
				min="1"
				max="12"
			/>
			<input
				type="number"
				class="period-input-small"
				placeholder="ГГГГ"
				bind:value={periodFromYear}
				min="2020"
				max="2030"
			/>
			<label>По:</label>
			<input
				type="number"
				class="period-input-small"
				placeholder="ММ"
				bind:value={periodToMonth}
				min="1"
				max="12"
			/>
			<input
				type="number"
				class="period-input-small"
				placeholder="ГГГГ"
				bind:value={periodToYear}
				min="2020"
				max="2030"
			/>
		</div>
		<div class="row">
			<BtnText
				buttonText="Создать все Z-отчёты за выбранный период"
				onclick={createAllReports}
				disabled={!isAuthorized || isProcessing}
				customClass="btn-primary"
			/>
		</div>

		<!-- ✅  обновить текущий месяц -->
		<div class="annotation-spacer"></div>

		<!-- ✅ Аннотация -->

		<p class="warning">
			⚠️ Обновляет X- и Z-отчёты за текущий календарный месяц. Использует все имеющиеся дневные
			Z-отчёты за этот месяц.
		</p>

		<div class="annotation-spacer-small"></div>

		<!-- ✅ Кнопка: обновить текущий месяц -->
		<div class="row">
			<BtnText
				buttonText="🔄 Обновить отчёты этого месяца"
				onclick={updateAllReportsThisMonth}
				disabled={!isAuthorized || isProcessing}
				customClass="btn-warning"
			/>
		</div>

		<!-- ✅  обновить предыдущий месяц -->

		<div class="annotation-spacer"></div>

		<!-- ✅ Аннотация -->
		<p class="warning">
			⚠️ Обновляет X- и Z-отчёты за предыдущий календарный месяц. Использует все имеющиеся дневные
			Z-отчёты за этот месяц.
		</p>

		<div class="annotation-spacer-small"></div>

		<!-- ✅ Кнопка: обновить предыдущий месяц -->
		<div class="row">
			<BtnText
				buttonText="🔄 Обновить отчёты предыдущего месяца"
				onclick={updateAllReportsPrewMonth}
				disabled={!isAuthorized || isProcessing}
				customClass="btn-warning"
			/>
		</div>
	</div>

	<!-- Блок 1.6: Ссылка на все Z-отчёты -->
	<div class="block">
		<h2>🔗 Блок 1.6: Все Z-отчёты</h2>
		<p class="warning">Посмотреть все созданные Z-отчёты за всё время.</p>
		<a href="{base}/allZreports" class="link-reports"> 📊 Посмотреть все отчёты → </a>
	</div>

	<!-- Блок 2: Удалить всё за день -->
	<div class="block danger-block">
		<h2>💣 Блок 2: Удалить всё за день</h2>
		<p class="warning">
			⚠️ Удаляет ВСЕ заметки, напоминания и Z-отчёт за указанную дату. Действие необратимо!
		</p>
		<div class="row">
			<input type="date" bind:value={dateAllDay} class="date-input" />
			<BtnText
				buttonText="Удалить всё за день"
				onclick={deleteAllDay}
				disabled={!isAuthorized || isProcessing}
				customClass="btn-danger"
			/>
		</div>
	</div>

	<!-- Блок 3: Сброс настроек (кнопка открывает модалку) -->
	<div class="block danger-block">
		<h2>🔥 Блок 3: Сброс настроек</h2>
		<p class="warning">
			⚠️ Удаляет ВСЕ данные приложения: localStorage и IndexedDB. Приложение вернётся к состоянию
			"как в первый раз".
		</p>
		<div class="row">
			<BtnText
				buttonText="Сброс настроек"
				onclick={openResetModal}
				disabled={!isAuthorized || isProcessing}
				customClass="btn-danger"
			/>
		</div>
	</div>

	<!-- Модалка подтверждения сброса -->
	<ModalBackdrop isOpen={showResetModal} maxWidth="420px">
		{#snippet children()}
			<div class="modal-reset">
				<div class="modal-icon">🔥</div>
				<h2>ПОДТВЕРЖДЕНИЕ СБРОСА</h2>
				<p class="modal-warning">
					Вы собираетесь <strong>полностью удалить ВСЕ данные</strong> приложения:
				</p>
				<ul class="modal-list">
					<li>📦 Все заметки и напоминания (IndexedDB)</li>
					<li>📊 Все Z-отчёты (IndexedDB)</li>
					<li>⚙️ Все настройки (localStorage)</li>
					<li>🔧 Конструкторы заметок и напоминаний</li>
					<li>📝 Черновики</li>
				</ul>
				<p class="modal-danger">
					⚠️ <strong>ЭТО ДЕЙСТВИЕ НЕОБРАТИМО!</strong><br />
					Все данные будут удалены без возможности восстановления.
				</p>
				<div class="modal-actions">
					<BtnText
						buttonText="Отменить"
						onclick={() => {
							showResetModal = false;
						}}
						customClass="btn-cancel-modal"
					/>
					<BtnText
						buttonText="Полный сброс"
						onclick={confirmResetSettings}
						disabled={isProcessing}
						customClass="btn-confirm-reset"
					/>
				</div>
			</div>
		{/snippet}
	</ModalBackdrop>

	<!-- Блок 4: Показать кнопку удаления -->
	<div class="block danger-block">
		<h2>🔧 Блок 4: Показать кнопку удаления</h2>
		<p class="warning">
			⚠️ Включает кнопку 🗑️ в карточках записей (ShowCard.svelte) на <strong>1 час</strong>. После
			этого кнопка снова скроется.
		</p>
		<div class="row">
			<BtnText
				buttonText="Показать кнопку удаления на 1 час"
				onclick={enableDeleteButton}
				disabled={!isAuthorized || isProcessing}
				customClass="btn-warning"
			/>
			{#if deleteButtonActive}
				<span class="badge badge-active">✅ Активна до: {deleteButtonExpiry}</span>
			{:else}
				<span class="badge badge-inactive">⏳ Неактивна</span>
			{/if}
		</div>
	</div>

	<!-- Блок 6: Резервное копирование -->
	<div class="block backup-block">
		<h2>💾 Блок 6: Резервное копирование</h2>
		<p class="warning">
			⚠️ Создать резервную копию всех данных (заметки, напоминания, отчёты) или восстановить из
			ранее сохранённого файла. Восстановление <strong>ПОЛНОСТЬЮ ЗАМЕНИТ</strong> текущие данные!
		</p>

		<div class="backup-row">
			<!-- Создать бэкап -->
			<BtnText
				buttonText="💾 Сделать резервную копию"
				onclick={createBackup}
				disabled={!isAuthorized || isBackupProcessing}
				customClass="btn-backup"
			/>
		</div>

		<div class="backup-row">
			<!-- Восстановить -->
			<input
				type="file"
				accept=".json,application/json"
				bind:this={restoreFileInput}
				class="file-input"
				disabled={!isAuthorized || isBackupProcessing}
			/>
			<BtnText
				buttonText="📂 Установить данные из резервной копии"
				onclick={restoreBackup}
				disabled={!isAuthorized || isBackupProcessing}
				customClass="btn-restore"
			/>
		</div>
	</div>

	<!-- Блок 5: Отчёт -->
	<div class="block log-block">
		<div class="log-header">
			<h2>📋 Отчёт о действиях</h2>
			<BtnText
				buttonText="Очистить логи"
				onclick={clearLogs}
				customClass="btn-secondary"
				disabled={isProcessing}
			/>
		</div>
		<div class="log-container">
			{#if logs.length === 0}
				<p class="log-empty">Нет записей. Выполните действие для получения отчёта.</p>
			{:else}
				{#each logs as log}
					<div class="log-item" class:log-error={log.isError}>
						<span class="log-time">{log.time}</span>
						<span class="log-message">{log.message}</span>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Модалка прогресса создания отчётов за выбранный период -->
	<Modal_ReportsProgress
		bind:isOpen={showProgressModal}
		phase={progressPhase}
		current={progressCurrent}
		total={progressTotal}
		currentDate={progressDate}
		canAbort={!abortRequested}
		onAbort={handleAbort}
	/>
</div>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;
	.admin-clear-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		max-height: 100vh;
		background: var(--clr-bg-primary, #f5f5f5);
		overflow: auto;
		padding-bottom: 3rem;
	}

	.header {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		background: var(--clr-bg-card, #ffffff);
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		min-height: 56px;
	}

	.header h1 {
		flex: 1;
		margin: 0;
		font-size: 20px;
		font-weight: 600;
		color: var(--clr-text-primary, #1a1a1a);
	}

	/* Общие стили для блоков */
	.block {
		background: var(--clr-bg-card, #ffffff);
		border-radius: 12px;
		padding: 16px 20px;
		margin: 8px 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		flex-shrink: 0;
	}

	.block h2 {
		margin: 0 0 8px 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--clr-text-primary, #1a1a1a);
	}

	.block .warning {
		margin: 0 0 12px 0;
		font-size: 13px;
		color: var(--clr-text-secondary, #666);
		line-height: 1.4;
	}

	/* Пароль */
	.password-block {
		border-left: 4px solid var(--clr-teal, #0d9488);
	}

	.password-row {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
	}

	.password-input {
		flex: 1;
		min-width: 180px;
		padding: 8px 12px;
		border: 1px solid var(--clr-border, #ddd);
		border-radius: 8px;
		font-size: 14px;
		background: var(--clr-bg-primary, #f5f5f5);
	}

	.password-input:focus {
		outline: none;
		border-color: var(--clr-teal, #0d9488);
	}

	.password-input:disabled {
		opacity: 0.6;
	}

	.success {
		margin: 8px 0 0 0;
		font-size: 14px;
		color: var(--clr-teal, #0d9488);
		font-weight: 500;
	}

	/* Опасные блоки */
	.danger-block {
		border-left: 4px solid var(--clr-error, #e74c3c);
	}

	.row {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
	}

	.date-input {
		padding: 8px 12px;
		border: 1px solid var(--clr-border, #ddd);
		border-radius: 8px;
		font-size: 14px;
		background: var(--clr-bg-primary, #f5f5f5);
		min-width: 160px;
	}

	.date-input:focus {
		outline: none;
		border-color: var(--clr-teal, #0d9488);
	}

	/* Логи */
	.log-block {
		flex: 1;
		min-height: 200px; /* ← увеличил */
		max-height: 400px; /* ← ограничиваем, чтобы не занимал всё */
		display: flex;
		flex-direction: column;
		border-left: 4px solid var(--clr-info, #3b82f6);
		margin-bottom: 16px;
		overflow: hidden;
	}

	.log-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-shrink: 0;
	}

	.log-header h2 {
		margin: 0;
	}

	.log-container {
		flex: 1;
		overflow-y: auto;
		margin-top: 8px;
		padding: 4px 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-height: 100px; /* ← чтобы было видно */
		max-height: 250px; /* ← скролл при превышении */
	}

	.log-container::-webkit-scrollbar {
		width: 4px;
	}

	.log-container::-webkit-scrollbar-thumb {
		background: var(--clr-scrollbar, #ccc);
		border-radius: 2px;
	}

	.log-empty {
		color: var(--clr-text-secondary, #999);
		font-size: 14px;
		text-align: center;
		padding: 20px 0;
	}

	.log-item {
		display: flex;
		gap: 12px;
		padding: 6px 12px;
		border-radius: 6px;
		background: var(--clr-bg-primary, #f5f5f5);
		font-size: 14px;
		flex-shrink: 0;
	}

	.log-item.log-error {
		background: var(--clr-error-light, #fde8e8);
	}

	.log-time {
		flex-shrink: 0;
		color: var(--clr-text-secondary, #888);
		font-size: 12px;
		font-weight: 500;
	}

	.log-message {
		flex: 1;
		color: var(--clr-text-primary, #1a1a1a);
		word-break: break-word;
	}

	.badge {
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 13px;
		font-weight: 500;
	}

	.badge-active {
		background: var(--clr-teal-soft, #e6f5f0);
		color: var(--clr-teal, #0d9488);
	}

	.badge-inactive {
		background: var(--clr-bg-primary, #f0f0f0);
		color: var(--clr-text-secondary, #888);
	}

	/* Стили для модалки */
	.modal-reset {
		background: var(--clr-bg-card, #ffffff);
		border-radius: 16px;
		padding: 32px 24px 24px;
		text-align: center;
		max-width: 420px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.modal-icon {
		font-size: 48px;
		margin-bottom: 12px;
	}

	.modal-reset h2 {
		margin: 0 0 16px 0;
		font-size: 1rem;
		color: var(--clr-text-primary, #1a1a1a);
	}

	.modal-warning {
		margin: 0 0 12px 0;
		font-size: 15px;
		color: var(--clr-text-secondary, #555);
		line-height: 1.5;
	}

	.modal-list {
		text-align: left;
		margin: 12px 0 16px 0;
		padding-left: 20px;
		font-size: 14px;
		color: var(--clr-text-secondary, #555);
		list-style: none;
	}

	.modal-list li {
		padding: 4px 0;
	}

	.modal-danger {
		margin: 0 0 24px 0;
		font-size: 15px;
		color: var(--clr-error, #e74c3c);
		line-height: 1.6;
		padding: 12px;
		background: var(--clr-error-light, #fde8e8);
		border-radius: 8px;
	}

	.modal-actions {
		display: flex;
		gap: 12px;
		justify-content: center;
	}

	.modal-actions :global(.btn-cancel-modal) {
		background: var(--clr-bg-primary, #f0f0f0) !important;
		color: var(--clr-text-primary, #1a1a1a) !important;
		padding: 10px 32px !important;
		border-radius: 10px !important;
	}

	.modal-actions :global(.btn-confirm-reset) {
		background: var(--clr-error, #e74c3c) !important;
		color: white !important;
		padding: 10px 32px !important;
		border-radius: 10px !important;
	}

	.modal-actions :global(.btn-confirm-reset):hover:not(:disabled) {
		background: var(--clr-error-dark, #c0392b) !important;
	}

	/* ===== Период ===== */
	.period-row {
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.period-row label {
		font-weight: 600;
		font-size: 14px;
		color: var(--clr-text-main);
	}

	.period-input-small {
		width: 60px;
		padding: 8px 6px;
		margin-bottom: 1rem;
		border: 1px solid var(--clr-border, #ddd);
		border-radius: 8px;
		font-size: 14px;
		text-align: center;
		background: var(--clr-bg-primary, #f5f5f5);
	}

	.period-input-small:focus {
		outline: none;
		border-color: var(--clr-teal, #0d9488);
	}

	/* ✅ Отступы для аннотаций */
	.annotation-spacer {
		height: 1.5rem;
	}

	.annotation-spacer-small {
		height: 1rem;
	}

	/* ✅ Стиль для кнопки "Обновить" */
	:global(.btn-warning) {
		background: var(--clr-warning, #f59e0b) !important;
		color: white !important;
		padding: 10px 20px !important;
		border-radius: 10px !important;
		font-weight: 600 !important;
	}

	:global(.btn-warning:hover:not(:disabled)) {
		background: var(--clr-warning-dark, #d97706) !important;
	}

	:global(.btn-warning:disabled) {
		opacity: 0.5 !important;
		cursor: not-allowed !important;
	}

	/* ===== Ссылка на все Z-отчёты ===== */
	.link-reports {
		display: inline-block;
		padding: 10px 20px;
		background: var(--clr-teal, #0d9488);
		color: white;
		text-decoration: none;
		border-radius: 10px;
		font-weight: 600;
		transition: background 0.2s;
	}

	.link-reports:hover {
		background: var(--clr-teal-dark, #0f766e);
	}

	/* ===== Блок 6: Бэкап ===== */
	.backup-block {
		border-left: 4px solid var(--clr-info, #3b82f6);
	}

	.backup-row {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: 8px;
	}

	.backup-row:last-child {
		margin-bottom: 0;
	}

	.file-input {
		padding: 8px 12px;
		border: 1px solid var(--clr-border, #ddd);
		border-radius: 8px;
		font-size: 14px;
		background: var(--clr-bg-primary, #f5f5f5);
		max-width: 250px;
	}

	.file-input:focus {
		outline: none;
		border-color: var(--clr-teal, #0d9488);
	}

	/* ===== Блок 0: Оффлайн ===== */
	.offline-block {
		border-left: 4px solid var(--clr-border, #ddd);
		transition: border-color 0.3s ease;
	}

	.offline-block.offline-ready {
		border-left-color: var(--clr-success, #22c55e);
	}

	.offline-block.offline-not-ready {
		border-left-color: var(--clr-error, #e74c3c);
	}

	.offline-indicator {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 20px;
		border-radius: 12px;
		margin-bottom: 12px;
		font-size: 16px;
		font-weight: 700;
	}

	.offline-indicator.offline-checking {
		background: var(--clr-bg-primary, #f5f5f5);
		color: var(--clr-text-secondary, #666);
	}

	.offline-indicator.offline-green {
		background: rgba(34, 197, 94, 0.1);
		color: var(--clr-success, #22c55e);
	}

	.offline-indicator.offline-red {
		background: rgba(231, 76, 60, 0.1);
		color: var(--clr-error, #e74c3c);
	}

	.offline-text {
		flex: 1;
	}

	.dot {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.dot-green {
		background: var(--clr-success, #22c55e);
		box-shadow: 0 0 12px rgba(34, 197, 94, 0.6);
		animation: pulse-green 2s ease-in-out infinite;
	}

	.dot-red {
		background: var(--clr-error, #e74c3c);
		box-shadow: 0 0 12px rgba(231, 76, 60, 0.6);
	}

	@keyframes pulse-green {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.6;
			transform: scale(1.1);
		}
	}

	.spinner-small {
		width: 24px;
		height: 24px;
		border: 3px solid rgba(0, 0, 0, 0.1);
		border-top-color: var(--clr-teal, #0d9488);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.offline-details {
		background: var(--clr-bg-primary, #f5f5f5);
		border-radius: 8px;
		padding: 12px 16px;
		margin-bottom: 12px;
		font-size: 13px;
		color: var(--clr-text-secondary, #666);
	}

	.offline-details p {
		margin: 4px 0;
	}

	.offline-details .warn {
		color: var(--clr-error, #e74c3c);
		font-size: 12px;
		margin-left: 4px;
	}

	/* Синее состояние — обновление */
	.offline-block.offline-updating {
		border-left-color: var(--clr-info, #3b82f6);
	}

	.offline-indicator.offline-blue {
		background: rgba(59, 130, 246, 0.1);
		color: var(--clr-info, #3b82f6);
	}

	.spinner-blue {
		border-color: rgba(59, 130, 246, 0.2);
		border-top-color: var(--clr-info, #3b82f6);
	}

	.offline-hint {
		font-size: 13px;
		color: var(--clr-text-secondary, #666);
		margin: 0 0 12px 0;
		text-align: center;
	}

	:global(.btn-check) {
		background: var(--clr-info, #3b82f6) !important;
		color: white !important;
		padding: 8px 16px !important;
		border-radius: 10px !important;
		font-weight: 600 !important;
	}

	:global(.btn-backup) {
		background: var(--clr-info, #3b82f6) !important;
		color: white !important;
		padding: 10px 20px !important;
		border-radius: 10px !important;
		font-weight: 600 !important;
	}

	:global(.btn-restore) {
		background: var(--clr-warning, #f59e0b) !important;
		color: white !important;
		padding: 10px 20px !important;
		border-radius: 10px !important;
		font-weight: 600 !important;
	}

	:global(.btn-warning) {
		background: var(--clr-warning, #f59e0b) !important;
		color: white !important;
	}

	:global(.btn-warning):hover:not(:disabled) {
		background: var(--clr-warning-dark, #d97706) !important;
	}

	/* Кнопки */
	:global(.btn-primary) {
		background: var(--clr-teal, #0d9488) !important;
		color: white !important;
	}

	:global(.btn-success) {
		background: var(--clr-teal, #0d9488) !important;
		color: white !important;
		opacity: 0.7 !important;
		cursor: default !important;
	}

	:global(.btn-danger) {
		background: var(--clr-error, #e74c3c) !important;
		color: white !important;
	}

	:global(.btn-danger):hover:not(:disabled) {
		background: var(--clr-error-dark, #c0392b) !important;
	}

	:global(.btn-secondary) {
		background: var(--clr-bg-primary, #f0f0f0) !important;
		color: var(--clr-text-primary, #1a1a1a) !important;
	}

	/* Адаптив */
	@media (max-width: 600px) {
		.admin-clear-page {
			overflow-y: auto;
		}

		.block {
			margin: 6px 12px;
			padding: 12px 16px;
		}

		.row {
			flex-direction: column;
			align-items: stretch;
		}

		.date-input,
		.password-input {
			width: 100%;
			min-width: auto;
		}

		.password-row {
			flex-direction: column;
		}

		.log-item {
			flex-direction: column;
			gap: 2px;
		}
	}
</style>
