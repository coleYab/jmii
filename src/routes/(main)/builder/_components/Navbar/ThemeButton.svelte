<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Palette, SpinnerGap, Check } from 'phosphor-svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import { themeStore } from '$src/stores/themeStore';
	import type { ITheme } from '$src/models/Theme.model';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	interface Props {
		themes: ITheme[];
		selectedTheme: ITheme | null;
	}

	let { themes, selectedTheme }: Props = $props();

	// Initialize theme store on mount - but only if not already initialized
	onMount(() => {
		console.log('🎨 ThemeButton mounted with:', { 
			themesCount: themes.length, 
			selectedTheme: selectedTheme?.name,
			storeInitialized: $themeStore.initialized,
			currentTheme: $themeStore.currentTheme?.name
		});
		
		// Initialize the store with server data
		themeStore.initialize(themes, selectedTheme);
		
		// If no current theme is set, try loading from localStorage as fallback
		if (!$themeStore.currentTheme && !selectedTheme) {
			console.log('🔄 No theme set, trying localStorage fallback...');
			themeStore.loadFromStorage();
		}
	});

	// Category options for filtering
	const categories = [
		{ value: 'all', label: 'All Themes' },
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'colorful', label: 'Colorful' },
		{ value: 'minimal', label: 'Minimal' },
		{ value: 'nature', label: 'Nature' },
		{ value: 'professional', label: 'Professional' },
		{ value: 'creative', label: 'Creative' }
	];

	let selectedCategory = $state('all');
	let isDialogOpen = $state(false);

	// Filter themes based on selected category
	let filteredThemes = $derived(
		selectedCategory === 'all'
			? $themeStore.availableThemes.filter((theme) => theme.isActive)
			: $themeStore.availableThemes.filter(
					(theme) => theme.category === selectedCategory && theme.isActive
				)
	);

	// Handle theme selection
	async function selectTheme(theme: ITheme) {
		console.log('🎨 User selected theme:', theme.name);
		const success = await themeStore.setTheme(theme);
		if (success) {
			toast.success(`Theme changed to "${theme.name}"`);
			console.log('✅ Theme change successful, current store state:', $themeStore.currentTheme?.name);
			// Keep dialog open so users can preview more themes
		} else {
			toast.error($themeStore.error || 'Failed to change theme');
			console.error('❌ Theme change failed:', $themeStore.error);
		}
	}

	// Get category label for display
	const categoryLabel = $derived(
		categories.find((c) => c.value === selectedCategory)?.label ?? 'All Themes'
	);

	// Create theme preview style
	function getThemePreviewStyle(theme: ITheme): string {
		return `background: linear-gradient(135deg, ${theme.background} 0%, ${theme.background} 40%, ${theme.buttonBackground} 60%, ${theme.foreground} 100%);`;
	}

	// Check if theme is currently selected
	function isThemeSelected(theme: ITheme): boolean {
		return $themeStore.currentTheme?.id === theme.id;
	}

	// Get current theme styles for the button
	function getCurrentThemeButtonStyle(): string {
		const theme = $themeStore.currentTheme;
		if (!theme) return '';

		return `
			background-color: ${theme.background};
			border-color: ${theme.stroke};
			color: ${theme.foreground};
		`;
	}

	// Create mini palette preview
	function getMiniPaletteColors(): string[] {
		const theme = $themeStore.currentTheme;
		if (!theme) return [];

		return [theme.background, theme.foreground, theme.buttonBackground, theme.stroke];
	}

	// Debug: log when store state changes
	$effect(() => {
		if ($themeStore.currentTheme) {
			console.log('🎨 Theme store updated, current theme:', $themeStore.currentTheme.name);
		}
	});
</script>

