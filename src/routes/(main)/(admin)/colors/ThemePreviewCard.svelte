<script lang="ts">
	import type { ITheme } from '$src/models/Theme.model';
	import ThemePreviewCardDisplay from './ThemePreviewCardDisplay.svelte';

	interface ThemePreviewCardProps {
		data: any;
		theme: ITheme;
		updateTheme: (theme: ITheme, updatedData: any) => void;
		deleteTheme: (id: string) => void;
		startEdit: (theme: ITheme) => void;
		cancelEdit: () => void;
		editingTheme: ITheme | null;
		categories: any[];
		modeOptions: any[];
		loading: boolean;
	}

	let {
		data,
		theme,
		updateTheme,
		deleteTheme,
		editingTheme,
		startEdit,
		cancelEdit,
		categories,
		modeOptions
	}: ThemePreviewCardProps = $props();

	function handleStartEdit() {
		startEdit(theme);
	}

	function handleDeleteTheme() {
		deleteTheme(theme.id);
	}
</script>

<ThemePreviewCardDisplay 
	{theme} 
	{data} 
	{editingTheme} 
	startEdit={handleStartEdit}
	deleteTheme={handleDeleteTheme}
	{categories}
	{modeOptions}
	isPreview={false}
/>
