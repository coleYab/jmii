import type { IBoardState, WidgetProps } from '$src/types/widgets';
import { BOARD_CONFIG } from '../board/board.config';
import { canFitWidget, findNextAvailablePosition, getWidgetsFromState } from './utils';

export const widgetPlaceUpdater = (state: IBoardState, widget: WidgetProps, isMobile: boolean) => {
	console.log('=== widgetPlaceUpdater START ===', {
		viewport: isMobile ? 'MOBILE' : 'DESKTOP',
		primaryLayoutBeingEdited: isMobile ? 'mobile' : 'desktop',
		secondaryLayoutBeingEdited: isMobile ? 'desktop' : 'mobile',
		widgetId: widget.id,
		widgetType: widget.type,
		currentLayout: isMobile ? widget.layouts.mobile : widget.layouts.desktop,
		stateSize: `${state.length}x${state[0]?.length || 0}`
	});

	// Create a deep copy of the widget to avoid mutations
	const widgetCopy = {
		...widget,
		layouts: {
			desktop: { ...widget.layouts.desktop, size: { ...widget.layouts.desktop.size } },
			mobile: { ...widget.layouts.mobile, size: { ...widget.layouts.mobile.size } }
		}
	};

	// Placement depends on viewport type
	// in both cases , the widget still has to join the board , but if it was placed on a mobile layout ,
	// its position on the desktop layout should be the next available position based on the utils function

	// Same manner , if the widget was placed on a desktop layout , its position on the mobile layout should
	// be the next available position based on the utils function

	const newState = [...state];

	// Get the current layout based on device type
	const currentLayout = isMobile ? widgetCopy.layouts.mobile : widgetCopy.layouts.desktop;

	console.log('widgetPlaceUpdater placing widget on primary layout', {
		primaryLayout: isMobile ? 'mobile' : 'desktop',
		anchorRow: currentLayout.anchorRow,
		anchorCol: currentLayout.anchorCol,
		size: currentLayout.size,
		boardBounds: `${newState.length}x${newState[0]?.length || 0}`
	});

	// Place widget in new position using the current layout
	for (
		let r = currentLayout.anchorRow;
		r < currentLayout.anchorRow + currentLayout.size.height;
		r++
	) {
		for (
			let c = currentLayout.anchorCol;
			c < currentLayout.anchorCol + Math.min(currentLayout.size.width, 2);
			c++
		) {
			if (r < newState.length && c < newState[0].length) {
				console.log(`widgetPlaceUpdater placing at [${r}][${c}]`);
				newState[r][c] = widgetCopy;
			} else {
				console.warn(
					`widgetPlaceUpdater out of bounds: [${r}][${c}] vs [${newState.length}][${newState[0]?.length || 0}]`
				);
			}
		}
	}

	// Now set the position for the other layout to the next available position
	const otherLayoutColumns = isMobile
		? BOARD_CONFIG.DEFAULT_COLUMNS_DESKTOP
		: BOARD_CONFIG.DEFAULT_COLUMNS_MOBILE;
	// Desktop has 4 columns, mobile has 2
	const otherLayoutPosition = findNextAvailablePosition(
		newState,
		widgetCopy,
		otherLayoutColumns,
		!isMobile
	);

	if (otherLayoutPosition) {
		console.log('widgetPlaceUpdater found other layout position', {
			secondaryLayout: isMobile ? 'desktop' : 'mobile',
			position: otherLayoutPosition
		});
		// Update the other layout's position on the widget copy
		if (isMobile) {
			// Currently mobile, so update desktop layout
			widgetCopy.layouts.desktop.anchorRow = otherLayoutPosition.row;
			widgetCopy.layouts.desktop.anchorCol = otherLayoutPosition.col;
		} else {
			// Currently desktop, so update mobile layout
			widgetCopy.layouts.mobile.anchorRow = otherLayoutPosition.row;
			widgetCopy.layouts.mobile.anchorCol = otherLayoutPosition.col;
		}

		// Now update all cells in the state to use the updated widget copy
		for (
			let r = currentLayout.anchorRow;
			r < currentLayout.anchorRow + currentLayout.size.height;
			r++
		) {
			for (
				let c = currentLayout.anchorCol;
				c < currentLayout.anchorCol + Math.min(currentLayout.size.width, 2);
				c++
			) {
				if (r < newState.length && c < newState[0].length) {
					newState[r][c] = widgetCopy;
				}
			}
		}
	} else {
		console.warn('widgetPlaceUpdater could not find position for other layout', {
			secondaryLayout: isMobile ? 'desktop' : 'mobile'
		});
	}

	console.log('=== widgetPlaceUpdater END ===', {
		viewport: isMobile ? 'MOBILE' : 'DESKTOP',
		widgetId: widgetCopy.id,
		finalLayouts: widgetCopy.layouts
	});

	return newState;
};