<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Trigger>
		<div class="group relative">
			<Button
				variant="ghost"
				class="rounded-2xl border transition-all duration-300 hover:shadow-md"
				style={getCurrentThemeButtonStyle()}
			>
				{#if !$themeStore.isLoading}
					<Palette weight="duotone" />
					<span class="hidden md:block">Theme</span>
				{:else}
					<SpinnerGap weight="duotone" class="animate-spin" />
					<span class="hidden md:block">Theme</span>
				{/if}
			</Button>

			<!-- Mini Palette Preview on Hover -->
			{#if $themeStore.currentTheme}
				<div
					class="absolute -bottom-2 -right-2 opacity-0 transition-all duration-200 group-hover:scale-110 group-hover:opacity-100"
				>
					<div class="flex h-6 w-6 overflow-hidden rounded-full border-2 border-white shadow-lg">
						{#each getMiniPaletteColors() as color, i}
							<div class="flex-1" style="background-color: {color}"></div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</Dialog.Trigger>
	<Dialog.Content class="max-h-[90vh] min-w-[60vw] max-w-4xl overflow-y-auto p-12">
		<Dialog.Header>
			<Dialog.Title>Choose Your Theme</Dialog.Title>
			<Dialog.Description>
				Customize the look and feel of your profile with beautiful themes
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6">
			<!-- Current Theme Display -->
			{#if $themeStore.currentTheme}
				<div class="space-y-2">
					<h3 class="text-sm font-semibold text-muted-foreground">Current Theme</h3>
					<div
						class="flex items-center gap-3 rounded-xl border border-primary p-4 shadow-sm"
						style={getThemePreviewStyle($themeStore.currentTheme)}
					>
						<div
							class="flex h-12 w-12 items-center justify-center rounded-xl backdrop-blur-sm"
							style="color: {$themeStore.currentTheme.foreground}; background-color: {$themeStore.currentTheme.background}"
						>
							<Palette class="h-6 w-6" fill="currentColor" />
						</div>
						<div class="flex-1">
							<h4
								class="font-semibold drop-shadow-sm"
								style="color: {$themeStore.currentTheme.foreground}"
							>
								{$themeStore.currentTheme.name}
							</h4>
							<p
								class="text-sm drop-shadow-sm"
								style="color: {$themeStore.currentTheme.foreground}"
							>
								{$themeStore.currentTheme.description}
							</p>
						</div>
						<Badge variant="secondary" class="bg-white/20 text-white">
							{$themeStore.currentTheme.category}
						</Badge>
					</div>
				</div>
			{/if}

			<!-- Category Filter -->
			<div class="space-y-2">
				<Label class="text-sm font-medium">Filter by Category</Label>
				<Select.Root bind:value={selectedCategory} type="single">
					<Select.Trigger class="w-[200px]">
						{categoryLabel}
					</Select.Trigger>
					<Select.Content>
						{#each categories as category (category.value)}
							<Select.Item value={category.value} label={category.label}>
								{category.label}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<!-- Error Display -->
			{#if $themeStore.error}
				<div class="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
					<p class="text-sm text-destructive">{$themeStore.error}</p>
					<Button size="sm" variant="outline" class="mt-2" onclick={() => themeStore.clearError()}>
						Dismiss
					</Button>
				</div>
			{/if}

			<!-- Theme Grid -->
			<div class="space-y-3">
				<h3 class="text-sm font-semibold text-muted-foreground">
					Available Themes ({filteredThemes.length})
				</h3>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each filteredThemes as theme (theme.id)}
						<button
							class="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg
							{isThemeSelected(theme) ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'}"
							onclick={() => selectTheme(theme)}
							disabled={$themeStore.isLoading}
						>
							<!-- Theme Preview -->
							<div class="relative h-24 w-full" style={getThemePreviewStyle(theme)}>
								<!-- Color Swatches -->
								<div class="absolute bottom-2 left-2 flex gap-1">
									<div
										class="h-3 w-3 rounded-full border border-white/30"
										style="background-color: {theme.background}"
									></div>
									<div
										class="h-3 w-3 rounded-full border border-white/30"
										style="background-color: {theme.foreground}"
									></div>
									<div
										class="h-3 w-3 rounded-full border border-white/30"
										style="background-color: {theme.buttonBackground}"
									></div>
								</div>

								<!-- Selected Indicator -->
								{#if isThemeSelected(theme)}
									<div
										class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary"
									>
										<Check class="h-4 w-4 text-primary-foreground" weight="bold" />
									</div>
								{/if}

								<!-- Loading Overlay -->
								{#if $themeStore.isLoading}
									<div class="absolute inset-0 flex items-center justify-center bg-black/20">
										<SpinnerGap class="h-6 w-6 animate-spin text-white" />
									</div>
								{/if}
							</div>

							<!-- Theme Info -->
							<div class="flex flex-1 flex-col gap-2 p-4">
								<div class="flex items-center justify-between">
									<h4 class="font-semibold text-foreground group-hover:text-primary">
										{theme.name}
									</h4>
									<Badge variant="outline" class="text-xs">
										{theme.category}
									</Badge>
								</div>
								<p class="text-left text-sm text-muted-foreground">
									{theme.description}
								</p>
								<div
									class="mt-auto flex items-center justify-between text-xs text-muted-foreground"
								>
									<span>Used {theme.usageCount} times</span>
									{#if theme.isDefault}
										<Badge variant="secondary" class="text-xs">Default</Badge>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>

				{#if filteredThemes.length === 0}
					<div class="flex flex-col items-center justify-center p-8 text-center">
						<Palette class="mb-3 h-12 w-12 text-muted-foreground/50" />
						<h4 class="font-semibold text-muted-foreground">No themes found</h4>
						<p class="text-sm text-muted-foreground">
							Try selecting a different category or check back later for new themes.
						</p>
					</div>
				{/if}
			</div>

			<!-- Refresh Button -->
			<div class="flex justify-center pt-4">
				<Button
					variant="outline"
					onclick={() => themeStore.refreshThemes()}
					disabled={$themeStore.isLoading}
				>
					{#if $themeStore.isLoading}
						<SpinnerGap class="mr-2 h-4 w-4 animate-spin" />
					{:else}
						<Palette class="mr-2 h-4 w-4" />
					{/if}
					Refresh Themes
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
