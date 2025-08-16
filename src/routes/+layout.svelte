<script lang="ts">
	import '../global.css';
	import ThemeSelector from '$lib/components/common/ThemeSelector.svelte';
	import { Toaster } from 'svelte-sonner';
	import { NavigationLoader } from '@wabosh/navigation-loader';

	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<Toaster />
<NavigationLoader animationDuration={250} color="#5c4878" />

<div class="fixed right-4 top-4 z-50">
	<ThemeSelector />
</div>

{@render children?.()}
