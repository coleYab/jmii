<script lang="ts">
	import { onMount } from 'svelte';
	import { boardStore } from '$src/stores/boardStore';
	import { dragStore } from '$src/stores/dragStore';
	import type { WidgetProps, IBoardState } from '$src/types/widgets';
	import type { ITheme } from '$src/models/Theme.model';
	import BoardGrid from './Board/BoardGrid.svelte';
	import DragDropManager from './Board/DragDropManager.svelte';
	import WidgetContainer from './Board/WidgetContainer.svelte';
	import { BOARD_CONFIG, getResponsiveCellDimensions } from '$src/stores/board/board.config';
	import { innerWidth } from 'svelte/reactivity/window';

	interface Props {
		rows: number;
		columns: number;
		isMobile: boolean;
		isPublicView?: boolean;
		boardData?: any;
		theme?: ITheme;
		onBoardLoaded?: (data: { rows: number; columns: number }) => void;
	}

	let {
		rows,
		columns,
		isPublicView = false,
		boardData,
		isMobile,
		theme,
		onBoardLoaded
	}: Props = $props();

	let cellDimensions = $derived.by(() => {
		// Use responsive cell dimensions based on viewport width
		const viewportWidth = innerWidth.current || 1024; // Fallback to tablet size
		const responsive = getResponsiveCellDimensions(viewportWidth);
		return {
			width: responsive.CELL_WIDTH,
			height: responsive.CELL_HEIGHT,
			gap: responsive.CELL_GAP
		};
	});

	let draggedWidget = $state<WidgetProps | null>(null);
	let editingWidgetId = $derived<string | null>(draggedWidget?.id ?? null);


	// Calculate total board width
	const boardWidth = $derived(
		columns * (cellDimensions.width + cellDimensions.gap) - cellDimensions.gap
	);
	const minRowHeight = $derived(cellDimensions.height);

	let draggingWidgetId = $state<string | null>(null);
	let targetCol = $state(-1);
	let saveSuccess = $state(false);
	let boardElement = $state<HTMLElement | null>(null);
	let isInitialized = $state(false);

	let activeWidgets = $derived.by(() => {
		if (!isInitialized) return [];
		
		// Get the current store state reactively
		const storeState = $boardStore;
		const boardState = isMobile ? storeState.mobile : storeState.desktop;
		
		// Get active widgets from the board state
		const widgets = boardState
			.flatMap((row, i) =>
				row.map((cell, j) => {
					if (cell) {
						const layout = isMobile ? cell.layouts.mobile : cell.layouts.desktop;
						return layout.anchorRow === i && layout.anchorCol === j ? { ...cell } : undefined;
					}
					return undefined;
				})
			)
			.filter((widget): widget is WidgetProps => widget !== null && widget !== undefined);
			
		console.log('Board:: activeWidgets derived', {
			isInitialized,
			isMobile,
			boardStateSize: `${boardState.length}x${boardState[0]?.length || 0}`,
			activeWidgetsCount: widgets.length,
			activeWidgetIds: widgets.map(w => w.id),
			totalWidgetsInStore: storeState.widgets.length
		});
		
		return widgets;
	});

	// Add an effect to log when activeWidgets changes
	$effect(() => {
		console.log('Board:: activeWidgets effect triggered', {
			isInitialized,
			isMobile,
			activeWidgetsCount: activeWidgets.length,
			activeWidgetIds: activeWidgets.map(w => w.id)
		});
	});

	function handleDrop(event: { widget: WidgetProps; row: number; col: number }) {
		const { widget, row, col } = event;
		
		console.log('Board:: handleDrop called', {
			widgetId: widget.id,
			widgetType: widget.type,
			row,
			col,
			isMobile,
			widget
		});

		// Check if the widget exists in the current widgets list
		const widgets = boardStore.getCurrentWidgets();
		const existingWidget = widgets.find((w) => w.id === widget.id);
		
		console.log('Board:: handleDrop - widget check', {
			existingWidget: existingWidget ? existingWidget.id : 'null',
			totalWidgets: widgets.length,
			allWidgetIds: widgets.map(w => w.id)
		});

		if (existingWidget) {
			console.log('Board:: handleDrop - updating existing widget position');
			boardStore.updateWidgetPosition(widget.id, row, col, isMobile);
		} else {
			console.log('Board:: handleDrop - creating new widget');
			let newWidget: WidgetProps;
			// The sizes here being 1x1 means the default widget size is a 1x1
			// But this may cause issues if the widget does not have 1x1 in its config

			if (isMobile) {
				newWidget = {
					...widget,
					id: crypto.randomUUID(),
					layouts: {
						mobile: {
							// This one is important
							anchorRow: row,
							anchorCol: col,
							size: {
								width: 1,
								height: 1
							}
						},
						desktop: {
							// This one should be inferred by placement calcs
							anchorRow: row,
							anchorCol: col,
							size: {
								width: 1,
								height: 1
							}
						}
					}
				};
			} else {
				newWidget = {
					...widget,
					id: crypto.randomUUID(),
					layouts: {
						desktop: {
							// This one is important
							anchorRow: row,
							anchorCol: col,
							size: {
								width: 1,
								height: 1
							}
						},
						mobile: {
							// This one should be inferred by placement calcs
							anchorRow: row,
							anchorCol: col,
							size: {
								width: 1,
								height: 1
							}
						}
					}
				};
			}
			
			console.log('Board:: handleDrop - calling placeWidget with', {
				newWidgetId: newWidget.id,
				newWidgetType: newWidget.type,
				isMobile,
				layouts: newWidget.layouts
			});
			
			boardStore.placeWidget(newWidget, isMobile);
			
			console.log('Board:: handleDrop - placeWidget completed');
		}
	}

	function deleteWidget(widget: WidgetProps) {
		boardStore.removeWidget(widget.id);
	}

	onMount(async () => {
		// Prevent multiple initializations
		if (isInitialized) return;

		try {
			if (boardData) {
				console.log('Loading board state with server-provided data:', boardData);
				await boardStore.loadBoardState(boardData);
				// Use setTimeout to break the reactive cycle
				setTimeout(() => {
					onBoardLoaded?.({ rows: boardData.rows, columns: boardData.columns });
				}, 0);
			} else {
				console.log('Loading board state from database (fallback)');

				// Load board state and get the actual dimensions
				const response = await fetch('/api/creative');
				if (response.ok) {
					const data = await response.json();
					console.log('Loaded board data:', data);

					// Load the board state using the fetched data
					await boardStore.loadBoardState(data);

					// Use setTimeout to break the reactive cycle and prevent parent updates from causing re-runs
					setTimeout(() => {
						onBoardLoaded?.({ rows: data.rows, columns: data.columns });
					}, 0);
				} else {
					throw new Error('Failed to load board state');
				}
			}
		} catch (error) {
			console.error('Failed to load board state:', error);
			boardStore.initializeBoard(rows, columns);
			setTimeout(() => {
				onBoardLoaded?.({ rows, columns });
			}, 0);
		} finally {
			isInitialized = true;
		}
	});

	// Create CSS custom properties from theme
	let themeStyles = $derived(theme ? `
		--theme-background: ${theme.background};
		--theme-foreground: ${theme.foreground};
		--theme-stroke: ${theme.stroke};
		--theme-button-color: ${theme.buttonColor};
		--theme-button-background: ${theme.buttonBackground};
		--theme-shadow-default: ${theme.shadow.default};
		--theme-shadow-active: ${theme.shadow.active};
		--theme-shadow-hovered: ${theme.shadow.hovered};
		--theme-shadow-disabled: ${theme.shadow.disabled};
		--theme-shadow-highlighted: ${theme.shadow.highlighted};
		--theme-button-rounding: ${theme.buttonRounding}px;
	` : '');
