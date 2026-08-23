<script>
	import RenderForm from '$lib/components/aPage/RenderForm.svelte';

	// Импортируем ваши сторы схем
	import { constructorReminder } from '$lib/store/ConstructorStore.svelte';

	function handleBack() {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			window.history.back();
		}
	}
</script>

<h2>Новое НАПОМИНАНИЕ</h2>
<RenderForm
	type="reminder"
	constructorStore={constructorReminder}
	onSave={handleBack}
	onCancel={handleBack}
/>
