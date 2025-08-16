import type { WidgetProps } from '$src/types/widgets';

import { persisted, type Persisted } from 'svelte-persisted-store';


interface DrawerState {
  show: boolean;
  widget: Pick<WidgetProps, 'id' | 'type' | 'layouts' | 'specificProps'> | null;
}

export const drawerStore: Persisted<DrawerState> = persisted('drawerStore', {
  show: false,
  widget: null
});