export const widgetPositionUpdater = (
	state: IBoardState,
	widgetId: string,
	newRow: number,
	newCol: number,
	isMobile: boolean
) => {
	console.log('=== widgetPositionUpdater START ===', {
		viewport: isMobile ? 'MOBILE' : 'DESKTOP',
		layoutBeingEdited: isMobile ? 'mobile' : 'desktop',
		widgetId,
		newPosition: { row: newRow, col: newCol }
	});

	// Create a new state array to maintain immutability
	const newState = state.map((row) => [...row]);

	// Find the widget and its first occurrence
	let widget: WidgetProps | undefined;
	const oldPositions: { row: number; col: number }[] = [];

	// Find all positions and the widget
	state.forEach((row, rowIndex) => {
		row.forEach((cell, colIndex) => {
			if (cell?.id === widgetId) {
				if (!widget) {
					widget = { ...cell };
				}
				oldPositions.push({ row: rowIndex, col: colIndex });
			}
		});
	});

	if (!widget) {
		console.warn('widgetPositionUpdater: widget not found', { widgetId });
		return state;
	}

	console.log('widgetPositionUpdater found widget', {
		oldPositions,
		currentLayouts: widget.layouts
	});

	// Clear old positions
	oldPositions.forEach((pos) => {
		newState[pos.row][pos.col] = null;
	});

	// Get the appropriate layout based on device type
	const layout = isMobile ? widget.layouts.mobile : widget.layouts.desktop;

	console.log('widgetPositionUpdater updating layout', {
		layoutBeingUpdated: isMobile ? 'mobile' : 'desktop',
		oldAnchor: { row: layout.anchorRow, col: layout.anchorCol },
		newAnchor: { row: newRow, col: newCol }
	});

	// Update widget anchor position in the appropriate layout
	if (isMobile) {
		widget.layouts.mobile.anchorRow = newRow;
		widget.layouts.mobile.anchorCol = newCol;
	} else {
		widget.layouts.desktop.anchorRow = newRow;
		widget.layouts.desktop.anchorCol = newCol;
	}

	// Place widget in new position using the appropriate layout
	for (let r = newRow; r < newRow + layout.size.height; r++) {
		for (let c = newCol; c < newCol + Math.min(layout.size.width, newState[0].length); c++) {
			if (r < newState.length && c < newState[0].length) {
				newState[r][c] = widget;
			}
		}
	}

	console.log('=== widgetPositionUpdater END ===', {
		viewport: isMobile ? 'MOBILE' : 'DESKTOP',
		widgetId,
		updatedLayouts: widget.layouts
	});

	return newState;
};

export const widgetPropsUpdater = (
	state: IBoardState,
	id: string,
	newProps: Record<string, any>
) => {
	console.log('=== widgetPropsUpdater START ===', {
		widgetId: id,
		newProps,
		note: 'This updater does not operate on specific viewport/layout - updates widget props globally'
	});

	const newState = state.map((row) =>
		row.map((cell) => {
			if (cell?.id === id) {
				return {
					...cell,
					specificProps: { ...cell.specificProps, ...newProps }
				};
			}
			return cell;
		})
	);

	console.log('=== widgetPropsUpdater END ===', {
		widgetId: id,
		updatedState: 'Updated all instances of widget in state'
	});

	return newState;
};

