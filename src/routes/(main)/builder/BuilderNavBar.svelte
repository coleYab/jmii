<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import { SquaresFour, Rows } from 'phosphor-svelte';
	import { toast } from 'svelte-sonner';

	import ShareButton from './_components/Navbar/ShareButton.svelte';
	import ThemeButton from './_components/Navbar/ThemeButton.svelte';
	import { browser } from '$app/environment';
	import { fly } from 'svelte/transition';
	import { autoSaveStore } from '$src/stores/autoSaveStore';
	import { CloudCheck, CloudSlash, CloudArrowUp, HandCoins } from 'phosphor-svelte';

	interface Props {
		mode: 'classic' | 'creative' | 'tips';
		loading: boolean;
		buttonWidth: number;
		data: any;
	}

	// Function to update profile mode via API
	async function updateProfileMode(newMode: 'classic' | 'creative' | 'tips') {
		loading = true;
		try {
			const response = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					mode: newMode
				})
			});

			if (!response.ok) {
				throw new Error('Failed to update profile mode');
			}

			const result = await response.json();
			console.log('Profile mode updated:', result);

			// Update local state
			mode = newMode;
			loading = false;
		} catch (error) {
			console.error('Error updating profile mode:', error);
			// Optionally show user feedback here
			toast.error('Error updating profile mode');
			loading = false;
		}
	}

	// Handler functions for mode switching
	function handleClassicMode() {
		updateProfileMode('classic');
	}

	function handleCreativeMode() {
		updateProfileMode('creative');
	}

	function handleTipsMode() {
		updateProfileMode('tips');
	}

	let { mode = $bindable(), loading, buttonWidth, data }: Props = $props();

	// Auto-save state
	let autoSaveState = $derived($autoSaveStore);
</script>

{#if browser}
	<header
		in:fly={{ y: -4 }}
		class="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 bg-background
		transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-14"
	>
		<div class="flex items-center gap-2 px-4">
			<Sidebar.Trigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 h-4" />
		</div>

		<div
			class="container mr-12 flex w-full max-w-screen-xl items-center justify-between gap-2 px-4"
		>
			<div
				class="relative isolate flex items-center justify-between overflow-clip rounded-2xl will-change-transform"
			>
				<div
					class="
		pointer-events-none absolute inset-0 z-0 m-0 box-border bg-primary transition-all duration-300
		{loading ? 'animate-load' : ''}
		{mode == 'classic'
						? 'translate-x-0 rounded-l-2xl'
						: mode == 'tips'
							? 'translate-x-[200%] rounded-r-2xl'
							: 'translate-x-full'} "
					style="width: {buttonWidth + 2}px;"
				></div>

				<button
					bind:clientWidth={buttonWidth}
					onclick={handleClassicMode}
					class=" z-10 flex w-12 flex-row items-center justify-center gap-2 p-2 py-3 text-sm transition-all md:w-32
					{mode == 'classic'
						? 'text-primary-foreground '
						: 'rounded-l-2xl border border-primary bg-primary/5 hover:bg-primary/10'}"
					disabled={loading}
				>
					<Rows weight="duotone" size={16} />
					<span class="hidden md:block"> Classic </span>
				</button>
				<button
					onclick={handleCreativeMode}
					class=" z-10 flex w-12 flex-row items-center justify-center gap-2 p-2 py-3 text-sm md:w-32
					{mode == 'creative'
						? 'text-primary-foreground'
						: 'border border-primary bg-primary/5 hover:bg-primary/10'}"
					disabled={loading}
				>
					<SquaresFour weight="duotone" size={16} />
					<span class="hidden md:block"> Creative </span>
				</button>
				<button
					onclick={handleTipsMode}
					class=" z-10 flex w-12 flex-row items-center justify-center gap-2 p-2 py-3 text-sm md:w-32
					{mode == 'tips'
						? 'text-primary-foreground '
						: 'rounded-r-2xl border border-primary bg-primary/5 hover:bg-primary/10'}"
					disabled={loading}
				>
					<HandCoins weight="duotone" size={16} />
					<span class="hidden md:block"> Tipping </span>
				</button>
			</div>

			<div class="flex items-center gap-2">
				<!-- Auto-save status indicator (only show in creative mode) -->
				<div
					class="group relative flex items-center justify-center rounded-lg p-2 transition-all duration-200
						{autoSaveState.saveError
						? 'bg-red-500/10 text-red-500'
						: autoSaveState.isAutoSaving
							? 'bg-blue-500/10 text-blue-500'
							: autoSaveState.hasUnsavedChanges
								? 'bg-yellow-500/10 text-yellow-600'
								: 'bg-green-500/10 text-green-500'}"
					title={autoSaveState.saveError
						? `Auto-save failed: ${autoSaveState.saveError}`
						: autoSaveState.isAutoSaving
							? 'Auto-saving...'
							: autoSaveState.hasUnsavedChanges
								? 'Unsaved changes'
								: autoSaveState.lastSaveTime
									? `Last saved: ${new Date(autoSaveState.lastSaveTime).toLocaleTimeString()}`
									: 'All changes saved'}
				>
					{#if autoSaveState.saveError}
						<CloudSlash size={16} weight="duotone" />
					{:else if autoSaveState.isAutoSaving}
						<CloudArrowUp size={16} weight="duotone" class="animate-pulse" />
					{:else}
						<CloudCheck size={16} weight="duotone" />
					{/if}

					<!-- Tooltip -->
					<div
						class="absolute -bottom-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap
							rounded-lg border border-gray-200/20 bg-background/95 px-2 py-1 text-xs
							text-foreground opacity-0 transition-all duration-200 group-hover:opacity-100"
					>
						{#if autoSaveState.saveError}
							Auto-save failed
						{:else if autoSaveState.isAutoSaving}
							Auto-saving...
						{:else if autoSaveState.hasUnsavedChanges}
							Unsaved changes
						{:else if autoSaveState.lastSaveTime}
							Last saved: {new Date(autoSaveState.lastSaveTime).toLocaleTimeString()}
						{:else}
							All changes saved
						{/if}
					</div>
				</div>

				<ThemeButton themes={data.themes} selectedTheme={data.selectedTheme} />
				<ShareButton userUrl={data.profile.url} profileImage={data.profile.image} />
			</div>
		</div>
	</header>
{/if}

<style>
	@keyframes pulse {
		50% {
			opacity: 0.8;
		}
	}
	.animate-load {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