</script>

<div class="max-w-full items-center justify-center pt-12 transition-all" style={themeStyles}>
	<DragDropManager
		{rows}
		{columns}
		bind:draggedWidget
		{cellDimensions}
		{isMobile}
		onPositionUpdate={(e) => {
			targetCol = e.col;
		}}
		onDrop={(e) => handleDrop(e)}
		onDragLeave={() => {
			console.log('Board:: onDragLeave called - clearing dragStore');
			draggingWidgetId = null;
			$dragStore.isActive = false;
			$dragStore.widgetData = null;
		}}
	>
		<div
			bind:this={boardElement}
			class="relative flex-shrink max-w-full"
			style="
				height: {minRowHeight * rows}px;
				width: {boardWidth}px;
			"
		>
			<BoardGrid
				{isPublicView}
				{rows}
				{columns}
				{cellDimensions}
				draggedWidget={$dragStore.widgetData}
				targetRow={1}
				targetCol={1}
				isValid={$dragStore.isActive ?? false}
				board={boardStore.getCurrentBoardState(isMobile)}
			/>

			{#each activeWidgets as widget (widget.id)}
				<WidgetContainer
					{isMobile}
					{widget}
					{cellDimensions}
					{isPublicView}
					{editingWidgetId}
					{draggingWidgetId}
					{targetCol}
					{saveSuccess}
					{boardElement}
					{rows}
					{columns}
					on:startedDrag={(e) => {
						console.log('Board:: startedDrag', widget);
						draggingWidgetId = widget.id;
						$dragStore.isActive = true;
						$dragStore.widgetData = widget;
					}}
					on:endedDrag={() => {
						draggingWidgetId = null;
						$dragStore.isActive = false;
						$dragStore.widgetData = null;
					}}
					on:edit={() => {
						editingWidgetId = widget.id;
					}}
					on:delete={() => deleteWidget(widget)}
					on:resize={(e) => {
						console.log('Board:: resizing widget', widget, 'new size:', e.detail.size);
						boardStore.resizeWidget(e.detail.id, e.detail.size, isMobile);
					}}
				/>
			{/each}
		</div>
	</DragDropManager>
</div>

<style>
	/* Apply theme colors to the board container and widgets */
	:global(.board-container) {
		background-color: var(--theme-background, transparent);
		border-color: var(--theme-stroke, #e5e7eb);
	}
	
	:global(.widget-container) {
		background-color: var(--theme-background, #ffffff);
		border-color: var(--theme-stroke, #e5e7eb);
		color: var(--theme-foreground, #000000);
		box-shadow: 0 1px 3px 0 var(--theme-shadow-color, rgba(0, 0, 0, 0.1));
	}
	
	:global(.widget-button) {
		background-color: var(--theme-button-background, #3b82f6);
		color: var(--theme-button-color, #ffffff);
		border-color: var(--theme-stroke, #e5e7eb);
	}
	
	:global(.widget-button:hover) {
		background-color: var(--theme-button-background, #3b82f6);
		opacity: 0.9;
	}
</style>
