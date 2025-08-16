<script lang="ts" module>
	type DisplayMode = 'compact' | 'detailed' | 'raw';

	export const defaultProps = {
		url: 'https://www.shadertoy.com/embed/lcSGDD?gui=true&t=10&paused=true&muted=false',

		title: 'Shadertoy Demo',
		allowFullscreen: true,
		sandbox: 'allow-scripts allow-same-origin allow-forms',
		scrolling: 'auto',
		border: false
	} as const;

	// <iframe style="border-radius:12px"
	//  src="https://open.spotify.com/embed/track/4BMBpU3AbNPjsHk41S0uSl?utm_source=generator"
	//  width="100%" height="352" frameBorder="0" allowfullscreen=""
	//  allow="autoplay; clipboard-write; encrypted-media;
	// fullscreen; picture-in-picture" loading="lazy"></iframe>

	export type IframeProps = typeof defaultProps;
</script>

<script lang="ts">
	import { browser } from '$app/environment';

	import BaseWidget from '$lib/components/base/BaseWidget.svelte';
	import { Browser as BrowserIcon } from 'phosphor-svelte';
	import { getWidgetPixelSize } from '$src/utils/widgetRegistry';
	import { innerWidth } from 'svelte/reactivity/window';

	interface Props {
		size: { width: number; height: number };
		specificProps: Record<string, any>;
	}

	let { size, specificProps }: Props = $props();

	let p = $derived({
		...defaultProps,
		...specificProps
	});

	let pixSizes = $derived(getWidgetPixelSize(size.width, size.height, innerWidth.current || 1024));
</script>

<BaseWidget {size} type="Iframe">
	<div class="my-auto flex h-full w-full flex-col items-center justify-center overflow-hidden">
		{#if browser && p.url}
			<iframe
				title={p.title}
				width={pixSizes.width}
				height={pixSizes.height}
				frameborder="0"
				src={p.url}
				allowfullscreen={p.allowFullscreen}
				scrolling={p.scrolling}
			></iframe>
		{:else}
			<div class="flex h-full w-full flex-col items-center justify-center p-4 text-center">
				<div class="mb-4 text-muted-foreground">
					<BrowserIcon size={32} />
				</div>
				<h3 class="mb-2 text-lg font-medium">No URL Provided</h3>
				<p class="mb-4 text-sm text-muted-foreground">
					Add a URL in the widget settings to display external web content.
				</p>
				<div
					class="w-full max-w-xs overflow-hidden rounded-md bg-muted p-2 text-xs text-muted-foreground"
				>
					<code>{JSON.stringify(p)}</code>
				</div>
			</div>
		{/if}
	</div>
</BaseWidget>
