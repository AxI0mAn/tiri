<script>
	import RenderForm from '$lib/components/aPage/RenderForm.svelte';

	import { constructorStore } from '$lib/store/ConstructorStore.svelte';

	function handleBack() {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			window.history.back();
		}
	}
</script>

<h1 style="background-color: orange; height: 5rem; padding: 2rem auto;">
	ЧТО ДОЛЖНО БЫТЬ В БЛАНКЕ ЗАКАЗА ------ ЧТО ДОЛЖНО БЫТЬ В х ОТЧЁТЕ ------ ЧТО ДОЛЖНО БЫТЬ В z
	ОТЧЁТЕ
</h1>

<RenderForm type="note" {constructorStore} onSave={handleBack} onCancel={handleBack} />
