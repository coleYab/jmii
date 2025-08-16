<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import {  GripVertical} from 'lucide-svelte';

	type Props = {
		title: string;
		linksCount: number;
		active: boolean;
		onDelete?: () => void;
		onEdit?: (updateData: { title?: string; sortOrder?: number }) => void;
	};

	// Correct usage of $bindable within $props
	let { title, linksCount, active = $bindable(), onDelete, onEdit }: Props = $props();

	// State for inline editing
	let isEditing = $state(false);
	let editTitle = $state(title);

	// Start editing
	function startEdit() {
		isEditing = true;
		editTitle = title;
	}

	// Save changes
	function saveEdit() {
		if (editTitle.trim() && editTitle !== title) {
			onEdit?.({ title: editTitle.trim() });
		}
		isEditing = false;
	}

	// Cancel editing
	function cancelEdit() {
		isEditing = false;
		editTitle = title;
	}

	// Handle key press in edit input
	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			saveEdit();
		} else if (event.key === 'Escape') {
			cancelEdit();
		}
	}
</script>

<!-- Full header for multi-link collections -->
<div class="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
	<div class="flex items-center gap-3">
		<GripVertical
			class="h-5 w-5 cursor-grab text-muted-foreground transition-colors hover:text-foreground"
		/>
		<LayoutGrid class="h-5 w-5 text-muted-foreground" />

		{#if isEditing}
			<input
				type="text"
				bind:value={editTitle}
				onkeydown={handleKeyPress}
				class="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
			/>
			<button
				class="flex h-7 w-7 items-center justify-center rounded-md text-green-600 transition-colors hover:bg-green-50 hover:text-green-700"
				onclick={saveEdit}
			>
				<Check class="h-4 w-4" />
			</button>
			<button
				class="flex h-7 w-7 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
				onclick={cancelEdit}
			>
				<X class="h-4 w-4" />
			</button>
		{:else}
			<h3 class="text-lg font-semibold text-foreground">{title}</h3>
			<button
				class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				onclick={startEdit}
			>
				<Pencil class="h-4 w-4" />
			</button>
		{/if}

		<span class="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
			{linksCount}
			{linksCount === 1 ? 'link' : 'links'}
		</span>
	</div>

	<div class="flex items-center gap-2">
		<button
			class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		>
			<Copy class="h-4 w-4" />
		</button>
		<button
			class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
			onclick={() => onDelete?.()}
		>
			<Trash class="h-4 w-4" />
		</button>
		<div class="ml-2">
			<Switch bind:checked={active} />
		</div>
	</div>
</div>
