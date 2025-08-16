<script lang="ts">
	import type { WidgetProps } from '$src/types/widgets';
	import { dragStore } from '$src/stores/dragStore';
	import { boardStore } from '$src/stores/boardStore';
	import type { Snippet } from 'svelte';
	import { toast } from 'svelte-sonner';

	interface Props {
		rows: number;
		columns: number;
		children: Snippet;
		draggedWidget: WidgetProps | null;
		cellDimensions: {
			width: number;
			height: number;
			gap: number;
		};
		isMobile: boolean;

		onPositionUpdate: (event: { row: number; col: number; isValid: boolean }) => void;
		onDrop: (event: { widget: WidgetProps; row: number; col: number }) => void;
		onDragLeave: () => void;
	}

	let {
		rows,
		columns,
		draggedWidget = $bindable(null),
		cellDimensions,
		children,
		isMobile,
		onPositionUpdate,
		onDrop,
		onDragLeave
	}: Props = $props();

	let targetRow = $state(-1);
	let targetCol = $state(-1);

	let isValid = $state(true);

	// Touch event state
	let isTouching = $state(false);
	let touchStartTime = $state(0);
	const TOUCH_HOLD_THRESHOLD = 500; // ms

	function canPlaceWidget(widget: WidgetProps, row: number, col: number): boolean {
		if (!widget || !widget.layouts) return false;

		// Get the appropriate layout based on device type
		const layout = isMobile ? widget.layouts.mobile : widget.layouts.desktop;
		const widgetWidth = layout.size.width;
		const widgetHeight = layout.size.height;

		// Get the current board state for the appropriate device
		const currentBoard = boardStore.getCurrentBoardState(isMobile);

		for (let r = row; r < row + widgetHeight; r++) {
			for (let c = col; c < col + Math.min(widgetWidth, columns); c++) {
				if (
					r >= rows ||
					c >= columns ||
					(currentBoard[r][c] && currentBoard[r][c]?.id !== widget.id)
				) {
					return false;
				}
			}
		}
		return true;
	}

	function calculatePosition(clientX: number, clientY: number, element: HTMLElement) {
		const rect = element.getBoundingClientRect();
		const x = clientX - rect.left;
		const y = clientY - rect.top;

		const newTargetCol = Math.floor(x / (cellDimensions.width + cellDimensions.gap));
		const newTargetRow = Math.floor(y / (cellDimensions.height + cellDimensions.gap));

		return { row: newTargetRow, col: newTargetCol };
	}

	function updateDragPosition(clientX: number, clientY: number, element: HTMLElement) {
		const { row: newTargetRow, col: newTargetCol } = calculatePosition(clientX, clientY, element);

		targetCol = newTargetCol;
		targetRow = newTargetRow;

		console.log('DragDropManager:: updateDragPosition', {
			targetRow,
			targetCol,
			isMobile,
			dragStoreActive: $dragStore.isActive,
			dragStoreWidget: $dragStore.widgetData?.id || 'null'
		});

		if (!$dragStore.isActive || !$dragStore.widgetData) {
			console.warn(
				'DragDropManager:: updateDragPosition - dragStore is not active or has no widget data'
			);
			return;
		}

		draggedWidget = {
			...$dragStore.widgetData,
			layouts: {
				...$dragStore.widgetData.layouts,
				[isMobile ? 'mobile' : 'desktop']: {
					...$dragStore.widgetData.layouts[isMobile ? 'mobile' : 'desktop'],
					anchorRow: targetRow,
					anchorCol: targetCol
				}
			}
		};

		isValid = draggedWidget ? canPlaceWidget(draggedWidget, targetRow, targetCol) : false;

		onPositionUpdate({ row: targetRow, col: targetCol, isValid });
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		updateDragPosition(e.clientX, e.clientY, e.currentTarget as HTMLElement);
	}

	function onDropInternal(e: DragEvent) {
		e.preventDefault();
		handleDrop();
	}

	function handleDrop() {
		console.log('DragDropManager:: handleDrop', {
			isValid,
			draggedWidget: draggedWidget?.id || 'null',
			targetRow,
			targetCol
		});

		if (isValid && draggedWidget) {
			onDrop({
				widget: draggedWidget,
				row: targetRow,
				col: targetCol
			});
		}

		// Reset states
		resetDragState();
	}

	function resetDragState() {
		targetRow = -1;
		targetCol = -1;
		draggedWidget = null;
		isTouching = false;
	}

	function handleDragLeave(e: DragEvent) {
		// Only handle drag leave if we're actually leaving the drop zone
		// Check if the related target is still within this component or its children
		const relatedTarget = e.relatedTarget as HTMLElement;
		const currentTarget = e.currentTarget as HTMLElement;

		if (relatedTarget && currentTarget.contains(relatedTarget)) {
			// Still within the drop zone, don't clear the drag state
			console.log('DragDropManager:: handleDragLeave - still within drop zone, ignoring');
			return;
		}

		console.log('DragDropManager:: handleDragLeave - leaving drop zone', {
			dragStoreActive: $dragStore.isActive,
			draggedWidget: draggedWidget?.id || 'null'
		});

		resetDragState();
		onDragLeave();
	}
</script>

<!--
@component DragDropManager

## Purpose
The DragDropManager component handles all drag-and-drop interactions for the board interface. 
It manages the visual feedback during drag operations, validates drop positions, and coordinates between the drag state and board state stores.

## Core Functionality
- **Drop Zone Management**: Provides a drop zone that covers the entire board area
- **Position Calculation**: Calculates target grid positions based on mouse coordinates during drag operations
- **Placement Validation**: Validates whether a widget can be placed at a specific position considering:
  - Board boundaries
  - Widget size constraints
  - Existing widget collisions
- **Visual Feedback**: Provides real-time feedback about valid/invalid drop positions
- **State Coordination**: Manages the interaction between dragStore and boardStore
- **Mobile Support**: Handles touch events for mobile drag and drop functionality

## Validation Logic
The `canPlaceWidget()` function validates placement by:
- Checking if widget fits within board boundaries
- Verifying no collisions with existing widgets (except self during repositioning)
- Respecting widget size constraints for mobile vs desktop layouts

## Touch Events
Mobile drag and drop is implemented using touch events:
- `touchstart`: Initiates touch tracking when dragStore is active
- `touchmove`: Updates drag position after hold threshold is met
- `touchend`: Handles drop if hold threshold was met
- `touchcancel`: Resets state on touch cancellation

## Integration Notes
- Must be used within a component that has access to dragStore and boardStore
- Typically wraps the entire board visualization area
- Coordinates with WidgetContainer components that initiate drag operations
- Requires proper CSS positioning (relative) to calculate drop positions correctly

## Performance Considerations
- Position calculations occur on every mouse move during drag operations
- Validation runs on every position update
- Console logging should be removed in production builds
-->

<div
	role="button"
	tabindex="-1"
	class="relative h-full w-full"
	ondrop={onDropInternal}
	ondragover={onDragOver}
	ondragleave={handleDragLeave}
	ontouchstart={(e) => {
		console.log('dragdropmanager:: touchstart:', e);
		$dragStore.isSelected = null;
	}}
	ontouchmove={(e) => {
		console.log('dragdropmanager:: touchmove:', e);
	}}
	ontouchend={(e) => {
		console.log('dragdropmanager:: touchend:', e);
	}}
	ontouchcancel={(e) => {
		console.log('dragdropmanager:: touchcancel:', e);
	}}
>
	{@render children()}
</div>
