<script lang="ts" module>
	type DisplayMode = 'compact' | 'detailed' | 'raw';

	export const defaultProps = {
		displayMode: {
			options: ['compact', 'detailed', 'raw'] as const,
			default: 'detailed',
			value: 'detailed' as DisplayMode
		},
		randomText: "",
		showSize: true,
		showProps: true,
		file: {
			accept: ['image/*'],
			url: ''
		}
	} as const;

	export type DebugProps = typeof defaultProps;
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

<BaseWidget {size} type="Debug">
	<div class="group flex h-full w-full flex-col gap-2 bg-primary/10 p-4">
		{#if p.showSize}
			<div class="flex items-center gap-2">
				<p class="text-lg">{size.width}</p>
				x
				<p class="text-lg">{size.height}</p>
			</div>
		{/if}
		<div class="flex flex-col gap-2">
			{#if p.file.url}
				<img
					src={p.file.url}
					alt="Uploaded file"
					class="max-w-full h-auto rounded-lg"
				/>
			{/if}
		</div>
		{#if p.showProps}
			<div class="text-sm">
				{#if p.displayMode.value === 'raw'}
					<pre>{JSON.stringify(specificProps, null, 2)}</pre>
				{:else if p.displayMode.value === 'detailed'}
					{#each Object.entries(specificProps) as [key, value]}
						<div>
							<strong>{key}:</strong> {JSON.stringify(value)}
						</div>
					{/each}
				{:else}
					<p>{Object.keys(specificProps).join(', ')}</p>
				{/if}
			</div>
		{/if}

			<small class="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
				You should not see this in production, if you do please send an email to bugs@jami.et
			</small>
	</div>
</BaseWidget>
