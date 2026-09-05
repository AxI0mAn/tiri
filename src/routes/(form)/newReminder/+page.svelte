<script>
	import { onMount } from 'svelte';
	// @ts-ignore
	import { goto } from '$app/navigation';
	// @ts-ignore
	import { base } from '$app/paths';
	import RenderForm from '$lib/components/aPage/RenderForm.svelte';
	import { constructorReminder } from '$lib/store/ConstructorStore.svelte.js';

	onMount(() => {
		// ✅ Очищаем черновик при загрузке страницы
		if (typeof window !== 'undefined') {
			localStorage.removeItem('draft_entry');
		}
	});

	async function handleSave() {
		goto(`${base}/day`);
	}

	function handleCancel() {
		goto(`${base}/day`);
	}
</script>

<RenderForm
	constructorStore={constructorReminder}
	type="reminder"
	onSave={handleSave}
	onCancel={handleCancel}
/>
