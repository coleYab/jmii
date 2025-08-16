import { writable, derived, get } from 'svelte/store';
import { boardStore } from './boardStore';
import { browser } from '$app/environment';

interface AutoSaveState {
	hasUnsavedChanges: boolean;
	isAutoSaving: boolean;
	lastSaveTime: Date | null;
	saveError: string | null;
	autoSaveEnabled: boolean;
}

function createAutoSaveStore() {
	const { subscribe, set, update } = writable<AutoSaveState>({
		hasUnsavedChanges: false,
		isAutoSaving: false,
		lastSaveTime: null,
		saveError: null,
		autoSaveEnabled: true
	});

	let saveTimeout: NodeJS.Timeout | null = null;
	const AUTO_SAVE_DELAY = 2000; // 2 seconds delay after last change

	async function performAutoSave() {
		if (!get({ subscribe }).autoSaveEnabled) return;

		try {
			update(state => ({ ...state, isAutoSaving: true, saveError: null }));
			
			await boardStore.saveBoardState();
			
			update(state => ({
				...state,
				hasUnsavedChanges: false,
				isAutoSaving: false,
				lastSaveTime: new Date(),
				saveError: null
			}));
			
			console.log('AutoSave:: Board auto-saved successfully');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Auto-save failed';
			update(state => ({
				...state,
				isAutoSaving: false,
				saveError: errorMessage
			}));
			console.error('AutoSave:: Auto-save failed:', error);
		}
	}

	function scheduleAutoSave() {
		const currentState = get({ subscribe });
		if (!currentState.autoSaveEnabled) return;

		// Clear existing timeout
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		// Mark as having unsaved changes immediately
		update(state => ({ ...state, hasUnsavedChanges: true }));

		// Schedule auto-save
		saveTimeout = setTimeout(() => {
			performAutoSave();
		}, AUTO_SAVE_DELAY);

		console.log('AutoSave:: Auto-save scheduled in', AUTO_SAVE_DELAY, 'ms');
	}

	function markChanged() {
		if (!browser) return;
		scheduleAutoSave();
	}

	function clearUnsavedChanges() {
		update(state => ({ 
			...state, 
			hasUnsavedChanges: false,
			lastSaveTime: new Date()
		}));
	}

	function enableAutoSave() {
		update(state => ({ ...state, autoSaveEnabled: true }));
	}

	function disableAutoSave() {
		update(state => ({ ...state, autoSaveEnabled: false }));
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}
	}

	// Setup beforeunload event listener
	if (browser) {
		window.addEventListener('beforeunload', (event) => {
			const state = get({ subscribe });
			if (state.hasUnsavedChanges) {
				event.preventDefault();
				event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
				return event.returnValue;
			}
		});
	}

	return {
		subscribe,
		markChanged,
		clearUnsavedChanges,
		enableAutoSave,
		disableAutoSave,
		performAutoSave
	};
}

export const autoSaveStore = createAutoSaveStore(); 