// Has to return an updated board
export const boardResizeUpdater = (state: IBoardState, toDesktop: boolean, isMobile: boolean) => {
	console.log('=== boardResizeUpdater START ===', {
		viewport: isMobile ? 'MOBILE' : 'DESKTOP',
		layoutBeingProcessed: isMobile ? 'mobile' : 'desktop',
		boardResize: { toDesktop, isMobile },
		currentBoardSize: `${state.length}x${state[0]?.length || 0}`
	});

	// Start newcols with mobile and expand to desktop if selected
	let newColumns: number = toDesktop ? BOARD_CONFIG.DEFAULT_COLUMNS_DESKTOP : BOARD_CONFIG.DEFAULT_COLUMNS_MOBILE;
	let newRows = state.length;

	// Collect all widgets from current state
	const widgets = getWidgetsFromState(state);

	console.log('boardResizeUpdater collected widgets', {
		widgetCount: widgets.length,
		widgetIds: widgets.map((w) => w.id)
	});

	// Create new empty board
	const newBoard = Array(newRows)
		.fill(null)
		.map(() => Array(newColumns).fill(null));

	// Sort widgets by their original position (top to bottom, left to right)
	// Use the appropriate layout for sorting
	widgets.sort((a, b) => {
		const layoutA = isMobile ? a.layouts.mobile : a.layouts.desktop;
		const layoutB = isMobile ? b.layouts.mobile : b.layouts.desktop;

		if (layoutA.anchorRow === layoutB.anchorRow) {
			return layoutA.anchorCol - layoutB.anchorCol;
		}
		return layoutA.anchorRow - layoutB.anchorRow;
	});

	// Attempt to place each widget in the new board
	widgets.forEach((widget) => {
		const layout = isMobile ? widget.layouts.mobile : widget.layouts.desktop;

		console.log('boardResizeUpdater processing widget', {
			widgetId: widget.id,
			layoutUsed: isMobile ? 'mobile' : 'desktop',
			originalPosition: { row: layout.anchorRow, col: layout.anchorCol },
			size: layout.size
		});

		// Try to place widget at its original position first
		if (canFitWidget(newBoard, widget, layout.anchorRow, layout.anchorCol, newColumns, isMobile)) {
			console.log('boardResizeUpdater placing widget at original position', {
				widgetId: widget.id,
				position: { row: layout.anchorRow, col: layout.anchorCol }
			});
			// Place widget in original position
			for (let r = layout.anchorRow; r < layout.anchorRow + layout.size.height; r++) {
				for (let c = layout.anchorCol; c < layout.anchorCol + Math.min(layout.size.width, 2); c++) {
					if (r < newRows && c < newColumns) {
						newBoard[r][c] = widget;
					}
				}
			}
		} else {
			// Find next available position
			const newPosition = findNextAvailablePosition(newBoard, widget, newColumns, isMobile);
			if (newPosition) {
				console.log('boardResizeUpdater repositioning widget', {
					widgetId: widget.id,
					layoutBeingUpdated: isMobile ? 'mobile' : 'desktop',
					oldPosition: { row: layout.anchorRow, col: layout.anchorCol },
					newPosition
				});
				// Update widget anchor position in the appropriate layout
				const updatedWidget = { ...widget };
				if (isMobile) {
					updatedWidget.layouts.mobile.anchorRow = newPosition.row;
					updatedWidget.layouts.mobile.anchorCol = newPosition.col;
				} else {
					updatedWidget.layouts.desktop.anchorRow = newPosition.row;
					updatedWidget.layouts.desktop.anchorCol = newPosition.col;
				}

				const updatedLayout = isMobile
					? updatedWidget.layouts.mobile
					: updatedWidget.layouts.desktop;

				// Place widget in new position
				for (let r = newPosition.row; r < newPosition.row + updatedLayout.size.height; r++) {
					for (
						let c = newPosition.col;
						c < newPosition.col + Math.min(updatedLayout.size.width, 2);
						c++
					) {
						if (r < newRows && c < newColumns) {
							newBoard[r][c] = updatedWidget;
						}
					}
				}
			} else {
				console.warn('boardResizeUpdater could not place widget - dropping', {
					widgetId: widget.id,
					layoutAttempted: isMobile ? 'mobile' : 'desktop'
				});
			}
			// If no position found, widget is implicitly dropped
		}
	});

	console.log('=== boardResizeUpdater END ===', {
		viewport: isMobile ? 'MOBILE' : 'DESKTOP',
		finalBoardSize: `${newRows}x${newColumns}`
	});

	return newBoard;
};

