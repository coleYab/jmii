export const BOARD_CONFIG = {
	// Default board dimensions
	DEFAULT_ROWS: 10,

	DEFAULT_COLUMNS_DESKTOP: 4,
	DEFAULT_COLUMNS_MOBILE: 2,

	// Minimum board constraints
	MIN_ROWS: 3,
	MIN_COLUMNS: 2,

	// Maximum board constraints (to prevent performance issues)
	MAX_ROWS: 50,
	MAX_COLUMNS: 10,

	// Cell dimensions for UI (legacy - use getResponsiveCellDimensions instead)
	CELL_WIDTH: 135,
	CELL_HEIGHT: 135,
	CELL_GAP: 11
} as const;

/**
 * Calculates responsive cell dimensions based on viewport width
 * @param viewportWidth - Current viewport width in pixels
 * @returns Object containing cell width, height, and gap
 */
export function getResponsiveCellDimensions(viewportWidth: number) {
	// Determine device type based on viewport
	const isMobile = viewportWidth < 768;
	const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
	
	// Calculate base size with responsive scaling - same logic as widget sizing
	let baseSize: number;
	let gap: number;
	
	if (isMobile) {
		// For mobile: ensure 2-wide widgets fit on iPhone SE (320px) and scale up for larger screens
		// iPhone SE (320px): base = 135px, 2x1 = 270px + 10px gap = 280px (fits in 320px)
		// Larger phones (400px+): scale up to max 160px
		baseSize = Math.max(135, Math.min(160, viewportWidth * 0.35));
		gap = Math.max(8, Math.min(16, baseSize * 0.08));
	} else if (isTablet) {
		// For tablet: medium base size
		baseSize = Math.max(140, Math.min(180, viewportWidth * 0.15));
		gap = Math.max(10, Math.min(14, baseSize * 0.08));
	} else {
		// For desktop: larger base size, less responsive scaling
		baseSize = Math.max(180, Math.min(220, viewportWidth * 0.12));
		gap = Math.max(12, Math.min(16, baseSize * 0.08));
	}
	
	return {
		CELL_WIDTH: Math.round(baseSize),
		CELL_HEIGHT: Math.round(baseSize),
		CELL_GAP: Math.round(gap)
	};
}

/**
 * Validates and normalizes board dimensions
 */
export function validateBoardDimensions(rows: number, columns: number) {
	const normalizedRows = Math.max(BOARD_CONFIG.MIN_ROWS, Math.min(BOARD_CONFIG.MAX_ROWS, rows));

	const normalizedColumns = Math.max(
		BOARD_CONFIG.MIN_COLUMNS,
		Math.min(BOARD_CONFIG.MAX_COLUMNS, columns)
	);

	return {
		rows: normalizedRows,
		columns: normalizedColumns,
		wasModified: normalizedRows !== rows || normalizedColumns !== columns
	};
}

/**
 * Gets default board state for new boards
 */
export function getDefaultBoardState() {
	return {
		widgets: [],
		rows: BOARD_CONFIG.DEFAULT_ROWS,
		columns: BOARD_CONFIG.DEFAULT_COLUMNS_DESKTOP
	};
}
