<script lang="ts">
	import Board from './Board.svelte';
	import WidgetBar from './Board/WidgetBar.svelte';

	import EditWidgetDrawer from '$lib/components/base/EditWidgetDrawer.svelte';
	import { drawerStore } from '$src/stores/drawerStore';
	import { boardStore } from '$src/stores/boardStore';
	import type { IBoardState } from '$src/types/widgets';
	import { BOARD_CONFIG, validateBoardDimensions } from '$src/stores/board/board.config';

	import type { IProfile } from '$src/models/Profile/Profile.types';
	import type { ITheme } from '$src/models/Theme.model';

	import UserDetailsDisplayEdit from '../common/UserDetailsDisplayEdit.svelte';
	import { autoSaveStore } from '$src/stores/autoSaveStore';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { GitBranch, Clock, FloppyDisk, ArrowClockwise, Plus, Minus } from 'phosphor-svelte';

	import { MediaQuery } from 'svelte/reactivity';
	import { quintIn, quintInOut, backInOut } from 'svelte/easing';
	import { slide, fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { CornerDownLeft } from 'lucide-svelte';

	interface Props {
		profileData: IProfile;
		session: any;
		boardData?: IBoardState;
		isPublicView?: boolean;
		refresh: () => void;
		theme?: ITheme;
	}

	// Default board dimensions from centralized config
	let { isPublicView = false, boardData, profileData, refresh, theme }: Props = $props();

	let rows: number = $state(BOARD_CONFIG.DEFAULT_ROWS);
	let columns: number = $state(BOARD_CONFIG.DEFAULT_COLUMNS_DESKTOP);

	let initialLoadComplete = $state(false);

	// Media query for mobile detection
	let isMobileViewport = $state(new MediaQuery('(max-width: 768px)'));
	let isManualOverride = $state(false);
	
	// Auto-save state
	let autoSaveState = $derived($autoSaveStore);
	let showAutoSaveSuccess = $state(false);
	
	// Version history state
	let versions = $state<any[]>([]);
	let loadingVersions = $state(false);
	let isVersionDialogOpen = $state(false);
	
	// Show success message when auto-save completes
	$effect(() => {
		if (autoSaveState.lastSaveTime && !autoSaveState.hasUnsavedChanges && !autoSaveState.isAutoSaving) {
			showAutoSaveSuccess = true;
			setTimeout(() => {
				showAutoSaveSuccess = false;
			}, 2000);
		}
	});

	// Add row functionality
	async function addRow() {
		const newRows = Math.min(rows + 1, BOARD_CONFIG.MAX_ROWS);
		if (newRows !== rows) {
			rows = newRows;
			handleDimensionChange();
			
			// Persist the changes
			try {
				await boardStore.saveBoardState();
				toast.success('Row added and changes saved');
			} catch (error) {
				console.error('Error saving board state:', error);
				toast.error('Row added but failed to save changes');
			}
		} else {
			toast.error('Maximum rows reached');
		}
	}

	// Delete row functionality
	async function deleteRow() {
		const newRows = Math.max(rows - 1, BOARD_CONFIG.MIN_ROWS);
		const isMobile = new MediaQuery('(max-width: 768px)');
		if (newRows !== rows) {
			// Check if the row to be deleted has widgets
			// const hasWidgetsInLastRow = boardStore.hasWidgetsInRow(rows - 1, false);
			const lastRowWithWidget = boardStore.lastCoveredRow(boardStore.getCurrentWidgets(), !!isMobile)
			console.log(lastRowWithWidget, boardStore.getCurrentWidgets())
			if (lastRowWithWidget > newRows) {
				toast.error('Cannot delete row with widgets. Please remove widgets first.');
				return;
			}
			
			rows = newRows;
			handleDimensionChange();
			
			// Persist the changes
			try {
				await boardStore.saveBoardState();
				toast.success('Row removed and changes saved');
			} catch (error) {
				console.error('Error saving board state:', error);
				toast.error('Row removed but failed to save changes');
			}
		} else {
			toast.error('Minimum rows reached');
		}
	}

	// Load versions
	async function loadVersions() {
		loadingVersions = true;
		try {
			const response = await fetch('/api/creative/versions');
			if (response.ok) {
				const data = await response.json();
				versions = data.versions || [];
			}
		} catch (error) {
			console.error('Error loading versions:', error);
		} finally {
			loadingVersions = false;
		}
	}

	// Save snapshot
	async function saveSnapshot() {
		try {
			const widgets = boardStore.getCurrentWidgets();
			const desktopBoard = boardStore.getCurrentBoardState(false);
			const rows = desktopBoard.length;
			const columns = desktopBoard[0]?.length || 4;

			const res = await fetch('/api/creative', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ widgets, rows, columns, action: 'snapshot' })
			});

			if (res.ok) {
				await loadVersions();
				toast.success('Snapshot saved');
			}
		} catch (error) {
			console.error('Error saving snapshot:', error);
			toast.error('Failed to save snapshot');
		}
	}

	// Restore version
	async function restoreVersion(versionId: string) {
		try {
			const res = await fetch(`/api/creative/versions/${versionId}`, {
				method: 'POST'
			});
			if (res.ok) {
				// Reload the board
				window.location.reload();
			}
		} catch (error) {
			console.error('Error restoring version:', error);
			toast.error('Failed to restore version');
		}
	}

	// Consolidated function to update columns and handle state
	function updateColumns(newColumns: number, isManual: boolean) {
		if (!initialLoadComplete) return;

		console.log('updateColumns called:', { newColumns, isManual, currentColumns: columns });

		// Set manual override BEFORE changing columns to prevent auto-switch interference
		if (isManual) {
			// Set manual override when user explicitly chooses mobile mode on desktop viewport
			isManualOverride = !isMobileViewport.current && newColumns === 2;
			console.log('Manual override set:', isManualOverride);
		}

		// Only update if actually different
		if (columns !== newColumns) {
			columns = newColumns;

			// Always call handleDimensionChange when columns change
			handleDimensionChange();
		}
	}

	async function handleWidgetSave(event: CustomEvent) {
		if ($drawerStore.widget?.id && boardStore) {
			// Update the widget props in the board store (auto-save will trigger automatically)
			boardStore.updateWidgetProps($drawerStore.widget.id, event.detail.specificProps);
		}
	}

	// Function to handle dimension changes after initial load
	function handleDimensionChange() {
		if (!initialLoadComplete) return;

		// Validate dimensions before applying
		const validation = validateBoardDimensions(rows, columns);

		if (validation.wasModified) {
			console.warn(
				`Board dimensions adjusted: ${rows}x${columns} -> ${validation.rows}x${validation.columns}`
			);
			rows = validation.rows as number;
			columns = validation.columns as number;
		}

		// Only fit to mobile when switching to mobile view (2 columns)
		if (columns === 2) {
			console.log(
				'Fitting desktop widgets to mobile constraints:',
				validation.rows,
				validation.columns
			);
			boardStore.fitToMobile(validation.rows, validation.columns);
		} else {
			console.log('Switching to desktop mode, preserving desktop layouts');
		}
		// Note: Desktop layouts are preserved, so no action needed when switching to desktop
	}

	// Handle board loaded callback
	function handleBoardLoaded(data: { rows: number; columns: number }) {
		console.log('Board loaded with dimensions:', data);

		// Update the UI dimensions to match the loaded board
		rows = data.rows;
		columns = data.columns;

		// Mark initial load as complete
		initialLoadComplete = true;
	}

	// Auto-switch columns based on viewport size (only when no manual override)
	$effect(() => {
		if (!isManualOverride && initialLoadComplete) {
			const targetColumns = isMobileViewport.current
				? BOARD_CONFIG.DEFAULT_COLUMNS_MOBILE
				: BOARD_CONFIG.DEFAULT_COLUMNS_DESKTOP;
			if (columns !== targetColumns) {
				updateColumns(targetColumns, false);
			}
		}
	});

	// Force board re-render when columns change
	$effect(() => {
		if (initialLoadComplete) {
			console.log('Columns changed, current columns:', columns);
			// This will trigger the Board component to re-render
		}
	});

	// Load versions on mount
	onMount(() => {
		if (!isPublicView) {
			loadVersions();
		}
	});

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
		
		if (diffInHours < 1) return 'Just now';
		if (diffInHours < 24) return `${diffInHours}h ago`;
		if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
		return date.toLocaleDateString();
	}
