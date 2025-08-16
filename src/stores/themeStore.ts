import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { ITheme } from '$src/models/Theme.model';

interface ThemeStoreState {
	currentTheme: ITheme | null;
	availableThemes: ITheme[];
	isLoading: boolean;
	error: string | null;
	initialized: boolean;
}

function createThemeStore() {
	const { subscribe, set, update } = writable<ThemeStoreState>({
		currentTheme: null,
		availableThemes: [],
		isLoading: false,
		error: null,
		initialized: false
	});

	return {
		subscribe,
		// Initialize the store with server data
		initialize: (themes: ITheme[], selectedTheme: ITheme | null) => {
			update(state => {
				// Only initialize if not already initialized or if we don't have a current theme
				if (!state.initialized || !state.currentTheme) {
					console.log('🎨 Initializing theme store with:', { themes: themes.length, selectedTheme: selectedTheme?.name });
					return {
						currentTheme: selectedTheme,
						availableThemes: themes,
						isLoading: false,
						error: null,
						initialized: true
					};
				} else {
					// Just update available themes but keep current theme
					console.log('🎨 Theme store already initialized, updating available themes only');
					return {
						...state,
						availableThemes: themes,
						isLoading: false,
						error: null
					};
				}
			});
		},
		// Set the current theme
		setTheme: async (theme: ITheme) => {
			console.log('🎨 Setting theme to:', theme.name);
			update(state => ({ ...state, isLoading: true, error: null }));
			
			try {
				// Update user's theme preference on the server
				const response = await fetch('/api/user/theme', {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ themeId: theme.id })
				});

				if (!response.ok) {
					const errorData = await response.json();
					console.error('❌ Theme update failed:', errorData);
					throw new Error(errorData.error || 'Failed to update theme');
				}

				const responseData = await response.json();
				console.log('✅ Theme updated successfully on server:', responseData);

				// Store in browser storage for immediate persistence
				if (browser) {
					try {
						localStorage.setItem('jami_current_theme', JSON.stringify(theme));
						console.log('💾 Theme stored in localStorage');
					} catch (error) {
						console.warn('⚠️ Failed to store theme in localStorage:', error);
					}
				}

				// Update the store state
				update(state => ({
					...state,
					currentTheme: theme,
					isLoading: false,
					error: null
				}));

				return true;
			} catch (error) {
				console.error('❌ Error setting theme:', error);
				update(state => ({
					...state,
					isLoading: false,
					error: error instanceof Error ? error.message : 'Failed to update theme'
				}));
				return false;
			}
		},
		// Refresh themes from server
		refreshThemes: async () => {
			update(state => ({ ...state, isLoading: true, error: null }));
			
			try {
				const response = await fetch('/api/theme');
				if (!response.ok) {
					throw new Error('Failed to fetch themes');
				}
				
				const data = await response.json();
				const themes = data.data || [];
				
				update(state => ({
					...state,
					availableThemes: themes,
					isLoading: false,
					error: null
				}));
				
				return themes;
			} catch (error) {
				update(state => ({
					...state,
					isLoading: false,
					error: error instanceof Error ? error.message : 'Failed to fetch themes'
				}));
				return [];
			}
		},
		// Get themes by category
		getThemesByCategory: (category: ITheme['category']) => {
			let themes: ITheme[] = [];
			update(state => {
				themes = state.availableThemes.filter(theme => theme.category === category && theme.isActive);
				return state;
			});
			return themes;
		},
		// Reset error state
		clearError: () => {
			update(state => ({ ...state, error: null }));
		},
		// Load theme from browser storage (fallback)
		loadFromStorage: () => {
			if (browser) {
				try {
					const storedTheme = localStorage.getItem('jami_current_theme');
					if (storedTheme) {
						const theme = JSON.parse(storedTheme);
						console.log('🔄 Loaded theme from localStorage:', theme.name);
						update(state => ({
							...state,
							currentTheme: theme
						}));
						return theme;
					}
				} catch (error) {
					console.warn('⚠️ Failed to load theme from localStorage:', error);
				}
			}
			return null;
		}
	};
}

export const themeStore = createThemeStore(); 