<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { ArrowUpDown } from 'lucide-svelte';

	let { onclick, text }: { onclick?: (event: unknown) => void; text: string } = $props();
</script>

<Button variant="ghost" {onclick} class="h-8 p-0">
	{text}
	<ArrowUpDown class="ml-2 h-4 w-4" />
</Button> 