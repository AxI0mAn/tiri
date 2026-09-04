<!-- src/routes/admin/clear/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	// @ts-ignore
	import { goto } from '$app/navigation';
	// @ts-ignore
	import { base } from '$app/paths';
	import BtnBack from '$lib/components/Btn/BtnBack.svelte';
	import BtnText from '$lib/components/Btn/BtnText.svelte';
	import { toastStore } from '$lib/store/toastStore.svelte.js';

	import ModalBackdrop from '$lib/components/aBlock/modal/ModalBackdrop.svelte';

	// ===== СОСТОЯНИЕ =====
	let password = $state('');
	let isAuthorized = $state(false);
	let logs = $state([]);
	let isProcessing = $state(false);

	// Состояния для блоков
	let dateZReport = $state('');
	let dateAllDay = $state('');

	// ===== ФУНКЦИИ =====
	function checkPassword() {
		const today = new Date();
		const day = String(today.getDate()).padStart(2, '0');
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const year = today.getFullYear();
		const correctPassword = `${day}${month}${year}`; // "04092026"

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
			const { getReport_Z_date, saveReport } = await import('$lib/utils/db.js');

			const report = await getReport_Z_date(dateZReport);
			if (!report) {
				addLog(`⚠️ Z-отчёт за ${dateZReport} не существует, поэтому не удалён.`, true);
				return;
			}

			// Сохраняем пустой объект (удаляем)
			await saveReport('day', dateZReport, {
				dateStr: dateZReport,
				yearMonth: dateZReport.slice(0, 7),
				payments: {
					gross: 0,
					summary: 0,
					allGive: 0,
					nowGive: 0,
					moreGive: 0,
					changeGive: 0,
					tips: 0,
					my: 0,
					allMy: 0
				},
				clients: {
					heads: 0,
					pass: 0,
					male: 0,
					male_bearded: 0,
					female: 0,
					colorist: 0,
					child: 0
				}
			});

			addLog(`✅ Z-отчёт за ${dateZReport} успешно удалён.`);
			dateZReport = '';
		} catch (error) {
			console.error('[admin/clear] Ошибка:', error);
			addLog(`❌ Ошибка при удалении Z-отчёта: ${error.message}`, true);
		} finally {
			isProcessing = false;
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
			const { getAllThisDayRecords, getReport_Z_date, saveEntry, saveReport } =
				await import('$lib/utils/db.js');

			// 1. Проверяем, есть ли записи
			const records = await getAllThisDayRecords(dateAllDay);
			const hasRecords = records.length > 0;

			// 2. Проверяем Z-отчёт
			const report = await getReport_Z_date(dateAllDay);
			const hasReport = !!report;

			if (!hasRecords && !hasReport) {
				addLog(`⚠️ За ${dateAllDay} нет записей и Z-отчёта. Ничего не удалено.`, true);
				return;
			}

			// 3. Удаляем записи (заметки и напоминания)
			let deletedCount = 0;
			if (hasRecords) {
				const db = await new Promise((resolve) => {
					const req = indexedDB.open('LiveTiriDB', 3);
					req.onsuccess = () => resolve(req.result);
				});

				const tx = db.transaction('entries', 'readwrite');
				const store = tx.objectStore('entries');

				for (const record of records) {
					await new Promise((resolve, reject) => {
						const req = store.delete(record.id);
						req.onsuccess = () => {
							deletedCount++;
							resolve();
						};
						req.onerror = () => reject(req.error);
					});
				}
			}

			// 4. Удаляем Z-отчёт
			if (hasReport) {
				await saveReport('day', dateAllDay, {
					dateStr: dateAllDay,
					yearMonth: dateAllDay.slice(0, 7),
					payments: {
						gross: 0,
						summary: 0,
						allGive: 0,
						nowGive: 0,
						moreGive: 0,
						changeGive: 0,
						tips: 0,
						my: 0,
						allMy: 0
					},
					clients: {
						heads: 0,
						pass: 0,
						male: 0,
						male_bearded: 0,
						female: 0,
						colorist: 0,
						child: 0
					}
				});
			}

			// 5. Отчёт
			let message = `✅ За ${dateAllDay} удалено:`;
			if (deletedCount > 0) message += ` ${deletedCount} записей;`;
			if (hasReport) message += ` Z-отчёт;`;
			if (deletedCount === 0 && !hasReport) message = `⚠️ За ${dateAllDay} ничего не найдено.`;
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

	// Проверяем статус при монтировании
	onMount(() => {
		checkDeleteButtonStatus();
		// Проверяем каждые 10 секунд, не истекло ли время
		const interval = setInterval(() => {
			checkDeleteButtonStatus();
		}, 10000);
		return () => clearInterval(interval);
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
</div>

<style>
	.admin-clear-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		max-height: 100vh;
		background: var(--clr-bg-primary, #f5f5f5);
		overflow: hidden;
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
		font-size: 16px;
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
		min-height: 0;
		display: flex;
		flex-direction: column;
		border-left: 4px solid var(--clr-info, #3b82f6);
		margin-bottom: 16px;
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
		font-size: 20px;
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