export const widgetPlaceOnlyUpdater = (
	state: IBoardState,
	widget: WidgetProps,
	isMobile: boolean
) => {
	console.log('=== widgetPlaceOnlyUpdater START ===', {
		viewport: isMobile ? 'MOBILE' : 'DESKTOP',
		layoutBeingUsed: isMobile ? 'mobile' : 'desktop',
		note: 'This updater ONLY places on current layout, no secondary layout update',
		widgetId: widget.id,
		widgetType: widget.type,
		currentLayout: isMobile ? widget.layouts.mobile : widget.layouts.desktop,
		stateSize: `${state.length}x${state[0]?.length || 0}`
	});

	// Create a deep copy of the widget to avoid mutations
	const widgetCopy = {
		...widget,
		layouts: {
			desktop: { ...widget.layouts.desktop, size: { ...widget.layouts.desktop.size } },
			mobile: { ...widget.layouts.mobile, size: { ...widget.layouts.mobile.size } }
		}
	};

	const newState = [...state];

	// Get the current layout based on device type
	const currentLayout = isMobile ? widgetCopy.layouts.mobile : widgetCopy.layouts.desktop;

	console.log('widgetPlaceOnlyUpdater placing widget using layout', {
		layoutUsed: isMobile ? 'mobile' : 'desktop',
		anchorRow: currentLayout.anchorRow,
		anchorCol: currentLayout.anchorCol,
		size: currentLayout.size,
		boardBounds: `${newState.length}x${newState[0]?.length || 0}`
	});

	// Place widget in position using the current layout (NO OTHER LAYOUT UPDATE)
	for (
		let r = currentLayout.anchorRow;
		r < currentLayout.anchorRow + currentLayout.size.height;
		r++
	) {
		for (
			let c = currentLayout.anchorCol;
			c < currentLayout.anchorCol + Math.min(currentLayout.size.width, 2);
			c++
		) {
			if (r < newState.length && c < newState[0].length) {
				console.log(`widgetPlaceOnlyUpdater placing at [${r}][${c}]`);
				newState[r][c] = widgetCopy;
			} else {
				console.warn(
					`widgetPlaceOnlyUpdater out of bounds: [${r}][${c}] vs [${newState.length}][${newState[0]?.length || 0}]`
				);
			}
		}
	}

	console.log('=== widgetPlaceOnlyUpdater END ===', {
		viewport: isMobile ? 'MOBILE' : 'DESKTOP',
		widgetId: widgetCopy.id,
		finalLayouts: widgetCopy.layouts,
		note: 'No secondary layout was modified'
	});

	return newState;
};

