import type { IBoardState, WidgetProps } from '../types/widgets';
import { get, writable } from 'svelte/store';
import {
	boardResizeUpdater,
	resizeWidgetUpdater,
	widgetPlaceUpdater,
	widgetPlaceOnlyUpdater,
	widgetPositionUpdater,
	widgetPropsUpdater
} from './functions/updaters';
import { authClient } from '$lib/auth-client';
import { canFitWidget, findNextAvailablePosition } from './functions/utils';
import { BOARD_CONFIG } from '$src/stores/board/board.config';
import type { BoardStore } from './types';

// Auto-save functionality - using dynamic import to avoid circular dependency
let autoSaveStore: any = null;
async function getAutoSaveStore() {
	if (!autoSaveStore) {
		const module = await import('./autoSaveStore');
		autoSaveStore = module.autoSaveStore;
	}
	return autoSaveStore;
}

// This store manages the state of the board, including widget placement and removal
// It tracks both mobile and desktop board states

interface DualBoardState {
	viewport: 'mobile' | 'desktop';
	desktop: IBoardState; // The renderable 2d array of widgets currently on desktop layout
	mobile: IBoardState; // The renderable 2d array of widgets currently on mobile layout
	widgets: WidgetProps[]; // Shared widget list with layouts for both desktop and mobile
}

