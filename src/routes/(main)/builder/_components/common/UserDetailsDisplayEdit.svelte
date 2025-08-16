<script lang="ts">
	import type { Profile } from '$lib/types/profile';
	import { getWidgetPixelSize } from '$src/utils/widgetRegistry';
	import { MediaQuery } from 'svelte/reactivity';
	import { innerWidth } from 'svelte/reactivity/window';
	import { CameraRotate, Panorama, PencilSimple, PencilSimpleLine } from 'phosphor-svelte';
	import TipMe from './TipMe.svelte';
	import { themeStore } from '$src/stores/themeStore';
	import { getResponsiveCellDimensions } from '$src/stores/board/board.config';

	import PFPUpload from './EditModals/PFPUpload.svelte';
	import BannerUpload from './EditModals/BannerUpload.svelte';
	import UserDataEdit from './EditModals/UserDataEdit.svelte';
	import { fade } from 'svelte/transition';

	let {
		profileData,
		isManualOverride,
		isPublicView,
		refresh,
		onLinkClick,
		mode = 'creative'
	}: {
		profileData: Profile | null;
		isManualOverride: boolean;
		isPublicView: boolean;
		refresh: () => void;
		onLinkClick?: (url: string) => void;
		mode?: 'classic' | 'creative';
	} = $props();

	let showImageUpload = $state(false);
	let showBannerUpload = $state(false);
	let editProfileOpen = $state(false);

	const isMobileViewport = new MediaQuery('(max-width: 768px)');

	// Get current theme
	const currentTheme = $derived($themeStore.currentTheme);

	// Calculate dimensions based on mode
	let containerWidth = $derived.by(() => {
		if (mode === 'classic') {
			// Classic mode uses fixed max width like the classic board: min(98vw, 720px) - 1rem
			const viewportWidth = innerWidth.current || 1024;
			const maxWidth = Math.min(viewportWidth * 0.98, 720) - 16; // 1rem = 16px
			return Math.max(280, maxWidth); // Minimum width for mobile
		} else if (mode == 'creative') {
			// Creative mode uses board width calculation (max 4 columns)
			const viewportWidth = innerWidth.current || 1024;
			const responsive = getResponsiveCellDimensions(viewportWidth);
			const columns = isMobileViewport.current || isManualOverride ? 2 : 4;
			return columns * (responsive.CELL_WIDTH + responsive.CELL_GAP) - responsive.CELL_GAP;
		} else {
			return 0;
		}
	});
	
	// Mobile-responsive sizes
	let profileImageSize = $derived(isMobileViewport.current ? 12 : 16); // 48px vs 64px
	let iconSize = $derived(isMobileViewport.current ? 16 : 20); // Smaller icons on mobile
	let buttonSize = $derived(isMobileViewport.current ? 6 : 8); // 24px vs 32px button container
</script>

