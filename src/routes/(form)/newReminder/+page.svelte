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

<RenderForm
	type="reminder"
	constructorStore={constructorReminder}
	onSave={handleBack}
	onCancel={handleBack}
/>
