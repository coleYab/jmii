<script lang="ts">
	import Link from './dnd/Link.svelte';
	import { onMount } from 'svelte';

	import { Button } from '$lib/components/ui/button';
	import { Plus, Youtube } from 'lucide-svelte';

	import { flip } from 'svelte/animate';
	import { quintOut } from 'svelte/easing';

	// Import shared types
	import type { ILink as UILink, ClassicItem, ClassicBoardItem } from '$lib/types';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { DND_TYPES, FLIP_DURATION_MS } from './dnd/dndConfig.js';
	import type { ITheme } from '$src/models/Theme.model';
	import { FloppyDisk, GitBranch } from 'phosphor-svelte';
	import { toast } from 'svelte-sonner';

	// Props
	let { classicData, theme }: { classicData?: any; theme?: ITheme } = $props();

	// State - simplified to only handle standalone links
	let items = $state<ClassicBoardItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let initialLoadComplete = $state(false);
	let mounted = $state(false);
	let isSaving = $state(false);
	let isSavingSnapshot = $state(false);

	// Transform database item to UI BoardItem format - simplified for links only
	function transformItemToUI(item: any): ClassicBoardItem {
		// Only handle standalone links in Classic mode
		return {
			id: 'link-' + item.id,
			title: item.title,
			url: item.url,
			icon: null,
			clicks: item.clickCount || 0,
			active: item.isActive,
			type: 'link' as const
		};
	}

	// Transform UI BoardItem to ClassicItem format for API - simplified for links only
	function transformUIToClassicItem(item: ClassicBoardItem, sortOrder: number): ClassicItem {
		// Only standalone links supported in Classic mode
		return {
			id: item.id, // Keep the prefixed ID for backend processing
			itemType: 'link',
			type: 'link',
			title: item.title,
			url: item.url,
			description: null,
			image: null,
			isActive: item.active,
			active: item.active,
			clickCount: item.clicks || 0,
			clicks: item.clicks || 0,
			sortOrder
		};
	}

	// Load profile data from server-provided data or API fallback
	async function loadProfile() {
		try {
			loading = true;
			error = null;

			let profile;

			// Use server-provided data if available
			if (classicData) {
				console.log('✅ Using server-provided Classic profile data:', classicData);
				profile = classicData;
			} else {
				console.log('🔄 Loading Classic profile from API (fallback)...');
				const response = await fetch('/api/classic/profile');

				if (response.ok) {
					profile = await response.json();
					console.log('✅ Classic profile loaded from API:', profile);
				} else if (response.status === 404) {
					console.log('❌ Classic profile not found - will create new one');
					// Handle 404 case below
				} else {
					throw new Error(`Failed to load profile: ${response.status}`);
				}
			}

			// Only update state if component is still mounted
			if (!mounted) {
				console.log('⚠️ Component unmounted during load, skipping state update');
				return;
			}

			if (profile) {
				// Transform items to UI format - only process standalone links
				if (profile.linkGroups && Array.isArray(profile.linkGroups)) {
					// Filter out any collections/link groups, only keep standalone links
					const standaloneLinks = profile.linkGroups.filter(
						(item: any) => item.itemType === 'link'
					);
					items = standaloneLinks
						.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
						.map(transformItemToUI);
					console.log(`📊 Loaded ${items.length} standalone links from existing profile`);
				} else {
					items = [];
					console.log('📊 Profile exists but has no items (this is normal for new profiles)');
				}
				initialLoadComplete = true;
			} else {
				// No profile data available and no server-provided data
				// This means we need to create a new profile
				console.log('❌ No Classic profile data available');

				// Only create new profile if this is the first load attempt
				if (!initialLoadComplete) {
					console.log('🆕 First load attempt - creating Classic profile relationship...');
					await createProfile();
				} else {
					console.warn(
						'⚠️ Classic profile data missing after initial load - this indicates a data consistency issue'
					);
					if (mounted) {
						items = [];
						error = 'Classic profile data not found. Please refresh the page.';
					}
				}
			}
		} catch (err) {
			// Only update error state if component is still mounted
			if (mounted) {
				error = err instanceof Error ? err.message : 'Failed to load profile';
				console.error('❌ Error loading Classic profile:', err);

				// If this is the first load and we get an error, still mark as complete to prevent loops
				if (!initialLoadComplete) {
					initialLoadComplete = true;
				}
			}
		} finally {
			if (mounted) {
				loading = false;
			}
		}
	}

	// Create new profile via API
	async function createProfile() {
		try {
			loading = true;
			error = null;

			console.log('🆕 Creating Classic profile...');
			const response = await fetch('/api/classic/profile', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({})
			});

			if (response.ok) {
				console.log('✅ Classic profile created successfully');
				// Initialize with empty items
				if (mounted) {
					items = [];
					initialLoadComplete = true;
				}
			} else {
				const errorText = await response.text();
				throw new Error(`Failed to create profile: ${response.status} - ${errorText}`);
			}
		} catch (err) {
			// Only update error state if component is still mounted
			if (mounted) {
				error = err instanceof Error ? err.message : 'Failed to create profile';
				console.error('❌ Error creating Classic profile:', err);
				// Still mark as complete to prevent infinite loops
				initialLoadComplete = true;
				items = [];
			}
		}
	}

	// Save entire profile state using single update API
	async function saveProfile() {
		// Don't save if initial load hasn't completed yet
		if (!initialLoadComplete) {
			console.log('⏳ Skipping save - initial load not complete yet');
			return;
		}

		isSaving = true;
		try {
			const classicItems = items.map((item, index) => transformUIToClassicItem(item, index));

			console.log('💾 Saving Classic profile with items:', classicItems);

			const response = await fetch('/api/classic/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ items: classicItems })
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to save profile: ${response.status} - ${errorText}`);
			}
			console.log('✅ Classic profile saved successfully');
			isSaving = false;
		} catch (err) {
			isSaving = false;
			console.error('❌ Error saving Classic profile:', err);
			// Could show a toast notification here
		}
	}

	// Handle creating standalone link
	async function createStandaloneLink() {
		const newLink: UILink = {
			id: `link-${Date.now()}`,
			title: 'New Link',
			url: 'https://example.com',
			icon: null,
			clicks: 0,
			active: true,
			type: 'link'
		};

		items = [newLink, ...items];
		await saveProfile();
	}

	// Handle deleting an individual link
	async function deleteLink(linkId: string) {
		items = items.filter((item) => item.id !== linkId);
		await saveProfile();
	}

	// Handle editing an individual link
	async function editLink(
		linkId: string,
		updateData: {
			title?: string;
			url?: string;
			description?: string | null;
			image?: string | null;
			isActive?: boolean;
		}
	) {
		items = items.map((item) => {
			if (item.id === linkId) {
				return {
					...item,
					title: updateData.title ?? item.title,
					url: updateData.url ?? item.url,
					active: updateData.isActive ?? item.active
				};
			}
			return item;
		});
		await saveProfile();
	}


	async function saveSnapshot() {
		if (!initialLoadComplete) {
			console.log('⏳ Skipping snapshot - initial load not complete yet');
			return;
		}

		isSavingSnapshot = true;
		try {
			// Ensure latest edits are saved before taking a snapshot
			await saveProfile();

			const res = await fetch('/api/classic/profile/snapshot', { method: 'POST' });
			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Snapshot failed: ${res.status} - ${errorText}`);
			}

			const data = await res.json();
			console.log('✅ Classic snapshot saved:', data);
			toast.success('Classic snapshot saved');
		} catch (err) {
			console.error('❌ Error saving Classic snapshot:', err);
			toast.error('Snapshot failed');
		} finally {
			isSavingSnapshot = false;
		}
	}

	// Load data on component mount using lifecycle functions instead of effect
	onMount(() => {
		console.log('🔄 ClassicBoard mounted - loading profile...');
		mounted = true;
		loadProfile();
	});

	// DND Handlers for the Main Board - simplified for links only
	const handleMainBoardDndConsider = (event: CustomEvent<DndEvent<any>>) => {
		console.log('handleMainBoardDndConsider', event.detail.info.id);
		const newItems = event.detail.items as ClassicBoardItem[];
		console.log('handleMainBoardDndConsider new items', newItems);
		items = newItems;
	};

	const handleMainBoardDndFinalize = (event: CustomEvent<DndEvent<any>>) => {
		console.log('handleMainBoardDndFinalize', event.detail.info.id);
		const newItems = event.detail.items as ClassicBoardItem[];
		console.log('handleMainBoardDndFinalize new items', newItems);
		items = newItems;

		// Save the reordered items
		saveProfile();
	};

	// Create CSS custom properties from theme
	let themeStyles = $derived(
		theme
			? `
		--theme-background: ${theme.background};
		--theme-foreground: ${theme.foreground};
		--theme-stroke: ${theme.stroke};
		--theme-button-color: ${theme.buttonColor};
		--theme-button-background: ${theme.buttonBackground};
		--theme-shadow-default: ${theme.shadow.default};
		--theme-shadow-active: ${theme.shadow.active};
		--theme-shadow-hovered: ${theme.shadow.hovered};
		--theme-shadow-disabled: ${theme.shadow.disabled};
		--theme-shadow-highlighted: ${theme.shadow.highlighted};
		--theme-button-rounding: ${theme.buttonRounding}px;
	`
			: ''
	);
