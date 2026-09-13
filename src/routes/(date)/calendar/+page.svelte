<!-- src/routes/(date)/calendar/+page.svelte -->
<script>
	// @ts-ignore
	import { base } from '$app/paths';
	// @ts-ignore
	import { goto } from '$app/navigation';
	import { appState } from '$lib/store/appState.svelte.js';
	import CalendarSchedule from '$lib/components/aPage/calendar/CalendarSchedule.svelte';

	// ✅ Обработка длительного нажатия (переход на день)
	function handleGotoDay(event) {
		const dateStr = event.detail?.dateStr;
		if (!dateStr) return;

		appState.fromCalendar = true;
		appState.now_date = dateStr;
		goto(`${base}/day`);
	}

	// ✅ Подписка на событие
	$effect(() => {
		window.addEventListener('calendar:gotoDay', handleGotoDay);
		return () => window.removeEventListener('calendar:gotoDay', handleGotoDay);
	});
</script>

<div class="calendar-page">
	<CalendarSchedule mode="schedule" />
</div>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.calendar-page {
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		height: 100vh;
		max-height: 100vh;
		max-width: 640px;
		overflow: hidden;
		background: $clr-bg;
	}
</style>