function createBoardStore() {
	const session = authClient.useSession();
	
	// Create a writable store with empty arrays as initial state
	const { subscribe, set, update } = writable<DualBoardState>({
		viewport: 'desktop',
		desktop: [],
		mobile: [],
		widgets: []
	});

	// Get user data reactively from session when needed

	function updateWidgetPosition(widgetId: string, newRow: number, newCol: number, isMobile: boolean) {
		console.log('BoardStore:: updateWidgetPosition called', {
			widgetId,
			newRow,
			newCol,
			isMobile
		});
		
		update((state) => {
			console.log('BoardStore:: updateWidgetPosition - current state', {
				currentWidgetCount: state.widgets.length,
				desktopBoardSize: `${state.desktop.length}x${state.desktop[0]?.length || 0}`,
				mobileBoardSize: `${state.mobile.length}x${state.mobile[0]?.length || 0}`
			});
			
			// Update the board state
			const updatedBoard = widgetPositionUpdater(
				isMobile ? state.mobile : state.desktop, 
				widgetId, 
				newRow, 
				newCol, 
				isMobile
			);
			
			// Also update the widget in the widgets array
			const updatedWidgets = state.widgets.map(widget => {
				if (widget.id === widgetId) {
					const updatedWidget = { ...widget };
					// Update the appropriate layout
					if (isMobile) {
						updatedWidget.layouts.mobile.anchorRow = newRow;
						updatedWidget.layouts.mobile.anchorCol = newCol;
					} else {
						updatedWidget.layouts.desktop.anchorRow = newRow;
						updatedWidget.layouts.desktop.anchorCol = newCol;
					}
					console.log('BoardStore:: updateWidgetPosition - updated widget layouts', {
						widgetId: updatedWidget.id,
						layouts: updatedWidget.layouts
					});
					return updatedWidget;
				}
				return widget;
			});
			
			const newState = {
				...state,
				widgets: updatedWidgets,
				[isMobile ? 'mobile' : 'desktop']: updatedBoard
			};
			
			console.log('BoardStore:: updateWidgetPosition - completed', {
				widgetId,
				updatedBoard: isMobile ? 'mobile' : 'desktop'
			});
			
			// Trigger auto-save for position changes
			getAutoSaveStore().then(store => store?.markChanged());
			
			return newState;
		});
	}

	/**
	 * Initializes both desktop and mobile boards with empty cells
	 */
	const initializeBoard = (rows: number, desktopColumns: number, mobileColumns: number = 2) => {
		// Validate inputs to prevent RangeError
		if (!Number.isInteger(rows) || rows < 0) {
			console.error('Invalid rows value:', rows);
			rows = BOARD_CONFIG.DEFAULT_ROWS;
		}
		if (!Number.isInteger(desktopColumns) || desktopColumns < 0) {
			console.error('Invalid desktopColumns value:', desktopColumns);
			desktopColumns = BOARD_CONFIG.DEFAULT_COLUMNS_DESKTOP;
		}
		if (!Number.isInteger(mobileColumns) || mobileColumns < 0) {
			console.error('Invalid mobileColumns value:', mobileColumns);
			mobileColumns = BOARD_CONFIG.DEFAULT_COLUMNS_MOBILE;
		}
		
		desktopColumns = Math.max(BOARD_CONFIG.MIN_COLUMNS, desktopColumns);
		mobileColumns = Math.max(BOARD_CONFIG.MIN_COLUMNS, mobileColumns);
		rows = Math.max(BOARD_CONFIG.MIN_ROWS, rows);
		
		try {
			set({
				viewport: 'desktop',
				desktop: Array(rows).fill(null).map(() => Array(desktopColumns).fill(null)),
				mobile: Array(rows).fill(null).map(() => Array(mobileColumns).fill(null)),
				widgets: []
			});
		} catch (error) {
			console.error('Error creating board arrays:', error);
			// Fallback to default values
			set({
				viewport: 'desktop',
				desktop: Array(BOARD_CONFIG.DEFAULT_ROWS).fill(null).map(() => Array(BOARD_CONFIG.DEFAULT_COLUMNS_DESKTOP).fill(null)),
				mobile: Array(BOARD_CONFIG.DEFAULT_ROWS).fill(null).map(() => Array(BOARD_CONFIG.DEFAULT_COLUMNS_MOBILE).fill(null)),
				widgets: []
			});
		}
	};

	/**
	 * Resizes the specified board while attempting to maintain widget positions
	 */
	const resizeBoard = (newRows: number, newColumns: number, isMobile: boolean) => {
		update((state) => {
					const updatedBoard = boardResizeUpdater(
			isMobile ? state.mobile : state.desktop, 
			!isMobile, 
			isMobile
		);
			
			return {
				...state,
				[isMobile ? 'mobile' : 'desktop']: updatedBoard
			};
		});
	};

	/**
	 * Places a widget on both desktop and mobile boards using their respective layouts
	 */
	const placeWidget = (widget: WidgetProps, isMobile: boolean) => {
		console.log('BoardStore:: placeWidget called', {
			widgetId: widget.id,
			widgetType: widget.type,
			isMobile,
			layouts: widget.layouts
		});
		
		update((state) => {
			console.log('BoardStore:: placeWidget - current state', {
				currentWidgetCount: state.widgets.length,
				desktopBoardSize: `${state.desktop.length}x${state.desktop[0]?.length || 0}`,
				mobileBoardSize: `${state.mobile.length}x${state.mobile[0]?.length || 0}`
			});
			
			// Update the widget list
			const updatedWidgets = [...state.widgets, widget];
			
			// Place widget on the current board (mobile or desktop)
			const currentBoard = isMobile ? state.mobile : state.desktop;
			const updatedCurrentBoard = widgetPlaceUpdater(currentBoard, widget, isMobile);
			
			// Place widget on the other board using the other layout
			const otherBoard = isMobile ? state.desktop : state.mobile;
			const updatedOtherBoard = widgetPlaceUpdater(otherBoard, widget, !isMobile);
			
			const newState = {
				...state,
				widgets: updatedWidgets,
				desktop: isMobile ? updatedOtherBoard : updatedCurrentBoard,
				mobile: isMobile ? updatedCurrentBoard : updatedOtherBoard
			};
			
			console.log('BoardStore:: placeWidget - new state', {
				newWidgetCount: newState.widgets.length,
				placedOnBoard: isMobile ? 'mobile' : 'desktop'
			});
			
			// Trigger auto-save for widget placement
			getAutoSaveStore().then(store => store?.markChanged());
			
			return newState;
		});
	};

	/**
	 * Updates the specific props of a widget on both boards
	 */
	const updateWidgetProps = (id: string, newProps: Record<string, any>) => {
		update((state) => {
			// Update widget in the widgets array
			const updatedWidgets = state.widgets.map(widget => 
				widget.id === id 
					? { ...widget, specificProps: { ...widget.specificProps, ...newProps } }
					: widget
			);
			
			// Update widget on both boards
			const updatedDesktop = widgetPropsUpdater(state.desktop, id, newProps);
			const updatedMobile = widgetPropsUpdater(state.mobile, id, newProps);
			
			// Trigger auto-save for property changes
			getAutoSaveStore().then(store => store?.markChanged());
			
			return {
				...state,
				widgets: updatedWidgets,
				desktop: updatedDesktop,
				mobile: updatedMobile
			};
		});
	};

	/**
	 * Resizes a widget on the specified board
	 */
	const resizeWidget = (id: string, newSize: { width: number; height: number }, isMobile: boolean) => {
		console.log('BoardStore:: resizeWidget called', {
			widgetId: id,
			newSize,
			isMobile,
			targetLayout: isMobile ? 'mobile' : 'desktop'
		});
		
		update((state) => {
			// Update the widget in the widgets array
			const updatedWidgets = state.widgets.map(widget => {
				if (widget.id === id) {
					const updatedWidget = {
						...widget,
						layouts: {
							...widget.layouts,
							[isMobile ? 'mobile' : 'desktop']: {
								...widget.layouts[isMobile ? 'mobile' : 'desktop'],
								size: newSize
							}
						}
					};
					
					console.log('BoardStore:: resizeWidget - updated widget layouts', {
						widgetId: id,
						oldLayouts: widget.layouts,
						newLayouts: updatedWidget.layouts,
						updatedLayout: isMobile ? 'mobile' : 'desktop'
					});
					
					return updatedWidget;
				}
				return widget;
			});
			
			// Update the board
			const updatedBoard = resizeWidgetUpdater(
				isMobile ? state.mobile : state.desktop, 
				id, 
				newSize, 
				isMobile
			);
			
			// Trigger auto-save for widget resize
			getAutoSaveStore().then(store => store?.markChanged());
			
			return {
				...state,
				widgets: updatedWidgets,
				[isMobile ? 'mobile' : 'desktop']: updatedBoard
			};
		});
	};

	// Remove a widget from both boards by its ID
	const removeWidget = (id: string) => {
		update((state) => {
			const updatedWidgets = state.widgets.filter(widget => widget.id !== id);
			const updatedDesktop = state.desktop.map(row => 
				row.map(cell => cell?.id === id ? null : cell)
			);
			const updatedMobile = state.mobile.map(row => 
				row.map(cell => cell?.id === id ? null : cell)
			);
			
			// Trigger auto-save for widget removal
			getAutoSaveStore().then(store => store?.markChanged());
			
			return {
				...state,
				widgets: updatedWidgets,
				desktop: updatedDesktop,
				mobile: updatedMobile
			};
		});
	};

	const loadBoardState = async (boardData?: {
		widgets: WidgetProps[];
		rows: number;
		columns: number;
	}) => {
		try {
			if (!boardData) {
				const response = await fetch('/api/creative');
				if (!response.ok) {
					throw new Error('Failed to load board state');
				}
				const data = await response.json();
				console.log('Loading board state with data:', data);

				// Initialize both boards with the loaded dimensions
				initializeBoard(data.rows, data.columns, BOARD_CONFIG.DEFAULT_COLUMNS_MOBILE);

				// Place each widget on both boards
				data.widgets.forEach((widget: WidgetProps) => {
					// Place on desktop first, then mobile
					placeWidget(widget, false); // Desktop
				});
				
				// Clear unsaved changes after loading from API
				getAutoSaveStore().then(store => store?.clearUnsavedChanges());
			} else {
				console.log('Loading board state with provided data:', boardData);
				initializeBoard(boardData.rows, boardData.columns, BOARD_CONFIG.DEFAULT_COLUMNS_MOBILE);
				boardData.widgets.forEach((widget: WidgetProps) => {
					placeWidget(widget, false); // Desktop
				});
				
				// Clear unsaved changes after loading
				getAutoSaveStore().then(store => store?.clearUnsavedChanges());
			}
		} catch (error) {
			console.error('Error loading board state:', error);
			throw error;
		}
	};

	const saveBoardState = async () => {
		try {
			// Get current board state
			let boardState: DualBoardState;
			const currentState = get({ subscribe });
			boardState = currentState;

			const currentSession = get(session);
			const userData = currentSession?.data?.user;
			console.log('User Profile:', userData);

			const response = await fetch('/api/creative', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					widgets: boardState.widgets,
					rows: boardState.desktop.length,
					columns: boardState.desktop[0]?.length || BOARD_CONFIG.DEFAULT_COLUMNS_DESKTOP,
					userProfile: userData
				})
			});

			if (!response.ok) {
				throw new Error('Failed to save board state');
			}

			const savedData = await response.json();
			return savedData;
		} catch (error) {
			console.error('Error saving board state:', error);
			throw error;
		}
	};

	function getActiveWidgets(state: IBoardState, isMobile: boolean): WidgetProps[] {
		return state
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
	}

	const duplicateWidget = (id: string, isMobile: boolean) => {
		update((state) => {
			// Find the original widget
			const originalWidget = state.widgets.find(widget => widget.id === id);

			if (!originalWidget) return state;

			// Create new widget with same properties but new ID
			const newWidget: WidgetProps = {
				...originalWidget,
				id: crypto.randomUUID()
			};

			const currentBoard = isMobile ? state.mobile : state.desktop;
			const originalLayout = isMobile ? originalWidget.layouts.mobile : originalWidget.layouts.desktop;

			// Try to place at original position first
			if (
				canFitWidget(
					currentBoard,
					newWidget,
					originalLayout.anchorRow,
					originalLayout.anchorCol,
					currentBoard[0].length,
					isMobile
				)
			) {
				// Update the appropriate layout
				if (isMobile) {
					newWidget.layouts.mobile.anchorRow = originalLayout.anchorRow;
					newWidget.layouts.mobile.anchorCol = originalLayout.anchorCol;
				} else {
					newWidget.layouts.desktop.anchorRow = originalLayout.anchorRow;
					newWidget.layouts.desktop.anchorCol = originalLayout.anchorCol;
				}
			} else {
				// Find next available position
				const newPosition = findNextAvailablePosition(currentBoard, newWidget, currentBoard[0].length, isMobile);
				if (!newPosition) return state; // If no position found, return unchanged state

				// Update the appropriate layout
				if (isMobile) {
					newWidget.layouts.mobile.anchorRow = newPosition.row;
					newWidget.layouts.mobile.anchorCol = newPosition.col;
				} else {
					newWidget.layouts.desktop.anchorRow = newPosition.row;
					newWidget.layouts.desktop.anchorCol = newPosition.col;
				}
			}

			// Add to widgets list
			const updatedWidgets = [...state.widgets, newWidget];

			// Place the new widget on the current board
			const updatedCurrentBoard = widgetPlaceUpdater(currentBoard, newWidget, isMobile);
			
			// Place the new widget on the other board
			const otherBoard = isMobile ? state.desktop : state.mobile;
			const updatedOtherBoard = widgetPlaceUpdater(otherBoard, newWidget, !isMobile);

			// Trigger auto-save for widget duplication
			getAutoSaveStore().then(store => store?.markChanged());
			
			return {
				...state,
				widgets: updatedWidgets,
				desktop: isMobile ? updatedOtherBoard : updatedCurrentBoard,
				mobile: isMobile ? updatedCurrentBoard : updatedOtherBoard
			};
		});
	};

	/**
	 * Fits desktop widgets to mobile constraints by updating mobile layouts
	 */
	const fitToMobile = (mobileRows: number, mobileColumns: number) => {
		console.log(`📱 Starting fitToMobile: ${mobileRows}x${mobileColumns}`);

		update((state) => {
			// Get all active widgets from desktop board
			const desktopWidgets = getActiveWidgets(state.desktop, false);
			console.log(
				`📊 Found ${desktopWidgets.length} desktop widgets to fit to mobile:`,
				desktopWidgets.map((w) => {
					const layout = w.layouts.desktop; 
					return {
						id: w.id,
						type: w.type,
						pos: `${layout.anchorRow},${layout.anchorCol}`,
						size: `${layout.size.width}x${layout.size.height}`
					};
				})
			);

			// Create new empty mobile board
			const newMobileBoard: IBoardState = Array(mobileRows)
				.fill(null)
				.map(() => Array(mobileColumns).fill(null));

			console.log(`🏗️ Created new mobile board: ${mobileRows}x${mobileColumns}`);

			// Update widgets array with new mobile layouts
			const updatedWidgets = state.widgets.map(widget => {
				// Find corresponding desktop widget
				const desktopWidget = desktopWidgets.find(dw => dw.id === widget.id);
				if (!desktopWidget) return widget; // Widget not on desktop, keep as is

				const desktopLayout = desktopWidget.layouts.desktop;
				const existingMobileLayout = widget.layouts.mobile;
				
				console.log(
					`\n🎯 Processing widget: ${widget.id} (${widget.type})`
				);
				console.log(
					`   Desktop position: ${desktopLayout.anchorRow},${desktopLayout.anchorCol} | Size: ${desktopLayout.size.width}x${desktopLayout.size.height}`
				);
				console.log(
					`   Existing mobile position: ${existingMobileLayout.anchorRow},${existingMobileLayout.anchorCol} | Size: ${existingMobileLayout.size.width}x${existingMobileLayout.size.height}`
				);

				const widgetToPlace = { ...widget };
				const boardColumns = mobileColumns;

				// First, check if the existing mobile layout is valid (doesn't overflow)
				const existingOverflowRows = existingMobileLayout.anchorRow + existingMobileLayout.size.height > mobileRows;
				const existingOverflowCols = existingMobileLayout.anchorCol + existingMobileLayout.size.width > boardColumns;
				const existingOverflow = existingOverflowRows || existingOverflowCols;

				console.log(
					`   🔍 Existing mobile layout check - Rows: ${existingOverflowRows} (${existingMobileLayout.anchorRow + existingMobileLayout.size.height} > ${mobileRows}), Cols: ${existingOverflowCols} (${existingMobileLayout.anchorCol + existingMobileLayout.size.width} > ${boardColumns})`
				);
				console.log(`   📏 Existing mobile layout overflows: ${existingOverflow}`);

				if (existingOverflow) {
					console.log(`   🔧 Existing mobile layout overflows, attempting to fix...`);

					// Calculate maximum size that would fit at existing position
					const maxWidthAtExisting = Math.min(existingMobileLayout.size.width, boardColumns - existingMobileLayout.anchorCol);
					const maxHeightAtExisting = Math.min(existingMobileLayout.size.height, mobileRows - existingMobileLayout.anchorRow);

					console.log(
						`   📐 Max size at existing position: ${maxWidthAtExisting}x${maxHeightAtExisting}`
					);

					// Try to resize to fit at existing position
					if (maxWidthAtExisting > 0 && maxHeightAtExisting > 0) {
						const resizedWidget = {
							...widgetToPlace,
							layouts: {
								...widgetToPlace.layouts,
								mobile: {
									...widgetToPlace.layouts.mobile,
									size: { width: maxWidthAtExisting, height: maxHeightAtExisting }
								}
							}
						};

						// Check if this resized widget can fit at existing position
						const canFitResized = canFitWidget(
							newMobileBoard,
							resizedWidget,
							existingMobileLayout.anchorRow,
							existingMobileLayout.anchorCol,
							boardColumns,
							true // isMobile = true
						);

						console.log(`   ✅ Resized widget can fit at existing position: ${canFitResized}`);

						if (canFitResized) {
							// Place resized widget at existing position
							const updatedState = widgetPlaceOnlyUpdater(newMobileBoard, resizedWidget, true);
							for (let r = 0; r < updatedState.length; r++) {
								for (let c = 0; c < updatedState[r].length; c++) {
									newMobileBoard[r][c] = updatedState[r][c];
								}
							}
							console.log(
								`   ✅ Successfully placed resized widget (${maxWidthAtExisting}x${maxHeightAtExisting}) at existing position`
							);
							return resizedWidget;
						}
					}

					// Find new position with progressive resizing
					console.log(`   🔍 Cannot fit at existing position, searching for new position with progressive resizing...`);

					const maxWidth = Math.min(existingMobileLayout.size.width, boardColumns);
					const maxHeight = Math.min(existingMobileLayout.size.height, mobileRows);

					let placed = false;
					// Try progressively smaller sizes
					for (let h = maxHeight; h >= 1 && !placed; h--) {
						for (let w = maxWidth; w >= 1 && !placed; w--) {
							console.log(`   🔍 Trying size: ${w}x${h}`);

							const resizedWidget = {
								...widgetToPlace,
								layouts: {
									...widgetToPlace.layouts,
									mobile: {
										...widgetToPlace.layouts.mobile,
										size: { width: w, height: h }
									}
								}
							};

							const resizedPosition = findNextAvailablePosition(
								newMobileBoard,
								resizedWidget,
								boardColumns,
								true // isMobile = true
							);

							if (resizedPosition) {
								console.log(
									`   📍 Found position for resized widget: ${resizedPosition.row},${resizedPosition.col}`
								);
								
								// Update widget mobile layout position
								resizedWidget.layouts.mobile.anchorRow = resizedPosition.row;
								resizedWidget.layouts.mobile.anchorCol = resizedPosition.col;

								// Place resized widget
								const updatedState = widgetPlaceOnlyUpdater(newMobileBoard, resizedWidget, true);
								for (let r = 0; r < updatedState.length; r++) {
									for (let c = 0; c < updatedState[r].length; c++) {
										newMobileBoard[r][c] = updatedState[r][c];
									}
								}
								console.log(`   ✅ Successfully placed resized widget (${w}x${h}) at new position`);
								placed = true;
								return resizedWidget;
							}
						}
					}

					if (!placed) {
						console.warn(`   ❌ Widget ${widget.id} could not be placed even after resizing`);
						// Keep original widget with unchanged mobile layout
						return widget;
					}
				} else {
					// Existing mobile layout is valid, try to place at existing position
					const canFitExisting = canFitWidget(
						newMobileBoard,
						widgetToPlace,
						existingMobileLayout.anchorRow,
						existingMobileLayout.anchorCol,
						boardColumns,
						true // isMobile = true
					);

					console.log(`   ✅ Can fit at existing mobile position: ${canFitExisting}`);

					if (canFitExisting) {
						// Keep existing mobile layout unchanged
						// Place widget at existing position
						const updatedState = widgetPlaceOnlyUpdater(newMobileBoard, widgetToPlace, true);
						for (let r = 0; r < updatedState.length; r++) {
							for (let c = 0; c < updatedState[r].length; c++) {
								newMobileBoard[r][c] = updatedState[r][c];
							}
						}
						console.log(`   ✅ Successfully placed at existing mobile position`);
						return widgetToPlace; // Return unchanged widget
					} else {
						console.log(`   🔍 Existing position occupied, searching for new position...`);

						// Try to find a new position for the widget
						const newPosition = findNextAvailablePosition(newMobileBoard, widgetToPlace, boardColumns, true);

						if (newPosition) {
							console.log(`   📍 Found new position: ${newPosition.row},${newPosition.col}`);
							
							// Update widget mobile layout position
							const updatedWidget = {
								...widgetToPlace,
								layouts: {
									...widgetToPlace.layouts,
									mobile: {
										...widgetToPlace.layouts.mobile,
										anchorRow: newPosition.row,
										anchorCol: newPosition.col
									}
								}
							};

							// Place widget at new position
							const updatedState = widgetPlaceOnlyUpdater(newMobileBoard, updatedWidget, true);
							for (let r = 0; r < updatedState.length; r++) {
								for (let c = 0; c < updatedState[r].length; c++) {
									newMobileBoard[r][c] = updatedState[r][c];
								}
							}
							console.log(`   ✅ Successfully placed at new position`);
							return updatedWidget;
						} else {
							console.log(`   🔧 No position found for existing size, attempting to resize...`);

							// Try to resize the widget to fit
							const maxWidth = Math.min(existingMobileLayout.size.width, boardColumns);
							const maxHeight = Math.min(existingMobileLayout.size.height, mobileRows);

							console.log(`   📏 Max resize constraints: ${maxWidth}x${maxHeight}`);

							let placed = false;
							// Try progressively smaller sizes
							for (let h = maxHeight; h >= 1 && !placed; h--) {
								for (let w = maxWidth; w >= 1 && !placed; w--) {
									console.log(`   🔍 Trying size: ${w}x${h}`);

									const resizedWidget = {
										...widgetToPlace,
										layouts: {
											...widgetToPlace.layouts,
											mobile: {
												...widgetToPlace.layouts.mobile,
												size: { width: w, height: h }
											}
										}
									};

									const resizedPosition = findNextAvailablePosition(
										newMobileBoard,
										resizedWidget,
										boardColumns,
										true // isMobile = true
									);

									if (resizedPosition) {
										console.log(
											`   📍 Found position for resized widget: ${resizedPosition.row},${resizedPosition.col}`
										);
										
										// Update widget mobile layout position
										resizedWidget.layouts.mobile.anchorRow = resizedPosition.row;
										resizedWidget.layouts.mobile.anchorCol = resizedPosition.col;

										// Place resized widget
										const updatedState = widgetPlaceOnlyUpdater(newMobileBoard, resizedWidget, true);
										for (let r = 0; r < updatedState.length; r++) {
											for (let c = 0; c < updatedState[r].length; c++) {
												newMobileBoard[r][c] = updatedState[r][c];
											}
										}
										console.log(`   ✅ Successfully placed resized widget (${w}x${h})`);
										placed = true;
										return resizedWidget;
									}
								}
							}

							// If we reach here, the widget couldn't be placed even after resizing
							if (!placed) {
								console.warn(
									`   ❌ Widget ${widget.id} could not be placed on mobile board`
								);
								console.warn(
									`      Existing size: ${existingMobileLayout.size.width}x${existingMobileLayout.size.height}, Max constraints: ${maxWidth}x${maxHeight}`
								);
								// Keep original widget with unchanged mobile layout
								return widget;
							}
						}
					}
				}
			});

			console.log(`🏁 Finished fitToMobile. Mobile board updated with ${updatedWidgets.length} widgets.`);
			
			return {
				...state,
				widgets: updatedWidgets.filter((widget): widget is WidgetProps => widget !== undefined),
				mobile: newMobileBoard
			};
		});
	};

	// Helper function to get current board state for a specific device
	const getCurrentBoardState = (isMobile: boolean) => {
		const currentState = get({ subscribe });
		return isMobile ? currentState.mobile : currentState.desktop;
	};

	// Helper function to get current widgets
	const getCurrentWidgets = () => {
		const currentState = get({ subscribe });
		return currentState.widgets;
	};

	const lastCoveredRow = (widgets: WidgetProps[], isMobile: boolean = false) => {
		let lastRow = 0;

		for (const widget of widgets) {
			const desktopRow = widget.layouts.desktop.anchorRow + widget.layouts.desktop.size.height;
			const mobileRow  = widget.layouts.mobile.anchorRow + widget.layouts.mobile.size.height;
			if (isMobile) {
				lastRow = Math.max(mobileRow, lastRow);
			} else {
				lastRow = Math.max(desktopRow, lastRow)
			}
		}
		
		return lastRow
	}

	// Helper function to check if a row has widgets
	const hasWidgetsInRow = (rowIndex: number, isMobile: boolean) => {
		const currentState = get({ subscribe });
		const boardState = isMobile ? currentState.mobile : currentState.desktop;
		
		if (rowIndex < 0 || rowIndex >= boardState.length) {
			return false;
		}
		
		const row = boardState[rowIndex];
		return row.some(cell => cell !== null && cell !== undefined);
	};

	return {
		subscribe,
		// Board methods
		initializeBoard,
		resizeBoard,
		loadBoardState,
		saveBoardState,
		getCurrentBoardState,
		getCurrentWidgets,
		getActiveWidgets: (isMobile: boolean) => {
			const currentState = get({ subscribe });
			const boardState = isMobile ? currentState.mobile : currentState.desktop;
			const activeWidgets = getActiveWidgets(boardState, isMobile);
			console.log('BoardStore:: getActiveWidgets called', {
				isMobile,
				boardStateSize: `${boardState.length}x${boardState[0]?.length || 0}`,
				activeWidgetsCount: activeWidgets.length,
				activeWidgetIds: activeWidgets.map(w => w.id),
				totalWidgetsInStore: currentState.widgets.length
			});
			return activeWidgets;
		},
		// Widget methods
		placeWidget,
		updateWidgetProps,
		updateWidgetPosition,
		resizeWidget,
		removeWidget,
		duplicateWidget,
		fitToMobile,
		// Utility methods
		findNextAvailablePosition,
		canFitWidget,
		hasWidgetsInRow,
		lastCoveredRow
	};
}


// Update Types after edits : file://./types.ts

export const boardStore : BoardStore = createBoardStore();
