<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { ArrowUpDown } from 'lucide-svelte';

	let { onclick, children }: { onclick?: () => void; children?: any } = $props();
</script>

<Button variant="ghost" onclick class="h-8 p-0">
	{#if children}
		{@render children()}
	{:else}
		Email
	{/if}
	<ArrowUpDown class="ml-2 h-4 w-4" />
</Button>
