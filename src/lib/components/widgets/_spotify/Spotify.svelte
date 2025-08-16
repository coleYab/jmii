<script lang="ts" module>
	declare global {
		interface Window {
			onSpotifyIframeApiReady: (IFrameAPI: any) => void;
		}
	}

	export const defaultProps = {
		uri: 'https://open.spotify.com/embed/playlist/5IowvtNNHfamU5rfakHto8?utm_source=generator',
		title: 'WooHOOBops',
		theme: 'dark'
	} as const;

	export type SpotifyProps = typeof defaultProps;
</script>

<script lang="ts">
	import { browser } from '$app/environment';
	import BaseWidget from '$lib/components/base/BaseWidget.svelte';
	import { MusicNotes } from 'phosphor-svelte';

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

<BaseWidget {size} type="Spotify">
	<div class="flex h-full w-full flex-col items-center justify-center">
		{#if browser && p.uri}
			<iframe
				title={p.title}
				src={p.uri}
				width="100%"
				height="100%"
				frameBorder="0"
				allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
				loading="lazy"
			></iframe>
		{:else}
			<div class="flex h-full w-full flex-col items-center justify-center p-4 text-center">
				<div class="mb-4 text-muted-foreground">
					<MusicNotes size={32} />
				</div>
				<h3 class="mb-2 text-lg font-medium">No Spotify URI Provided</h3>
				<p class="mb-4 text-sm text-muted-foreground">
					Add a Spotify URI in the widget settings to display the player.
				</p>
			</div>
		{/if}
	</div>
</BaseWidget>