</script>

<EditWidgetDrawer
	widget={$drawerStore.widget}
	show={$drawerStore.show}
	on:save={handleWidgetSave}
/>

<UserDetailsDisplayEdit {profileData} {isManualOverride} {isPublicView} {refresh} mode="creative" />

<!-- Row Management Controls - positioned above the board -->
{#if !isPublicView}
	<div class="flex justify-center mb-6 mt-8">
		<div class="flex gap-3">
			<Button
				size="default"
				onclick={addRow}
				title="Add Row"
			>
				<Plus size={18} class="text-white" />
				<span class="font-semibold">Add Row</span>
			</Button>
			<Button
				size="default"
				onclick={deleteRow}
				title="Delete Row"
			>
				<Minus size={18}/>
				<span class="font-semibold">Delete Row</span>
			</Button>
		</div>
	</div>
{/if}

<div class="relative flex h-full w-full max-w-[100vw] items-start justify-around px-2 pb-4 {isMobileViewport.current ? 'pb-24' : ''}">
	<Board
		{rows}
		{columns}
		{isPublicView}
		{boardData}
		{theme}
		onBoardLoaded={handleBoardLoaded}
		isMobile={columns === 2}
	/>
</div>

{#if !isPublicView && initialLoadComplete}
	<div
		class="
		transition-all duration-300 ease-in-out
		
		{isMobileViewport.current
			? 'fixed bottom-0 left-1/2 -translate-x-1/2  '
			: 'fixed -right-2 top-1/2 -translate-y-1/2 hover:right-0'}
		
		"
	>
		<WidgetBar
			onToggleViewMode={(newColumns) => updateColumns(newColumns, true)}
			{columns}
			isMobile={isMobileViewport.current}
		/>
	</div>


{/if}

<!-- Version History Dialog -->
{#if !isPublicView && initialLoadComplete}
	<Dialog bind:open={isVersionDialogOpen}>
		<DialogTrigger>
			<Button 
				variant="outline" 
				size="sm"
				class="fixed bottom-4 right-4 z-30 shadow-lg hover:shadow-xl transition-all"
			>
				<GitBranch size={16} class="mr-2" />
				<span class="hidden sm:inline">Version History</span>
			</Button>
		</DialogTrigger>
		
		<DialogContent class="max-w-md sm:max-w-lg w-[95vw] max-h-[90vh] p-0 gap-0">
			<DialogHeader class="px-4 py-3 border-b">
				<DialogTitle class="text-lg font-semibold flex items-center gap-2">
					<GitBranch size={20} />
					Version History
				</DialogTitle>
			</DialogHeader>
			
			<div class="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
				<!-- Save Snapshot Section -->
				<div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
					<div class="flex items-center gap-2">
						<FloppyDisk size={18} class="text-primary" />
						<span class="text-sm font-medium">Current State</span>
					</div>
					<Button 
						size="sm" 
						onclick={saveSnapshot}
						class="text-xs"
					>
						Save Snapshot
					</Button>
				</div>

				<!-- Unsaved Changes Indicator -->
				{#if autoSaveState.hasUnsavedChanges}
					<div class="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
						<span class="text-amber-600">⚠️</span>
						<span class="text-sm text-amber-700">You have unsaved changes</span>
					</div>
				{/if}

				<!-- Versions List -->
				<div class="space-y-2">
					<h3 class="text-sm font-medium text-muted-foreground">Previous Versions</h3>
					
					{#if loadingVersions}
						<div class="flex items-center justify-center py-8">
							<div class="flex items-center gap-2">
								<div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
								<span class="text-sm text-muted-foreground">Loading versions...</span>
							</div>
						</div>
					{:else if versions.length === 0}
						<div class="text-center py-8 text-muted-foreground">
							<Clock size={32} class="mx-auto mb-2 opacity-50" />
							<p class="text-sm">No versions yet</p>
							<p class="text-xs">Save your first snapshot to get started</p>
						</div>
					{:else}
						<ScrollArea class="max-h-64">
							<div class="space-y-2 pr-2">
								{#each versions as version (version.id)}
									<div class="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-colors">
										<div class="flex items-center gap-3 flex-1 min-w-0">
											<Clock size={16} class="text-muted-foreground flex-shrink-0" />
											<div class="flex-1 min-w-0">
												<p class="text-sm font-medium truncate">
													{formatDate(version.createdAt)}
												</p>
												{#if version.widgetCount}
													<Badge variant="secondary" class="text-xs mt-1">
														{version.widgetCount} widgets
													</Badge>
												{/if}
											</div>
										</div>
										<Button
											size="sm"
											variant="outline"
											onclick={() => restoreVersion(version.id)}
											class="text-xs flex-shrink-0"
										>
											<ArrowClockwise size={14} class="mr-1" />
											Restore
										</Button>
									</div>
								{/each}
							</div>
						</ScrollArea>
					{/if}
				</div>
			</div>
		</DialogContent>
	</Dialog>
{/if}
