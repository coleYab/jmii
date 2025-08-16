<script lang="ts">
	import type { WidgetConfig, WidgetProps } from '$src/types/widgets';
	import { PuzzlePiece, DesktopTower, DeviceMobileSpeaker, FloppyDisk, GitBranch } from 'phosphor-svelte';

	import { widgetConfigs } from '$src/utils/widgetRegistry';

	import { dragStore } from '$src/stores/dragStore';
	import { boardStore } from '$src/stores/boardStore';
	import { getEmptyDragImage } from '$src/utils/dragUtils';
	import { toast } from 'svelte-sonner';
	import { autoSaveStore } from '$src/stores/autoSaveStore';
	import { Separator } from '$lib/components/ui/separator';
	import {
		devicePixelRatio,
		innerHeight,
		innerWidth,
		online,
		outerHeight,
		outerWidth,
		screenLeft,
		screenTop,
		scrollX,
		scrollY
	} from 'svelte/reactivity/window';
	interface Props {
		onToggleViewMode?: (columns: number) => void;
		columns?: number;
		isMobile?: boolean;
	}

	let { onToggleViewMode, columns = 4 }: Props = $props();

	let isMobile = $derived(innerWidth.current && innerWidth.current < 768);

	// Save state management
	let isSaving = $state(false);
	let saveSuccess = $state(false);
	let saveError = $state<string | null>(null);

	// Auto-save state
	let autoSaveState = $derived($autoSaveStore);

	let currentTouchWidget = $state<{
		config: WidgetConfig;
		size: { width: number; height: number };
	} | null>(null);

	async function saveSnapShot() {
		try {
			console.log('WidgetBar:: Taking snapshot of the current board...');

			// Collect current board state (use desktop dimensions; widgets include both layouts)
			const widgets = boardStore.getCurrentWidgets();
			const desktopBoard = boardStore.getCurrentBoardState(false);
			const rows = desktopBoard.length;
			const columns = desktopBoard[0]?.length || 4;

			const res = await fetch('/api/creative', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ widgets, rows, columns, action: 'snapshot' })
			});

			if (!res.ok) {
				throw new Error('Failed to save snapshot');
			}

			const data = await res.json();
			console.log('WidgetBar:: Snapshot saved:', data);
			toast.success('Snapshot saved');
		} catch (e) {
			console.error('WidgetBar:: Snapshot failed', e);
			toast.error('Snapshot failed');
		}
	};

	async function handleSave() {
		if (isSaving) return;

		try {
			isSaving = true;
			saveError = null;
			console.log('WidgetBar:: Saving board state...');

			await boardStore.saveBoardState();

			// Clear unsaved changes flag on successful manual save
			autoSaveStore.clearUnsavedChanges();

			saveSuccess = true;
			console.log('WidgetBar:: Board state saved successfully');

			// Clear success message after 2 seconds
			setTimeout(() => {
				saveSuccess = false;
			}, 2000);
		} catch (error) {
			console.error('WidgetBar:: Error saving board state:', error);
			saveError = error instanceof Error ? error.message : 'Failed to save board state';

			// Clear error message after 5 seconds
			setTimeout(() => {
				saveError = null;
			}, 5000);
		} finally {
			isSaving = false;
		}
	}

	function createWidgetData(
		config: WidgetConfig,
		size: { width: number; height: number }
	): WidgetProps {
		return {
			id: crypto.randomUUID(),
			type: config.type,
			specificProps: config.defaultProps,
			layouts: {
				desktop: {
					anchorRow: 0,
					anchorCol: 0,
					size: size
				},
				mobile: {
					anchorRow: 0,
					anchorCol: 0,
					size: size
				}
			}
		};
	}

	const addWidgetFromBar = (config: WidgetConfig, size: { width: number; height: number }) => {
		console.log('WidgetBar:: Adding widget from bar', { type: config.type, size, isMobile });

		// Create initial widget data with temporary position (0,0)
		const tempWidget = createWidgetData(config, size);

		// Get current board state
		const currentBoard = boardStore.getCurrentBoardState(!!isMobile);
		const boardColumns = currentBoard[0]?.length || (isMobile ? 2 : 4);

		console.log('WidgetBar:: Current board info', {
			boardSize: `${currentBoard.length}x${boardColumns}`,
			isMobile,
			widgetSize: size
		});

		// Find next available position
		const availablePosition = boardStore.findNextAvailablePosition?.(
			currentBoard,
			tempWidget,
			boardColumns,
			!!isMobile
		);

		if (!availablePosition) {
			console.warn('WidgetBar:: No available position found for widget', config.type);
			toast.error(`No space available for ${config.type} widget`);
			return;
		}

		console.log('WidgetBar:: Found available position', availablePosition);

		// Update widget with the found position
		const finalWidget: WidgetProps = {
			...tempWidget,
			layouts: {
				desktop: {
					anchorRow: isMobile ? 0 : availablePosition.row,
					anchorCol: isMobile ? 0 : availablePosition.col,
					size: size
				},
				mobile: {
					anchorRow: isMobile ? availablePosition.row : 0,
					anchorCol: isMobile ? availablePosition.col : 0,
					size: size
				}
			}
		};

		console.log('WidgetBar:: Placing widget with final layout', {
			widgetId: finalWidget.id,
			layouts: finalWidget.layouts
		});

		boardStore.placeWidget(finalWidget, !!isMobile);
	};

	// Internal preview state that reconciles with external viewport state
	let isMobilePreview = $state(false);

	// Reconcile internal preview state with external viewport and columns
	$effect(() => {
		// The preview should match the actual viewport state unless manually overridden
		// If columns is 2, we're in mobile preview mode
		// If columns is 4, we're in desktop preview mode
		isMobilePreview = columns === 2;
	});

	function toggleDesktopMode() {
		isMobilePreview = false;
		onToggleViewMode?.(4); // Desktop mode uses 4 columns
	}

	function toggleMobileMode() {
		isMobilePreview = true;
		onToggleViewMode?.(2); // Mobile mode uses 2 columns
	}
