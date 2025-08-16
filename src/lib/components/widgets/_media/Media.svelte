<script lang="ts" module>
	export const defaultProps = {
		file: {
			accept: ['image/*'],
			url: ''
		},
		src: '',
		caption: ''
	} as const;

	export type MediaProps = typeof defaultProps;
</script>

<script lang="ts">
	import { Image } from 'phosphor-svelte';
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

	let mediaError = $state(false);
	let uploadError = $state('');
	let isUploading = $state(false);
</script>

<BaseWidget {size} type="Media">
	<div class="group flex h-full flex-col overflow-hidden">
		{#if !p.src}
			{#if mediaError}
				<div class="flex h-full items-center justify-center p-4 text-red-500">
					Failed to load media
				</div>
			{:else if !p.file.url}
				<div class="flex h-full items-center justify-center p-4">
					<div class="flex flex-col items-center gap-2 text-gray-500">
						{#if isUploading}
							<div
								class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
							></div>
						{:else}
							<Image size={32} weight="duotone" />
						{/if}
						{#if uploadError}
							<p class="text-sm text-red-500">{uploadError}</p>
						{/if}
					</div>
				</div>
			{:else}
				<img
					class="h-full w-full"
					style="object-fit: cover;"
					src={p.file.url}
					alt={p.caption}
					onerror={() => (mediaError = true)}
				/>
			{/if}
		{:else}
			<img class="h-full w-full" style="object-fit: cover;" src={p.src} alt={p.caption} />
		{/if}

		{#if p.caption && !mediaError}
			<div
				class="absolute bottom-0 left-0 right-0 rounded-b-xl bg-black/50 p-2 text-center text-xs text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
			>
				{p.caption}
			</div>
		{/if}
	</div>
</BaseWidget>
