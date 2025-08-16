import type { IBoardState, WidgetProps } from '../types/widgets';

// Dual board state interface for both mobile and desktop layouts
interface DualBoardState {
	viewport: 'mobile' | 'desktop';
	desktop: IBoardState;
	mobile: IBoardState;
	widgets: WidgetProps[];
}

// STORE file : file://./../stores/boardStore.ts
export interface BoardStore {
	subscribe: (run: (value: DualBoardState) => void) => () => void;

	// Board methods
	initializeBoard: (rows: number, desktopColumns: number, mobileColumns?: number) => void;
	resizeBoard: (newRows: number, newColumns: number, isMobile: boolean) => void;
	loadBoardState: (boardData?: {
		widgets: WidgetProps[];
		rows: number;
		columns: number;
	}) => Promise<void>;
	saveBoardState: () => Promise<void>;
	getCurrentBoardState: (isMobile: boolean) => IBoardState;
	getCurrentWidgets: () => WidgetProps[];
	getActiveWidgets: (isMobile: boolean) => WidgetProps[];

	// Widget methods
	placeWidget: (widget: WidgetProps, isMobile: boolean) => void;
	updateWidgetProps: (id: string, newProps: Record<string, any>) => void;
	updateWidgetPosition: (
		widgetId: string,
		newRow: number,
		newCol: number,
		isMobile: boolean
	) => void;
	resizeWidget: (id: string, newSize: { width: number; height: number }, isMobile: boolean) => void;
	removeWidget: (id: string) => void;
	duplicateWidget: (id: string, isMobile: boolean) => void;
	fitToMobile: (mobileRows: number, mobileColumns: number) => void;

	// Utility methods
	findNextAvailablePosition: (
		board: IBoardState,
		widget: WidgetProps,
		columns: number,
		isMobile: boolean
	) => { row: number; col: number } | null;
	canFitWidget: (
		board: IBoardState,
		widget: WidgetProps,
		startRow: number,
		startCol: number,
		columns: number,
		isMobile?: boolean
	) => boolean;

	hasWidgetsInRow: (rowIndex: number, isMobile: boolean) => boolean;
	lastCoveredRow: (widgets: WidgetProps[], isMobile?: boolean) => number;
}
