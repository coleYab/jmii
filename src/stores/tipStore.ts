
import { persisted, type Persisted } from 'svelte-persisted-store';


interface TipState {
    enabled: boolean;
    showMessages: boolean;
}

export const tipStore: Persisted<TipState> = persisted('tips', {
    enabled: false,
    showMessages: false
});

