<script lang="ts">
	import { fly } from "svelte/transition";

	interface Props {
		i: number;
		j: number;
		isValid: boolean;
		isPartOfDropArea: boolean;
		style?: string;
	}

	let { i, j, isValid, isPartOfDropArea, style = '' }: Props = $props();
</script>

<div
	class="empty-cell {isPartOfDropArea ? (isValid ? 'bg-green-500/20' : 'bg-red-500/20') : ''}"
	{style}
>
	{i}: {j} 
</div>

<style lang="postcss">

	.empty-cell {
		@apply transition-all;
		@apply flex items-center justify-center;
		@apply border rounded-xl;
		@apply border-foreground/20 text-foreground/20;
		@apply font-display;
	}
	.empty-cell:dark {
		@apply border-foreground/20 text-foreground/20;
	}

</style>
