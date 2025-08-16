<script lang="ts">
	// Import shared ILink type
	import type { ILink } from '$lib/types';
	import { Switch } from '$lib/components/ui/switch';
	import { ExternalLink, Check, X, Pencil, Trash } from 'lucide-svelte';
	import { themeStore } from '$src/stores/themeStore';

	// Define props type inline using imported ILink
	let {
		link,
		onDelete,
		onEdit
	}: {
		link: ILink;
		onDelete?: () => void;
		onEdit?: (updateData: {
			title?: string;
			url?: string;
			description?: string | null;
			image?: string | null;
			isActive?: boolean;
		}) => void;
	} = $props();

	// State for inline editing
	let isEditingTitle = $state(false);
	let isEditingUrl = $state(false);
	let editTitle = $state(link.title);
	let editUrl = $state(link.url);

	// Get current theme
	const currentTheme = $derived($themeStore.currentTheme);

	// Start editing title
	function startEditTitle() {
		isEditingTitle = true;
		editTitle = link.title;
	}

	// Start editing URL
	function startEditUrl() {
		isEditingUrl = true;
		editUrl = link.url;
	}

	// Save title changes
	function saveTitleEdit() {
		if (editTitle.trim() && editTitle !== link.title) {
			onEdit?.({ title: editTitle.trim() });
		}
		isEditingTitle = false;
	}

	// Save URL changes
	function saveUrlEdit() {
		if (editUrl.trim() && editUrl !== link.url) {
			onEdit?.({ url: editUrl.trim() });
		}
		isEditingUrl = false;
	}

	// Cancel title editing
	function cancelTitleEdit() {
		isEditingTitle = false;
		editTitle = link.title;
	}

	// Cancel URL editing
	function cancelUrlEdit() {
		isEditingUrl = false;
		editUrl = link.url;
	}

	// Handle key press in edit inputs
	function handleTitleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			saveTitleEdit();
		} else if (event.key === 'Escape') {
			cancelTitleEdit();
		}
	}

	function handleUrlKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			saveUrlEdit();
		} else if (event.key === 'Escape') {
			cancelUrlEdit();
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="group relative flex h-32 items-start gap-4 border p-4 transition-all duration-200"
	aria-label={`Link: ${link.title}`}
	style={currentTheme
		? `
		background-color: ${currentTheme.buttonBackground}; 
		color: ${currentTheme.buttonColor}; 
		border-color: ${currentTheme.stroke}; 
		border-width: 1px; 
		box-shadow: ${currentTheme.shadow.default};
		border-radius: ${currentTheme.buttonRounding}px;
	`
		: ''}
	onmouseover={(e) => {
		if (currentTheme) {
			e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
		}
	}}
	onmouseout={(e) => {
		if (currentTheme) {
			e.currentTarget.style.boxShadow = currentTheme.shadow.default;
		}
	}}
	onfocus={(e) => {
		if (currentTheme) {
			e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
		}
	}}
	onblur={(e) => {
		if (currentTheme) {
			e.currentTarget.style.boxShadow = currentTheme.shadow.default;
		}
	}}
	onmousedown={(e) => {
		if (currentTheme) {
			e.currentTarget.style.boxShadow = currentTheme.shadow.active;
		}
	}}
	onmouseup={(e) => {
		if (currentTheme) {
			e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
		}
	}}
>
	<div class="flex h-full basis-2/12">
		<div
			class="flex h-full w-full items-center justify-center border"
			style={currentTheme
				? `
				background-color: ${currentTheme.buttonColor}; 
				color: ${currentTheme.buttonBackground}; 
				border-color: ${currentTheme.stroke};
				border-radius: ${currentTheme.buttonRounding}px;
			`
				: ''}
		>
			<ExternalLink class="h-4 w-4" size={32} />
		</div>
	</div>

	<div class="relative flex h-full basis-10/12 flex-col justify-evenly gap-2 pr-12">
		<div
			class="absolute right-0 top-0 flex items-center justify-end gap-3"
			style={currentTheme
				? `
				background-color: ${currentTheme.buttonBackground}; 
				color: ${currentTheme.buttonColor}; 
				border-color: ${currentTheme.stroke};
				border-radius: ${currentTheme.buttonRounding}px;
			`
				: ''}
		>
			<!-- svelte-ignore a11y_mouse_events_have_key_events -->
			<button
				class="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
				onclick={onDelete}
				aria-label="Delete link"
				style={currentTheme
					? `
					
					color: ${currentTheme.buttonColor}; 
					border: 1px solid ${currentTheme.stroke};
					border-radius: ${currentTheme.buttonRounding}px;
					box-shadow: ${currentTheme.shadow.default};
				`
					: 'background-color: rgb(239 68 68); color: white;'}
				onmouseover={(e) => {
					if (currentTheme) {
						e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
					}
				}}
				onmouseout={(e) => {
					if (currentTheme) {
						e.currentTarget.style.boxShadow = currentTheme.shadow.default;
					}
				}}
				onmousedown={(e) => {
					if (currentTheme) {
						e.currentTarget.style.boxShadow = currentTheme.shadow.active;
					}
				}}
				onmouseup={(e) => {
					if (currentTheme) {
						e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
					}
				}}
			>
				<Trash class="h-4 w-4" />
			</button>
		</div>
		<div class="flex items-center gap-2">
			{#if isEditingTitle}
				<input
					type="text"
					bind:value={editTitle}
					onkeydown={handleTitleKeyPress}
					class="flex-grow rounded-md border px-3 py-2 text-base font-semibold focus:outline-none focus:ring-2"
					style={currentTheme
						? `
						background-color: ${currentTheme.background}; 
						color: ${currentTheme.foreground}; 
						border-color: ${currentTheme.stroke};
						border-radius: ${currentTheme.buttonRounding}px;
						box-shadow: ${currentTheme.shadow.default};
					`
						: 'border-color: rgb(209 213 219); background-color: white; color: black;'}
					onfocus={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
						}
					}}
					onblur={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.default;
						}
					}}
				/>
				<!-- svelte-ignore a11y_mouse_events_have_key_events -->
				<button
					class="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
					onclick={saveTitleEdit}
					style={currentTheme
						? `
						background-color: ${currentTheme.buttonBackground}; 
						color: ${currentTheme.buttonColor}; 
						border: 1px solid ${currentTheme.stroke};
						border-radius: ${currentTheme.buttonRounding}px;
						box-shadow: ${currentTheme.shadow.default};
					`
						: 'background-color: rgb(34 197 94); color: white;'}
					onmouseover={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
						}
					}}
					onmouseout={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.default;
						}
					}}
					onmousedown={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.active;
						}
					}}
					onmouseup={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
						}
					}}
				>
					<Check class="h-4 w-4" />
				</button>
				<!-- svelte-ignore a11y_mouse_events_have_key_events -->
				<button
					class="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
					onclick={cancelTitleEdit}
					style={currentTheme
						? `
						background-color: ${currentTheme.buttonBackground}; 
						color: ${currentTheme.buttonColor}; 
						border: 1px solid ${currentTheme.stroke};
						border-radius: ${currentTheme.buttonRounding}px;
						box-shadow: ${currentTheme.shadow.default};
					`
						: 'background-color: rgb(239 68 68); color: white;'}
					onmouseover={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
						}
					}}
					onmouseout={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.default;
						}
					}}
					onmousedown={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.active;
						}
					}}
					onmouseup={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
						}
					}}
				>
					<X class="h-4 w-4" />
				</button>
			{:else}
				<!-- svelte-ignore a11y_mouse_events_have_key_events -->
				<button
					class="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
					onclick={startEditTitle}
					style={currentTheme
						? `
						background-color: ${currentTheme.buttonBackground}; 
						color: ${currentTheme.buttonColor}; 
						border: 1px solid ${currentTheme.stroke};
						border-radius: ${currentTheme.buttonRounding}px;
						box-shadow: ${currentTheme.shadow.default};
					`
						: 'background-color: rgb(243 244 246); color: rgb(55 65 81);'}
					onmouseover={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
						}
					}}
					onmouseout={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.default;
						}
					}}
					onmousedown={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.active;
						}
					}}
					onmouseup={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
						}
					}}
				>
					<Pencil class="h-3.5 w-3.5" />
				</button>
				<h4
					class="text-base font-semibold"
					style={currentTheme ? `color: ${currentTheme.buttonColor};` : ''}
				>
					{link.title}
				</h4>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			{#if isEditingUrl}
				<input
					type="url"
					bind:value={editUrl}
					onkeydown={handleUrlKeyPress}
					class="flex-grow rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
					style={currentTheme
						? `
						background-color: ${currentTheme.background}; 
						color: ${currentTheme.foreground}; 
						border-color: ${currentTheme.stroke};
						border-radius: ${currentTheme.buttonRounding}px;
						box-shadow: ${currentTheme.shadow.default};
					`
						: 'border-color: rgb(209 213 219); background-color: white; color: rgb(107 114 128);'}
					onfocus={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
						}
					}}
					onblur={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.default;
						}
					}}
				/>
				<!-- svelte-ignore a11y_mouse_events_have_key_events -->
				<button
					class="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
					onclick={saveUrlEdit}
					style={currentTheme
						? `
						background-color: ${currentTheme.buttonBackground}; 
						color: ${currentTheme.buttonColor}; 
						border: 1px solid ${currentTheme.stroke};
						border-radius: ${currentTheme.buttonRounding}px;
						box-shadow: ${currentTheme.shadow.default};
					`
						: 'background-color: rgb(34 197 94); color: white;'}
					onmouseover={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
						}
					}}
					onmouseout={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.default;
						}
					}}
					onmousedown={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.active;
						}
					}}
					onmouseup={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
						}
					}}
				>
					<Check class="h-3.5 w-3.5" />
				</button>
				<!-- svelte-ignore a11y_mouse_events_have_key_events -->
				<button
					class="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
					onclick={cancelUrlEdit}
					style={currentTheme
						? `
						background-color: ${currentTheme.buttonBackground}; 
						color: ${currentTheme.buttonColor}; 
						border: 1px solid ${currentTheme.stroke};
						border-radius: ${currentTheme.buttonRounding}px;
						box-shadow: ${currentTheme.shadow.default};
					`
						: 'background-color: rgb(239 68 68); color: white;'}
					onmouseover={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
						}
					}}
					onmouseout={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.default;
						}
					}}
					onmousedown={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.active;
						}
					}}
					onmouseup={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
						}
					}}
				>
					<X class="h-3.5 w-3.5" />
				</button>
			{:else}
				<!-- svelte-ignore a11y_mouse_events_have_key_events -->
				<button
					class="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
					onclick={startEditUrl}
					style={currentTheme
						? `
						background-color: ${currentTheme.buttonBackground}; 
						color: ${currentTheme.buttonColor}; 
						border: 1px solid ${currentTheme.stroke};
						border-radius: ${currentTheme.buttonRounding}px;
						box-shadow: ${currentTheme.shadow.default};
					`
						: 'background-color: rgb(243 244 246); color: rgb(55 65 81);'}
					onmouseover={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
						}
					}}
					onmouseout={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.default;
						}
					}}
					onmousedown={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.active;
						}
					}}
					onmouseup={(e) => {
						if (currentTheme) {
							e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
						}
					}}
				>
					<Pencil class="h-3.5 w-3.5" />
				</button>
				<span
					class="flex-grow truncate text-sm"
					style={currentTheme ? `color: ${currentTheme.buttonColor};` : ''}
				>
					{link.url}
				</span>
			{/if}
		</div>
	</div>
</div>
