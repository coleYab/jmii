import { json } from '@sveltejs/kit';
import { BOARD_CONFIG, validateBoardDimensions } from '$src/stores/board/board.config';

export async function GET({ locals }) {
  const user = locals.user;
  if (!user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Return current board configuration
    return json({
      defaults: {
        rows: BOARD_CONFIG.DEFAULT_ROWS,
        columns: BOARD_CONFIG.DEFAULT_COLUMNS
      },
      constraints: {
        minRows: BOARD_CONFIG.MIN_ROWS,
        minColumns: BOARD_CONFIG.MIN_COLUMNS,
        maxRows: BOARD_CONFIG.MAX_ROWS,
        maxColumns: BOARD_CONFIG.MAX_COLUMNS
      },
      cellDimensions: {
        width: BOARD_CONFIG.CELL_WIDTH,
        height: BOARD_CONFIG.CELL_HEIGHT,
        gap: BOARD_CONFIG.CELL_GAP
      }
    });
  } catch (error) {
    console.error('Error getting board settings:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST({ request, locals }) {
  const user = locals.user;
  if (!user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { rows, columns } = await request.json();
    
    // Validate the requested dimensions
    const validation = validateBoardDimensions(rows, columns);
    
    return json({
      validated: validation,
      message: validation.wasModified 
        ? `Dimensions adjusted to fit constraints: ${rows}x${columns} -> ${validation.rows}x${validation.columns}`
        : 'Dimensions are valid'
    });
  } catch (error) {
    console.error('Error validating board settings:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 