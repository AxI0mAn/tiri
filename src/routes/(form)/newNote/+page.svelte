<script>
	import RenderForm from '$lib/components/aPage/RenderForm.svelte';

	import { constructorStore } from '$lib/store/ConstructorStore.svelte';

	function handleBack() {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			window.history.back();
		}
	}
</script>

<h2>Новая ЗАМЕТКА</h2>
<RenderForm type="note" {constructorStore} onSave={handleBack} onCancel={handleBack} />