export const resizeWidgetUpdater = (
	state: IBoardState,
	id: string,
	newSize: { width: number; height: number },
	isMobile: boolean = false
) => {
	console.log('=== resizeWidgetUpdater START ===', {
		viewport: isMobile ? 'MOBILE' : 'DESKTOP',
		layoutBeingResized: isMobile ? 'mobile' : 'desktop',
		layoutNotResized: isMobile ? 'desktop' : 'mobile',
		widgetId: id,
		newSize,
		boardStateSize: `${state.length}x${state[0]?.length || 0}`
	});

	// Find the widget and its position
	let widget: WidgetProps | null = null;
	let anchorRow = -1;
	let anchorCol = -1;

	// Find the widget's current position and reference
	for (let r = 0; r < state.length; r++) {
		for (let c = 0; c < state[0].length; c++) {
			const cell = state[r][c];
			if (cell?.id === id) {
				const layout = isMobile ? cell.layouts.mobile : cell.layouts.desktop;
				if (layout.anchorRow === r && layout.anchorCol === c) {
					widget = cell;
					anchorRow = r;
					anchorCol = c;
					break;
				}
			}
		}
		if (widget) break;
	}

	if (!widget) {
		console.warn('resizeWidgetUpdater: widget not found', { widgetId: id });
		return state; // Widget not found
	}

	console.log('resizeWidgetUpdater found widget', {
		widgetId: id,
		currentPosition: { anchorRow, anchorCol },
		currentLayouts: widget.layouts,
		layoutBeingResized: isMobile ? 'mobile' : 'desktop'
	});

	// Create a clean board state without the current widget
	const clearedState = state.map((row) => row.map((cell) => (cell?.id === id ? null : cell)));

	// Create the resized widget with updated layout
	const resizedWidget: WidgetProps = {
		...widget,
		layouts: {
			...widget.layouts,
			[isMobile ? 'mobile' : 'desktop']: {
				...widget.layouts[isMobile ? 'mobile' : 'desktop'],
				size: {
					width: Math.min(newSize.width, 2), // Enforce max width of 2
					height: newSize.height
				}
			}
		}
	};

	console.log('resizeWidgetUpdater created resized widget', {
		widgetId: id,
		layoutUpdated: isMobile ? 'mobile' : 'desktop',
		oldSize: widget.layouts[isMobile ? 'mobile' : 'desktop'].size,
		newSize: resizedWidget.layouts[isMobile ? 'mobile' : 'desktop'].size,
		otherLayoutUnchanged: isMobile
			? resizedWidget.layouts.desktop.size
			: resizedWidget.layouts.mobile.size
	});

	// Try to place widget in its original position first
	if (canFitWidget(clearedState, resizedWidget, anchorRow, anchorCol, state[0].length, isMobile)) {
		const layout = isMobile ? resizedWidget.layouts.mobile : resizedWidget.layouts.desktop;

		console.log('resizeWidgetUpdater placing resized widget at original position', {
			position: { anchorRow, anchorCol },
			layoutUsed: isMobile ? 'mobile' : 'desktop'
		});

		// Place widget in original position
		for (let r = anchorRow; r < anchorRow + layout.size.height; r++) {
			for (let c = anchorCol; c < anchorCol + layout.size.width; c++) {
				if (r < clearedState.length && c < clearedState[0].length) {
					clearedState[r][c] = resizedWidget;
				}
			}
		}
	} else {
		// Find next available position
		const newPosition = findNextAvailablePosition(
			clearedState,
			resizedWidget,
			state[0].length,
			isMobile
		);
		if (newPosition) {
			console.log('resizeWidgetUpdater repositioning resized widget', {
				layoutBeingUpdated: isMobile ? 'mobile' : 'desktop',
				oldPosition: { anchorRow, anchorCol },
				newPosition
			});
			// Update widget anchor position in the appropriate layout
			const repositionedWidget = { ...resizedWidget };
			if (isMobile) {
				repositionedWidget.layouts.mobile.anchorRow = newPosition.row;
				repositionedWidget.layouts.mobile.anchorCol = newPosition.col;
			} else {
				repositionedWidget.layouts.desktop.anchorRow = newPosition.row;
				repositionedWidget.layouts.desktop.anchorCol = newPosition.col;
			}

			const repositionedLayout = isMobile
				? repositionedWidget.layouts.mobile
				: repositionedWidget.layouts.desktop;

			// Place widget in new position
			for (let r = newPosition.row; r < newPosition.row + repositionedLayout.size.height; r++) {
				for (let c = newPosition.col; c < newPosition.col + repositionedLayout.size.width; c++) {
					if (r < clearedState.length && c < clearedState[0].length) {
						clearedState[r][c] = repositionedWidget;
					}
				}
			}
		} else {
			console.warn('resizeWidgetUpdater could not place resized widget - dropping', {
				widgetId: id,
				layoutAttempted: isMobile ? 'mobile' : 'desktop'
			});
		}
		// If no position found, widget will be implicitly removed
	}

	console.log('=== resizeWidgetUpdater END ===', {
		viewport: isMobile ? 'MOBILE' : 'DESKTOP',
		widgetId: id,
		layoutResized: isMobile ? 'mobile' : 'desktop'
	});

	return clearedState;
};
