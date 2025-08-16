import type { IBoardState, WidgetProps } from '../../types/widgets';


export function canFitWidget(
  board: IBoardState,
  widget: WidgetProps,
  startRow: number,
  startCol: number,
  columns: number,
  isMobile: boolean = false
): boolean {
  // Get the appropriate layout based on device type
  const layout = isMobile ? widget.layouts.mobile : widget.layouts.desktop;
  const height = layout.size.height;
  const width = Math.min(layout.size.width, 2); // Enforce max width of 2

  // Check if widget fits within board boundaries
  if (startRow + height > board.length || startCol + width > columns) {
    return false;
  }

  // Check if all cells in the target area are empty
  for (let r = startRow; r < startRow + height; r++) {
    for (let c = startCol; c < startCol + width; c++) {
      if (board[r][c] !== null) return false;
    }
  }
  return true;
}

export function getWidgetsFromState(state: IBoardState) {
  // Collect all unique widgets from the board
  const widgets = new Set<WidgetProps>();
  state.forEach((row) => {
    row.forEach((cell) => {
      if (cell && cell.id) {
        widgets.add(cell);
      }
    });
  });
  return Array.from(widgets);
}

export function findNextAvailablePosition(
  board: IBoardState,
  widget: WidgetProps,
  columns: number,
  isMobile: boolean
): { row: number; col: number; } | null {
  // Get the appropriate layout based on device type
  const layout = isMobile ? widget.layouts.mobile : widget.layouts.desktop;
  
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col <= columns - Math.min(layout.size.width, 2); col++) {
      if (canFitWidget(board, widget, row, col, columns, isMobile)) {
        return { row, col };
      }
    }
  }
  return null;
}