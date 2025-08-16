<script lang="ts" module>
	export const defaultProps = {
		text: 'Sample Text',
		bgcolor: '#000000',
		fgcolor: '#ffffff'
	} as const;

	export type TextProps = typeof defaultProps;
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

<BaseWidget {size} type="Text">
	<div
		class="flex h-full w-full items-center justify-center p-4 "
		style="background-color: {p.bgcolor}; color: {p.fgcolor};"
	>
		<p class="text-center text-xl font-extralight leading-relaxed">
			{p.text}
		</p>
	</div>
</BaseWidget>