</script>

<section class="flex flex-col items-center justify-center" style={themeStyles} >
	<div class="relative mt-2 flex w-[calc(min(98vw,720px)-1rem)] flex-col gap-2">
		<div class="flex flex-row items-center justify-center gap-4">
			<Button
				size="lg"
				class="classic-button rounded-3xl bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90 hover:shadow-xl"
				onclick={createStandaloneLink}
				disabled={loading && !initialLoadComplete}
			>
				{#if isSaving}
					<FloppyDisk size={16} weight="duotone" class="mr-2 h-5 w-5" />
				{:else}
					<Plus class="mr-2 h-5 w-5" />
				{/if}
				{isSaving ? 'Saving...' : 'Add Link'}
			</Button>
			<Button
				size="lg"
				class="classic-button rounded-3xl bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90 hover:shadow-xl"
				onclick={saveSnapshot}
				disabled={loading && !initialLoadComplete}
			>
				{#if isSavingSnapshot}
					<FloppyDisk size={16} weight="duotone" class="mr-2 h-5 w-5" />
				{:else}
					<GitBranch class="mr-2 h-5 w-5" />
				{/if}
				{isSavingSnapshot ? 'Saving...' : 'Save Snapshot'}
			</Button>
		</div>
		<div class="flex max-w-4xl items-center justify-center rounded-3xl">
			<!-- Loading State -->
			{#if loading && !initialLoadComplete}
				<div class="flex items-center justify-center p-12">
					<div class="text-center">
						<div
							class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
						></div>
						<div class="text-muted-foreground">Loading your links...</div>
					</div>
				</div>
				<!-- Error State -->
			{:else if error && !initialLoadComplete}
				<div class="flex items-center justify-center p-12">
					<div class="text-center">
						<div class="mb-4 text-destructive">⚠️</div>
						<div class="font-medium text-destructive">Error: {error}</div>
						<div class="mt-4 flex flex-col gap-2">
							<button
								class="text-sm text-muted-foreground underline hover:text-foreground"
								onclick={loadProfile}
							>
								Try loading again
							</button>
							{#if error.includes('relationship not found')}
								<button
									class="text-sm text-primary underline hover:text-primary/80"
									onclick={createProfile}
								>
									Create Classic profile
								</button>
							{/if}
						</div>
					</div>
				</div>
				<!-- Content -->
			{:else}
				<!-- MAIN DROP ZONE FOR LINKS ONLY -->
				<div
					class="flex w-full flex-col gap-2 rounded-[26px] border border-dashed border-primary p-2 transition-all duration-200"
					role="list"
					aria-label="Classic mode links"
					use:dndzone={{
						items,
						flipDurationMs: FLIP_DURATION_MS,
						type: DND_TYPES.LINK_STANDALONE,
						dropFromOthersDisabled: false,
						morphDisabled: false
					}}
					onconsider={handleMainBoardDndConsider}
					onfinalize={handleMainBoardDndFinalize}
				>
					{#if items.length === 0}
						<div
							class="flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted bg-gradient-to-br from-muted/20 via-transparent to-muted/10 p-12 text-center"
						>
							<div class="mb-6 text-muted-foreground">
								<Plus class="mx-auto mb-4 h-16 w-16 opacity-40" />
								<h3 class="mb-2 text-xl font-semibold text-foreground">No links yet</h3>
								<p class="max-w-md text-sm">
									Add standalone links to build your Classic profile. Drag and drop to reorder them.
								</p>
							</div>
							<div class="flex flex-col gap-3">
								<Button size="lg" class="classic-button" onclick={createStandaloneLink}>
									<Plus class="mr-2 h-5 w-5" /> Add Link
								</Button>
							</div>
						</div>
					{:else}
						{#each items as item (item.id + item.isDndShadowItem)}
							<div animate:flip={{ duration: FLIP_DURATION_MS, easing: quintOut }}>
								<Link
									link={item}
									onDelete={() => deleteLink(item.id)}
									onEdit={(updateData) => editLink(item.id, updateData)}
								/>
							</div>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
	/* Apply theme colors to the classic board */
	:global(.classic-link-container) {
		background-color: var(--theme-background, #ffffff);
		border-color: var(--theme-stroke, #e5e7eb);
		color: var(--theme-foreground, #000000);
		box-shadow: 0 1px 3px 0 var(--theme-shadow-color, rgba(0, 0, 0, 0.1));
	}

	:global(.classic-link-container:hover) {
		border-color: var(--theme-button-background, #3b82f6);
	}

	:global(.classic-button) {
		background-color: var(--theme-button-background, #3b82f6);
		color: var(--theme-button-color, #ffffff);
		border-color: var(--theme-stroke, #e5e7eb);
	}

	:global(.classic-button:hover) {
		background-color: var(--theme-button-background, #3b82f6);
		opacity: 0.9;
	}

	:global(.classic-board-background) {
		background-color: var(--theme-background, transparent);
	}
</style>