</script>

<!-- Widget bar container -->
<div
	class="
	{isMobile ? "flex-row" : "flex-col"}
	flex h-full gap-2 overflow-y-auto rounded-xl border
	border-primary/10 bg-background p-2 pr-3 backdrop-blur-sm scrollbar-hide hover:shadow-lg md:p-4 md:pr-6"
>
	{#each widgetConfigs as config}
		<!-- Draggable widget preview -->
		<button
			class="group relative flex size-12 items-center justify-center rounded-xl
			border border-gray-200/80 bg-background/80
			text-primary backdrop-blur-sm transition-all duration-200
			hover:scale-105 hover:border-primary/30 hover:shadow-lg
			active:scale-95 md:size-16

			{$dragStore.isActive && currentTouchWidget?.config === config ? 'scale-95 opacity-50' : ''}"
			onclick={() => {
				console.log('WidgetBar:: Widget clicked', config.type);
				addWidgetFromBar(config, { width: 1, height: 1 });
			}}
		>
			{#if config.previewIcon}
				<config.previewIcon size={24} weight="duotone" color="currentColor" />
			{:else}
				<PuzzlePiece size={24} weight="duotone" color="currentColor" />
			{/if}

			<p
				class="absolute -top-4 whitespace-nowrap rounded-lg
				border border-gray-200/20 bg-background/95 px-0.5 text-sm
				text-foreground opacity-0 transition-all
				duration-200 group-hover:opacity-100"
			>
				{config.type}
			</p>
		</button>
	{/each}

	<Separator class="my-2 hidden md:block" />

	<!-- Take Snapshot Section -->
	<div class="flex flex-col gap-2 rounded-xl p-0.5">
		<!-- Take Snapshot button -->
		<button
			class="group relative flex size-12 cursor-pointer items-center justify-center rounded-xl
			border {isMobilePreview ? 'border-primary bg-primary/10' : 'border-gray-200/20 bg-background/80'}
			text-primary backdrop-blur-sm transition-all duration-200
			hover:scale-105 hover:border-primary/30 hover:shadow-lg
			active:scale-95 md:size-16"
			onclick={saveSnapShot}
		>
			<GitBranch size={24} weight="duotone" color="currentColor" />

			<!-- Tooltip for take snapshot -->
			<p
				class="absolute -top-8 whitespace-nowrap rounded-lg
				border border-gray-200/20 bg-background/95 px-2 py-1 text-xs
				text-foreground opacity-0 transition-all
				duration-200 group-hover:opacity-100"
			>
				Save Snapshot
			</p>
		</button>
	</div>

	<Separator class="my-2 hidden md:block" />
	<div class=" hidden flex-col gap-2 rounded-[14px] border border-primary/40 p-0.5 md:flex">
		<!-- Desktop mode button -->
		<button
			class="group relative flex size-12 cursor-pointer items-center justify-center rounded-xl
			border {!isMobilePreview
				? 'border-primary bg-primary/10'
				: 'border-gray-200/20 bg-background/80'} text-primary backdrop-blur-sm transition-all
			duration-200 hover:scale-105 hover:border-primary/30
			hover:shadow-lg active:scale-95 md:size-16"
			onclick={toggleDesktopMode}
		>
			<DesktopTower size={24} weight="duotone" color="currentColor" />

			<!-- Tooltip for desktop mode -->
			<p
				class="absolute -top-8 whitespace-nowrap rounded-lg
				border border-gray-200/20 bg-background/95 px-2 py-1 text-xs
				text-foreground opacity-0 transition-all
				duration-200 group-hover:opacity-100"
			>
				Desktop View
			</p>
		</button>

		<!-- Mobile mode button -->
		<button
			class="group relative flex size-12 cursor-pointer items-center justify-center rounded-xl
			border {isMobilePreview ? 'border-primary bg-primary/10' : 'border-gray-200/20 bg-background/80'}
			text-primary backdrop-blur-sm transition-all duration-200
			hover:scale-105 hover:border-primary/30 hover:shadow-lg
			active:scale-95 md:size-16"
			onclick={toggleMobileMode}
		>
			<DeviceMobileSpeaker size={24} weight="duotone" color="currentColor" />

			<!-- Tooltip for mobile mode -->
			<p
				class="absolute -top-8 whitespace-nowrap rounded-lg
				border border-gray-200/20 bg-background/95 px-2 py-1 text-xs
				text-foreground opacity-0 transition-all
				duration-200 group-hover:opacity-100"
			>
				Mobile View
			</p>
		</button>
	</div>

	<Separator class="my-2 hidden md:block" />

	<!-- Save button section -->
	<div class="flex flex-col gap-2 rounded-xl p-0.5">
		<!-- Save button -->
		<div
			role="button"
			tabindex="0"
			class="group relative flex size-12 cursor-pointer items-center justify-center rounded-xl
			border {saveSuccess
				? 'border-green-500 bg-green-500/10'
				: saveError || autoSaveState.saveError
					? 'border-red-500 bg-red-500/10'
					: autoSaveState.hasUnsavedChanges
						? 'border-yellow-500 bg-yellow-500/10'
						: autoSaveState.isAutoSaving
							? 'border-blue-500 bg-blue-500/10'
							: 'border-gray-200/20 bg-background/80'}
			text-{saveSuccess
				? 'green-500'
				: saveError || autoSaveState.saveError
					? 'red-500'
					: autoSaveState.hasUnsavedChanges
						? 'yellow-600'
						: autoSaveState.isAutoSaving
							? 'blue-500'
							: 'primary'} backdrop-blur-sm transition-all duration-200
			{isSaving || autoSaveState.isAutoSaving
				? 'cursor-not-allowed opacity-50'
				: 'hover:scale-105 hover:border-primary/30 hover:shadow-lg active:scale-95'}
			md:size-16"
			onclick={handleSave}
			onkeydown={(e) => e.key === 'Enter' && handleSave()}
			class:animate-pulse={isSaving || autoSaveState.isAutoSaving}
		>
			<FloppyDisk size={24} weight="duotone" color="currentColor" />

			<!-- Tooltip for save button -->
			<p
				class="absolute -top-8 whitespace-nowrap rounded-lg
				border border-gray-200/20 bg-background/95 px-2 py-1 text-xs
				text-foreground opacity-0 transition-all
				duration-200 group-hover:opacity-100"
			>
				{#if isSaving}
					Saving...
				{:else if saveSuccess}
					Saved!
				{:else if saveError}
					Error: {saveError}
				{:else if autoSaveState.isAutoSaving}
					Auto-saving...
				{:else if autoSaveState.saveError}
					Auto-save failed: {autoSaveState.saveError}
				{:else if autoSaveState.hasUnsavedChanges}
					Unsaved changes (auto-save in progress)
				{:else if autoSaveState.lastSaveTime}
					Last saved: {new Date(autoSaveState.lastSaveTime).toLocaleTimeString()}
				{:else}
					Save Board
				{/if}
			</p>
		</div>
	</div>
</div>

<style>
	/* Hide scrollbar but keep functionality */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
