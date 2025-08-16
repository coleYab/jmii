<script>
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';

	let { children, onClick } = $props();
</script>

<Command.Item class="w-full py-0.5 px-0">
	<Button
		class="flex w-full flex-row justify-start text-sm gap-2 px-2 py-0.5"
		variant="outline"
		onclick={onClick}
	>
		{@render children?.()}
	</Button>
</Command.Item>
