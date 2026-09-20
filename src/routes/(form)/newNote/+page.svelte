<script>
	import { onMount } from 'svelte';

	import RenderForm from '$lib/components/aPage/RenderForm.svelte';

	import { constructorStore } from '$lib/store/ConstructorStore.svelte';

	function handleBack() {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			window.history.back();
		}
	}

	onMount(() => {
		// ✅ Очищаем черновик при загрузке страницы
		if (typeof window !== 'undefined') {
			localStorage.removeItem('draft_entry');
		}
	});
</script>

<RenderForm type="note" {constructorStore} onSave={handleBack} onCancel={handleBack} />