{#key profileData}
	<div class="container relative z-0 mx-auto flex items-center justify-center" in:fade>
		<div
			class="relative flex flex-col items-end justify-start overflow-hidden border transition-all duration-300"
			style="width: {containerWidth}px; {currentTheme 
				? `
				background-color: ${currentTheme.background}; 
				border-color: ${currentTheme.stroke}; 
				box-shadow: ${currentTheme.shadow.default};
				border-radius: ${currentTheme.buttonRounding}px;
			` 
				: 'border-radius: 12px; border-color: rgb(229 231 235); background-color: white; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);'}"
		>
			<!-- Cover Image -->
			<div class="relative overflow-hidden">
				<img
					src={profileData?.coverimage || '/default_banner.jpg'}
					alt="Cover"
					class="aspect-[3/1] h-full w-full object-cover"
					style="width: {containerWidth}px; "
				/>

				<!-- Tip Me Button - positioned at top center -->
				<div class="absolute left-1/2 top-2 md:top-4 z-10 -translate-x-1/2">
					<TipMe
						{profileData}
						{refresh}
						{isPublicView}
						userName={profileData?.displayName || 'this creator'}
						userId={profileData?.user?._id.toString()}
						tipMeText={profileData?.tipMeText || 'Tip me'}
					/>
				</div>

				{#if !isPublicView}
					<div class="absolute right-1 md:right-2 top-1 md:top-2 z-10">
						<div class="group relative mr-1 md:mr-3 flex">
							<button
								onclick={() => (showBannerUpload = true)}
								class="relative z-20 inline-flex w-fit flex-row items-center justify-center gap-2 backdrop-blur-lg transition-all duration-300 ease-in-out"
								style="padding: {isMobileViewport.current ? '4px' : '8px'}; {currentTheme 
									? `
									background-color: ${currentTheme.buttonBackground}; 
									color: ${currentTheme.buttonColor};
									border: 1px solid ${currentTheme.stroke};
									border-radius: ${currentTheme.buttonRounding}px;
									box-shadow: ${currentTheme.shadow.default};
								` 
									: 'background-color: white; color: black; border-radius: 16px; border: 1px solid rgb(229 231 235);'}"
								onmouseover={(e) => {
									if (currentTheme) {
										e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
									}
								}}
								onmouseout={(e) => {
									if (currentTheme) {
										e.currentTarget.style.boxShadow = currentTheme.shadow.default;
									}
								}}
							>
								<Panorama size={iconSize} weight="duotone" />
							</button>
							<span
								class="absolute -bottom-[2px] md:-bottom-[4px] -right-[2px] md:-right-[4px]
						rounded-2xl opacity-100 saturate-0
						transition-all duration-300 ease-in-out
						group-hover:-translate-x-[1px] md:group-hover:-translate-x-[2px] group-hover:-translate-y-[1px] md:group-hover:-translate-y-[2px]"
								style="background: linear-gradient(to bottom right, #602A76, #DC3092, #F58823);
						width: calc(100%);
						height: calc(100%);"
							>
							</span>
							<span
								class="absolute -left-[1px] -top-[1px] rounded-[17px] opacity-100 saturate-0"
								style="background: linear-gradient(to bottom right, #602A76, #DC3092, #F58823);
						width: calc(100% + 2px);
						height: calc(100% + 2px);"
							>
							</span>
						</div>
					</div>
				{/if}
			</div>

	
			<div 
				class="flex w-full flex-row items-center justify-start px-2 md:px-4 py-2 md:py-4"
				style="gap: {isMobileViewport.current ? '8px' : '16px'}; {currentTheme ? `background-color: ${currentTheme.background};` : 'background-color: white;'}"
			>
		
				<div 
					class="group relative aspect-square border-2"
					style="width: {profileImageSize * 4}px; height: {profileImageSize * 4}px; {currentTheme 
						? `
						background-color: ${currentTheme.buttonBackground}; 
						border-color: ${currentTheme.stroke};
						border-radius: ${currentTheme.buttonRounding}px;
					` 
						: 'background-color: rgb(99 102 241); border-color: rgb(229 231 235); border-radius: 50%;'}"
				>
					{#if profileData?.image}
						<img
							src={profileData.image}
							alt="Profile"
							class="aspect-square object-cover transition-all duration-300"
							style="width: {profileImageSize * 4}px; height: {profileImageSize * 4}px; {currentTheme 
								? `border-radius: ${currentTheme.buttonRounding}px;` 
								: 'border-radius: 50%;'}"
						/>
					{:else}
						<img
							src="https://api.dicebear.com/9.x/shapes/svg?seed={profileData?.displayName}&backgroundColor=b6e3f4"
							alt="Profile"
							class="aspect-square object-cover transition-all duration-300"
							style="width: {profileImageSize * 4}px; height: {profileImageSize * 4}px; {currentTheme 
								? `border-radius: ${currentTheme.buttonRounding}px;` 
								: 'border-radius: 50%;'}"
						/>
					{/if}
				
					{#if !isPublicView}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							class="absolute cursor-pointer flex items-center
                            justify-center backdrop-blur-sm transition-all duration-300 hover:opacity-100"
							style="bottom: {isMobileViewport.current ? '-4px' : '-8px'}; right: {isMobileViewport.current ? '-4px' : '-8px'}; width: {buttonSize * 4}px; height: {buttonSize * 4}px; {currentTheme 
								? `
								background-color: ${currentTheme.buttonBackground}; 
								color: ${currentTheme.buttonColor};
								border: 1px solid ${currentTheme.stroke};
								border-radius: ${currentTheme.buttonRounding}px;
								box-shadow: ${currentTheme.shadow.default};
							` 
								: 'background-color: rgb(99 102 241 / 0.8); color: white; border-radius: 50%;'}"
							onclick={() => (showImageUpload = true)}
						>
							<CameraRotate weight="duotone" size={isMobileViewport.current ? 12 : 20} />
						</div>
					{/if}
				</div>

				<div class="relative flex grow flex-col items-start justify-start gap-1 md:gap-2">
					<div class="flex max-w-64 items-baseline justify-start flex-col">
						<span 
							class="whitespace-nowrap font-semibold"
							style="font-size: {isMobileViewport.current ? '14px' : '20px'}; {currentTheme ? `color: ${currentTheme.foreground};` : 'color: black;'}"
							title={profileData?.displayName || 'Your Name'}
						>
							{(profileData?.displayName || 'Your Name').length > 16 
								? (profileData?.displayName || 'Your Name').slice(0, 16) + '...' 
								: (profileData?.displayName || 'Your Name')}
						</span>
						<span 
							class="max-w-48 truncate text-xs md:text-sm"
							style="{currentTheme ? `color: ${currentTheme.foreground}; opacity: 0.7;` : 'color: rgb(107 114 128);'}"
						>
							@{profileData?.url || 'yoururl'}
						</span>
					</div>
					<p 
						class="line-clamp-1 text-xs md:text-sm"
						style="{currentTheme ? `color: ${currentTheme.foreground}; opacity: 0.8;` : 'color: rgb(107 114 128);'}"
					>
						{profileData?.bio || 'Your bio will appear here. Tell people what makes you unique!'}
					</p>

					<!-- Links Section -->
					{#if profileData?.links && profileData.links.length > 0}
						<div class="mt-1 flex flex-wrap items-center gap-1 md:gap-2">
							{#each profileData.links.filter((link: any) => link.highlighted) as link}
								<a
									href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
									target="_blank"
									rel="noopener noreferrer"
									class="flex items-center justify-center text-xs transition-opacity hover:opacity-70"
									style="width: {isMobileViewport.current ? '12px' : '16px'}; height: {isMobileViewport.current ? '12px' : '16px'};"
									title="{link.platform}: {link.username}"
									onclick={() =>
										onLinkClick?.(link.url.startsWith('http') ? link.url : `https://${link.url}`)}
								>
									<span class="flex items-center justify-center" style="width: {isMobileViewport.current ? '12px' : '16px'}; height: {isMobileViewport.current ? '12px' : '16px'};">
										{link.icon}
									</span>
								</a>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Edit Profile Button -->
				{#if !isPublicView}
					<div class="group relative mr-1 md:mr-3 flex">
						<button
							onclick={() => (editProfileOpen = true)}
							class="relative z-20 inline-flex w-fit flex-row items-center justify-center gap-2 backdrop-blur-lg transition-all duration-300 ease-in-out"
							style="padding: {isMobileViewport.current ? '4px' : '8px'}; {currentTheme 
								? `
								background-color: ${currentTheme.buttonBackground}; 
								color: ${currentTheme.buttonColor};
								border: 1px solid ${currentTheme.stroke};
								border-radius: ${currentTheme.buttonRounding}px;
								box-shadow: ${currentTheme.shadow.default};
							` 
								: 'background-color: white; color: black; border-radius: 16px; border: 1px solid rgb(229 231 235);'}"
							onmouseover={(e) => {
								if (currentTheme) {
									e.currentTarget.style.boxShadow = currentTheme.shadow.hovered;
								}
							}}
							onmouseout={(e) => {
								if (currentTheme) {
									e.currentTarget.style.boxShadow = currentTheme.shadow.default;
								}
							}}
						>
							<PencilSimpleLine size={iconSize} weight="duotone" />
						</button>
						<span
							class="absolute -bottom-[2px] md:-bottom-[4px] -right-[2px] md:-right-[4px]
					rounded-2xl opacity-100 saturate-0
					transition-all duration-300 ease-in-out
					group-hover:-translate-x-[1px] md:group-hover:-translate-x-[2px] group-hover:-translate-y-[1px] md:group-hover:-translate-y-[2px]"
							style="background: linear-gradient(to bottom right, #602A76, #DC3092, #F58823);
					width: calc(100%);
					height: calc(100%);"
						>
						</span>
						<span
							class="absolute -left-[1px] -top-[1px] rounded-[17px] opacity-100 saturate-0"
							style="background: linear-gradient(to bottom right, #602A76, #DC3092, #F58823);
					width: calc(100% + 2px);
					height: calc(100% + 2px);"
						>
						</span>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/key}

<!-- {#if userProfile}
<div class="mb-8 flex items-center justify-center">
	<div
		class="relative flex flex-shrink items-end justify-center overflow-hidden rounded-xl border border-primary/30 bg-background shadow-lg transition-all duration-300 hover:border-primary"
		style="width: {getWidgetPixelSize(2, 1, innerWidth.current || 1024).width *
			(isMobileViewport ? 1 : 2)}px; height: {getWidgetPixelSize(2, 1, innerWidth.current || 1024).height * 1.2}px"
	>
		<div
			class="absolute inset-0"
			style="background-image: url('{userProfile.coverImage ||
				'/default_banner.jpg'}'); background-size: cover; background-position: center;"
		></div>

		<div
			class="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-sm"
		></div>

		{#if tipsEnabled && userId}
			<div class="absolute left-1/2 top-2 -translate-x-1/2 backdrop-blur-sm">
				<TipMe
					profileData={userProfile}
					userName={userProfile?.name || 'this creator'}
					{userId}
					{tipMeText}
				/>
			</div>
		{/if}

		<div class="relative z-10 flex h-fit w-full p-4">
			<div class="flex w-full flex-row items-center justify-between gap-4">
				<div class="flex flex-row items-center justify-start gap-4">
					<div class="flex-shrink-0">
						<div class="group relative">
							<div
								class="h-16 w-16 overflow-hidden rounded-full border-2 border-background bg-gradient-to-br from-primary/20 to-secondary/20 shadow-lg"
							>
								<img
									src={userProfile.picture || '/default_avatar.jpg'}
									alt={userProfile.name || 'User'}
									class="h-full w-full object-cover"
								/>
							</div>
						</div>
					</div>

					<div class="flex min-w-0 flex-1 flex-col justify-start">
						<div class="mb-1">
							<h3
								class="truncate {isMobileViewport
									? 'text-base'
									: 'text-lg'} font-bold leading-tight text-background"
							>
								{userProfile.name || 'User'}
							</h3>
							<p class="max-w-48 truncate text-sm text-background/80">
								@{userProfile.handle || 'user'}
							</p>
						</div>
						<p class="line-clamp-2 text-sm text-background/90">
							{userProfile.description || 'No bio available'}
						</p>
					</div>
				</div>

				<div class="flex flex-row items-center justify-end gap-2">
					{#if userProfile.links && userProfile.links.length > 0}
						<div class="flex flex-wrap items-center gap-2">
							{#each userProfile.links.filter((link: any) => link.highlighted) as link}
								<a
									href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
									target="_blank"
									rel="noopener noreferrer"
									class="flex h-4 w-4 items-center justify-center rounded-sm bg-background/20 text-xs backdrop-blur-sm transition-opacity hover:opacity-70"
									title="{link.platform}: {link.username}"
									onclick={() => onLinkClick?.(link.url.startsWith('http') ? link.url : `https://${link.url}`)}
								>
									<span class="flex items-center justify-center text-background">
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
</div>
{/if} -->

<PFPUpload bind:profileData bind:showDialog={showImageUpload} {refresh} />
<BannerUpload {profileData} bind:showDialog={showBannerUpload} {refresh} />
<UserDataEdit {profileData} bind:showDialog={editProfileOpen} {refresh} />
