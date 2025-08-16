<script lang="ts">
	import type { PageData } from './$types';
	import DisplayBento from './DisplayBento.svelte';
	import type { BoardItem } from '$lib/types';
	import TipMe from '$src/routes/(main)/builder/_components/common/TipMe.svelte';
	import TipFlow from '$src/routes/(main)/builder/_components/common/TipFlow.svelte';
	import UserDetailsDisplayEdit from '$src/routes/(main)/builder/_components/common/UserDetailsDisplayEdit.svelte';
	import TipGoals from './TipGoals.svelte';
	import { Layout } from 'phosphor-svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { themeStore } from '$src/stores/themeStore';
	import { tipFlowStore } from '$src/stores/tipFlowStore';

	let { data }: { data: PageData } = $props();

	// Extract data from the load function
	const { user, profile, profileData, rawProfileData, themes, selectedTheme } = data;

	// Use theme from store, fall back to server data
	let currentTheme = $derived($themeStore.currentTheme || selectedTheme);

	// Track page view on mount
	onMount(() => {
		// Initialize theme store with server data
		if (themes && themes.length > 0) {
			themeStore.initialize(themes, selectedTheme);
		}

		if (browser && user?._id) {
			trackPageView();
		}
	});

	async function trackPageView() {
		try {
			await fetch('/api/analytics/track-view', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					url: window.location.href,
					userId: user._id
				})
			});
		} catch (error) {
			// Silently fail to not disrupt user experience
			console.warn('Failed to track page view:', error);
		}
	}

	// Function to track link clicks
	async function trackClick(clickedUrl: string) {
		try {
			await fetch('/api/analytics/track-click', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					pageUrl: window.location.href,
					clickedUrl,
					userId: user._id
				})
			});
		} catch (error) {
			// Silently fail to not disrupt user experience
			console.warn('Failed to track click:', error);
		}
	}

	// Transform classic profile data to the format expected by the UI
	function transformClassicData() {
		if (!profileData || profileData.type !== 'classic') return [];

		const items: BoardItem[] = [];

		// Add standalone links
		if (profileData.standaloneLinks) {
			profileData.standaloneLinks.forEach((link: any) => {
				items.push({
					id: link._id.toString(),
					title: link.title,
					url: link.url,
					icon: null,
					clicks: link.clickCount || 0,
					active: link.isActive,
					type: 'link' as const
				});
			});
		}

		// // Add link groups (collections)
		// if (profileData.linkGroups) {
		// 	profileData.linkGroups.forEach((group: any) => {
		// 		items.push({
		// 			id: group._id.toString(),
		// 			title: group.title,
		// 			active: group.isActive,
		// 			links: group.links.map((link: any) => ({
		// 				id: link._id.toString(),
		// 				title: link.title,
		// 				url: link.url,
		// 				icon: null,
		// 				clicks: link.clickCount || 0,
		// 				active: link.isActive,
		// 				type: 'link' as const
		// 			})),
		// 			type: 'collection' as const
		// 		});
		// 	});
		// }

		return items;
	}

	const classicItems = transformClassicData();
</script>

