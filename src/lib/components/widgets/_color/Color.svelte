<script lang="ts" module>
	export const defaultProps = {
		color: '#3b82f6',
	} as const;

	export type ColorProps = typeof defaultProps;
</script>

<script lang="ts">
	import BaseWidget from '$lib/components/base/BaseWidget.svelte';

	interface Props {
		size: { width: number; height: number };
		specificProps: Record<string, any>;
	}

	let { size, specificProps }: Props = $props();

	let p = $derived({
		...defaultProps,
		...specificProps
	});
</script>

<BaseWidget {size} type="Color">
	<div
		class="h-full w-full rounded-lg"
		style="background-color: {p.color};"
	></div>
</BaseWidget>
