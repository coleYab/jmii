<script lang="ts">
	import { browser } from '$app/environment';
	import TipMe from '$src/routes/(main)/builder/_components/common/TipMe.svelte';

	interface IUserProfileSectionProps {
		profileData: any;
		mode: 'classic' | 'creative';
		boardWidth?: number;
		cellDimensions?: {
			width: number;
			height: number;
			gap: number;
		};
		userName?: string;
		userId?: string;
	}

	let {
		profileData,
		mode,
		boardWidth,
		cellDimensions,
		userName,
		userId
	}: IUserProfileSectionProps = $props();

	// Determine which cover image to show
	let coverImageUrl = $derived.by(() => {
		return profileData.coverimage || '/default_banner.jpg';
	});
</script>

{#if browser && profileData}
	{#if mode === 'classic'}
		<!-- Classic Mode - Matching Public Layout -->
		<div class="relative flex aspect-[3/2] w-full flex-col items-end justify-start">
			<div class="relative overflow-hidden rounded-t-2xl">
				<img src={coverImageUrl} alt="" class="h- aspect-[3/2] w-full object-cover" />

				<!-- Tip Me Button - positioned at top center -->
				{#if profileData.tipsEnabled}
					<div class="absolute left-1/2 top-4 z-10 -translate-x-1/2">
						<TipMe
							{profileData}
							userName={userName || profileData.displayName || 'this creator'}
							{userId}
							tipMeText={profileData.tipMeText || 'Tip me'}
						/>
					</div>
				{/if}
			</div>

			<!-- User Data - Matching public positioning -->
			<div
				class=" flex w-full flex-row items-center justify-between gap-4 rounded-b-3xl border border-primary/50 bg-background px-2 py-4"
			>
				<div class="flex flex-row items-center justify-start gap-4">
					<!-- Profile Image -->
					<div class="aspect-square size-16 overflow-hidden rounded-full bg-primary">
						{#if profileData.image}
							<img
								src={profileData.image}
								alt="Profile"
								class="aspect-square size-16 rounded-full object-cover"
							/>
						{:else}
							<div
								class="flex h-full w-full items-center justify-center text-2xl text-muted-foreground"
							>
								👤
							</div>
						{/if}
					</div>

					<div class="relative flex grow flex-col items-start justify-start md:gap-2">
						<div class="flex max-w-64 items-center justify-center gap-2">
							<span class="whitespace-nowrap text-sm md:text-xl">
								{profileData.displayName || 'Your Name'}
							</span>
							<span class="max-w-48 self-end truncate text-sm text-secondary-foreground">
								@{profileData.url || 'yoururl'}
							</span>
						</div>
						<p class="line-clamp-1 text-sm text-secondary-foreground">
							{profileData.bio || 'Your bio will appear here. Tell people what makes you unique!'}
						</p>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-2">
					{#if profileData.links && profileData.links.length > 0}
						{#each profileData.links.filter((link: any) => link.highlighted) as link}
							<a
								href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
								target="_blank"
								rel="noopener noreferrer"
								class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-xs transition-opacity hover:opacity-70"
								title="{link.platform}: {link.username}"
							>
								<span class="flex items-center justify-center text-primary-foreground">
									{link.icon}
								</span>
							</a>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	{:else if mode === 'creative'}
		<!-- Creative Mode - Enhanced User Profile Section -->
		<div class="mb-[{cellDimensions?.gap || 16}] flex w-full items-center justify-center">
			<div
				class="relative flex flex-col items-end justify-start overflow-hidden rounded-xl border border-primary/30
		bg-background shadow-lg transition-all duration-300 hover:border-primary"
				style="width: {boardWidth ? boardWidth : 0}px; height: {Math.floor(
					(cellDimensions?.height || 120) * 1.2
				)}px"
			>
				<!-- Cover Image -->
				<div class="relative overflow-hidden">
					<img
						src={coverImageUrl}
						alt="Cover"
						class="aspect-[3/2] h-full w-full object-cover"
						style="height: {Math.floor(cellDimensions?.height || 120)}px; width: {boardWidth
							? boardWidth + 16
							: 0}px;"
					/>

					<!-- Tip Me Button - positioned at top center -->
					{#if profileData.tipsEnabled}
						<div class="absolute left-1/2 top-4 z-10 -translate-x-1/2">
							<TipMe
								{profileData}
								userName={userName || profileData.displayName || 'this creator'}
								{userId}
								tipMeText={profileData.tipMeText || 'Tip me'}
							/>
						</div>
					{/if}
				</div>

				<!-- User Data - Matching public positioning -->
				<div class=" flex w-full flex-row items-center justify-start gap-4 bg-background px-2 py-4">
					<!-- Profile Image -->
					<div class="aspect-square size-16 overflow-hidden rounded-full bg-primary">
						{#if profileData.image}
							<img
								src={profileData.image}
								alt="Profile"
								class="aspect-square size-16 rounded-full object-cover"
							/>
						{:else}
							<div
								class="flex h-full w-full items-center justify-center text-2xl text-muted-foreground"
							>
								👤
							</div>
						{/if}
					</div>

					<div class="relative flex grow flex-col items-start justify-start md:gap-2">
						<div class="flex max-w-64 items-center justify-center gap-2">
							<span class="whitespace-nowrap text-sm md:text-xl">
								{profileData.displayName || 'Your Name'}
							</span>
							<span class="max-w-48 self-end truncate text-sm text-secondary-foreground">
								@{profileData.url || 'yoururl'}
							</span>
						</div>
						<p class="line-clamp-1 text-sm text-secondary-foreground">
							{profileData.bio || 'Your bio will appear here. Tell people what makes you unique!'}
						</p>

						<!-- Links Section -->
						{#if profileData.links && profileData.links.length > 0}
							<div class="mt-1 flex flex-wrap items-center gap-2">
								{#each profileData.links.filter((link: any) => link.highlighted) as link}
									<a
										href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
										target="_blank"
										rel="noopener noreferrer"
										class="flex h-4 w-4 items-center justify-center text-xs transition-opacity hover:opacity-70"
										title="{link.platform}: {link.username}"
									>
										<span class="flex h-4 w-4 items-center justify-center">
											{link.icon}
										</span>
									</a>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
{:else}
	<div class="flex h-full w-full items-center justify-center">
		<p class="text-sm text-muted-foreground">Loading...</p>
	</div>
{/if}
