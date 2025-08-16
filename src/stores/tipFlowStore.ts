import { persisted, type Persisted } from 'svelte-persisted-store';

interface TipFlowState {
  show: boolean;
  tipData: {
    userName?: string;
    userId?: string;
  } | null;
}

export const tipFlowStore: Persisted<TipFlowState> = persisted('tipFlowStore', {
  show: false,
  tipData: null
}); 