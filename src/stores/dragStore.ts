// import { writable } from 'svelte/store';
import type { WidgetProps } from '$src/types/widgets';

import { persisted, type Persisted } from 'svelte-persisted-store';

/** Tracks if a widget is being dragged and the widget data */
interface IDragState {
	/** Whether a widget is currently being dragged */
	isActive: boolean;
	isSelected: string | null;
	/** The data of the widget being dragged, null if no widget is being dragged */
	widgetData: WidgetProps | null;
}

/** Store that tracks if a widget is being dragged and the widget data */
export const dragStore: Persisted<IDragState> = persisted('dragStore', {
	isActive: false,
	isSelected: null,
	widgetData: null
});
