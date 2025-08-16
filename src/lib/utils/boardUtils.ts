import type { BOARD_CONFIG } from '$src/stores/board/board.config';

export interface BoardSettings {
  defaults: {
    rows: number;
    columns: number;
  };
  constraints: {
    minRows: number;
    minColumns: number;
    maxRows: number;
    maxColumns: number;
  };
  cellDimensions: {
    width: number;
    height: number;
    gap: number;
  };
}

export interface BoardValidationResult {
  validated: {
    rows: number;
    columns: number;
    wasModified: boolean;
  };
  message: string;
}

/**
 * Fetches current board settings from the API
 */
export async function fetchBoardSettings(): Promise<BoardSettings> {
  const response = await fetch('/api/creative/settings');
  if (!response.ok) {
    throw new Error('Failed to fetch board settings');
  }
  return response.json();
}

/**
 * Validates board dimensions via the API
 */
export async function validateBoardDimensionsAPI(rows: number, columns: number): Promise<BoardValidationResult> {
  const response = await fetch('/api/creative/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ rows, columns })
  });
  
  if (!response.ok) {
    throw new Error('Failed to validate board dimensions');
  }
  
  return response.json();
}

/**
 * Gets the default board state with proper typing
 */
export function getDefaultBoardDimensions() {
  return {
    rows: 10, // BOARD_CONFIG.DEFAULT_ROWS
    columns: 4 // BOARD_CONFIG.DEFAULT_COLUMNS
  };
} 