<svelte:head>
	<title>{profile.displayName} - {profile.bio || 'Profile'}</title>
	<meta name="description" content={profile.bio || `${profile.displayName}'s profile`} />
	<meta property="og:title" content={profile.displayName} />
	<meta property="og:description" content={profile.bio || `${profile.displayName}'s profile`} />
	{#if profile.image}
		<meta property="og:image" content={profile.image} />
	{/if}
</svelte:head>

<main 
	class="min-h-screen bg-background py-12"
	style="background-color: {$themeStore?.currentTheme?.background || 'var(--background)'};"
>
	<UserDetailsDisplayEdit
		profileData={rawProfileData}
		isPublicView={true}
		isManualOverride={false}
		refresh={() => {}}
		onLinkClick={trackClick}
		mode={profile.mode === 'classic' ? 'classic' : 'creative'}
	/>

	<!-- Tip Goals Section -->
	<div class="mt-8 sm:mt-12 flex items-center justify-center">
		<TipGoals userId={user._id} theme={currentTheme} />
	</div>

	{#if $tipFlowStore.show}
		<!-- Tip Flow View -->
		<section class="flex flex-col items-center justify-center">
			<section class="mt-20 flex flex-col items-center justify-center px-4 sm:mt-24">
				<TipFlow 
					userName={$tipFlowStore.tipData?.userName || profile.displayName}
					userId={$tipFlowStore.tipData?.userId || user._id}
				/>
			</section>
		</section>
	{:else if profile.mode === 'classic'}
		<!-- Render Classic Profile (Public View) -->
		<section class="flex flex-col items-center justify-center">
			<!-- Classic Board Content -->
			<section class="mt-20 flex flex-col items-center justify-center sm:mt-24">
				<div class="relative flex w-[calc(min(98vw,720px)-1rem)] flex-col gap-6">
					<div class="container mx-auto max-w-4xl">
						{#if classicItems.length === 0}
							<div
								class="flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted bg-gradient-to-br from-muted/20 via-transparent to-muted/10 p-12 text-center"
							>
								<div class="mb-6 text-muted-foreground">
									<h3 class="mb-2 text-xl font-semibold text-foreground">No links yet</h3>
									<p class="max-w-md text-sm">This profile doesn't have any links to display.</p>
								</div>
							</div>
						{:else}
							<div class="space-y-4">
								{#each classicItems as item (item.id)}
									{#if item.type === 'collection'}
										<!-- Collection/Link Group -->
										<div class="rounded-xl border-2 border-primary/20 bg-card p-4 shadow-sm">
											<div
												class="mb-4 flex items-center justify-between border-b border-border/40 pb-3"
											>
												<div class="flex items-center gap-3">
													<h3 class="text-lg font-semibold text-foreground">{item.title}</h3>
													<span
														class="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
													>
														{item.links.length}
														{item.links.length === 1 ? 'link' : 'links'}
													</span>
												</div>
											</div>
											<div class="space-y-3">
												{#each item.links as link (link.id)}
													<a
														href={link.url}
														target="_blank"
														rel="noopener noreferrer"
														class="group relative flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md"
														onclick={() => trackClick(link.url)}
													>
														<div
															class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"
														>
															<svg
																class="h-4 w-4 text-muted-foreground"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
																/>
															</svg>
														</div>
														<div class="flex-grow space-y-1">
															<h4 class="text-base font-semibold text-foreground">{link.title}</h4>
															<span class="text-sm text-muted-foreground">{link.url}</span>
														</div>
													</a>
												{/each}
											</div>
										</div>
									{:else if item.type === 'link'}
										<!-- Standalone Link -->
										<a
											href={item.url}
											target="_blank"
											rel="noopener noreferrer"
											onclick={() => trackClick(item.url)}
											class="group relative flex items-start gap-4 rounded-xl border border-border border-primary/20 bg-card bg-gradient-to-r from-primary/5 to-transparent p-4 shadow-sm transition-all duration-200 hover:shadow-md"
										>
											<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
												<svg
													class="h-4 w-4 text-muted-foreground"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
													/>
												</svg>
											</div>
											<div class="flex-grow space-y-1">
												<h4 class="text-base font-semibold text-foreground">{item.title}</h4>
												<span class="text-sm text-muted-foreground">{item.url}</span>
											</div>
										</a>
									{/if}
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</section>
		</section>
	{:else if profile.mode === 'creative'}
		<!-- Render Creative Profile -->
		<section class="flex flex-col items-center justify-center">
			<!-- Creative Board Content -->
			{#if profileData?.type === 'creative'}
				<DisplayBento
					widgets={profileData.widgets || []}
					rows={profileData.rows || 10}
					columns={profileData.columns || 5}
					userProfile={{
						name: profile.displayName,
						picture: profile.image,
						description: profile.bio,
						coverImage: profile.coverimage,
						handle: user.url
					}}
					tipsEnabled={profile.tipsEnabled}
					userId={user._id}
					tipMeText={profile.tipMeText || 'Tip me'}
					theme={currentTheme}
				/>
			{:else}
				<div class="flex min-h-[400px] items-center justify-center">
					<div class="flex flex-col items-center justify-center text-center text-muted-foreground">
						<div class="mb-4 text-6xl"><Layout size={64} weight="duotone" /></div>
						<h3 class="mb-2 text-xl font-semibold">No page found</h3>
						<p class="max-w-md text-sm">
							This profile doesn't have a page up yet , Check back later.
						</p>
					</div>
				</div>
			{/if}
		</section>
	{:else if profile.mode == 'tips'} 
		<!-- Here is the tipping mode we shouldn't show anything here -->
	{:else}
		<!-- Fallback for unknown mode -->
		<div class="flex min-h-screen items-center justify-center">
			<div class="text-center">
				<h1 class="mb-4 text-2xl font-bold">{profile.displayName}</h1>
				<p class="text-muted-foreground">Profile mode not supported</p>
			</div>
		</div>
	{/if}
</main>

