<script lang="ts">
	import LinkGroupHeader from './LinkGroupHeader.svelte';
	import type { ILink, ICollection } from '$lib/types';
	import Link from './Link.svelte';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { quintOut } from 'svelte/easing';
	import { DND_TYPES, FLIP_DURATION_MS } from './dndConfig.js';

	let {
		collection = $bindable(),
		draggingType = null,
		onDeleteLinkGroup,
		onDeleteLink,
		onEditLinkGroup,
		onEditLink,
		onSaveLinkOrder
	}: {
		collection: ICollection;
		draggingType?: 'link' | 'collection' | null;
		onDeleteLinkGroup?: (linkGroupId: string) => void;
		onDeleteLink?: (linkId: string) => void;
		onEditLinkGroup?: (
			linkGroupId: string,
			updateData: { title?: string; sortOrder?: number }
		) => void;
		onEditLink?: (
			linkId: string,
			updateData: {
				title?: string;
				url?: string;
				description?: string | null;
				image?: string | null;
				isActive?: boolean;
			}
		) => void;
		onSaveLinkOrder?: (reorderedLinks: ILink[]) => void;
	} = $props();

	// DND handlers with collection nesting prevention
	const handleLinkGroupDndConsider = (event: CustomEvent<DndEvent<any>>) => {
		console.log('handleLinkGroupDndConsider', event.detail.info.id);
		console.log('handleLinkGroupDndConsider event.detail.items', event.detail.items);
		console.log('handleLinkGroupDndConsider collection.links', collection.links);
		collection.links = event.detail.items;
	};

	const handleLinkGroupDndFinalize = (event: CustomEvent<DndEvent<any>>) => {
		console.log('handleLinkGroupDndFinalize', event.detail.info.id);
		draggingType = null;
		console.log('handleLinkGroupDndFinalize collection.links', collection.links);
		collection.links = event.detail.items;
	};
</script>

<div
	class="relative rounded-xl border-2 bg-card p-4 shadow-sm transition-all duration-200 {draggingType ===
	'collection'
		? 'border-red-300 opacity-70'
		: 'border-primary/20 hover:shadow-md'}"
>
	{#if draggingType === 'collection'}
		<!-- Visual indicator when collections are being dragged -->
		<div
			class="pointer-events-none absolute right-2 top-2 z-10 rounded bg-red-500 px-2 py-1 text-xs font-medium text-white shadow-lg"
		>
			❌ Collections not allowed
		</div>
	{/if}

	<div
		class="pointer-events-none absolute left-2  z-10 rounded bg-red-500 px-2 py-1 text-xs font-medium text-white shadow-lg"
	>
		{collection.id}
	</div>

	<LinkGroupHeader
		title={collection.title}
		linksCount={collection.links.length}
		bind:active={collection.active}
		onDelete={() => onDeleteLinkGroup?.(collection.id)}
		onEdit={(updateData) => onEditLinkGroup?.(collection.id, updateData)}
	/>

	<div
		class="mt-4 space-y-3 transition-all duration-200 {draggingType === 'collection'
			? 'rounded-lg border border-dashed border-red-300 bg-red-50/20 p-2'
			: ''}"
		role="list"
		aria-label="Links in {collection.title} collection"
		use:dndzone={{
			items: collection.links,
			flipDurationMs: FLIP_DURATION_MS,
			type: DND_TYPES.LINK_STANDALONE,
			dropFromOthersDisabled: draggingType === 'collection',
			morphDisabled: false
		}}
		onconsider={handleLinkGroupDndConsider}
		onfinalize={handleLinkGroupDndFinalize}
	>
		{#each collection.links as link (link.id)}
			<div animate:flip={{ duration: FLIP_DURATION_MS, easing: quintOut }}>
				<Link
					{link}
					onDelete={() => onDeleteLink?.(link.id)}
					onEdit={(updateData) => onEditLink?.(link.id, updateData)}
				/>
			</div>
		{/each}

		{#if collection.links.length === 0}
			<div
				class="pointer-events-none flex min-h-[80px] items-center justify-center rounded-xl border-2
				border-dashed p-6 text-center transition-all duration-200 {draggingType === 'collection'
					? 'border-red-300 bg-red-50/20 text-red-700'
					: 'border-muted bg-muted/20 text-muted-foreground hover:border-primary/50 hover:bg-primary/5'}"
			>
				<div class="text-sm">
					{#if draggingType === 'collection'}
						<div class="mb-1 font-medium">🚫 Collections not allowed</div>
						<div class="text-xs">Only links can be dropped here</div>
					{:else}
						<div class="mb-1 font-medium">📎 Drop links here</div>
						<div class="text-xs">Drag links from anywhere to organize them</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
