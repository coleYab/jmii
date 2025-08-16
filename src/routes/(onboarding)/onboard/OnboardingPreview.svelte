<script lang="ts">
	import { HandSwipeLeft, HandSwipeRight } from 'phosphor-svelte';
	import PagePreview from '$lib/components/PagePreview.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	interface IOnboardingPreviewProps {
		profileData: any;
		currentSnappedPanel: string;
	}

	let { profileData, currentSnappedPanel }: IOnboardingPreviewProps = $props();

	// Get the mode from profile data, default to 'creative' if not set
	let currentMode = $derived(profileData?.mode);
</script>

<div class="flex h-full flex-col items-center justify-center rounded-3xl">
	{#key profileData}
		<ScrollArea class="flex h-full w-full flex-col items-end justify-center scrollbar-hide">
			<PagePreview {profileData} mode={currentMode} focusOn="profile" />
		</ScrollArea>
	{/key}
	<!-- Swipe hint  -->
	<div
		class=" relative self-start overflow-clip rounded-3xl border border-primary bg-background px-2 py-1 lg:hidden"
	>
		<span
			class="absolute bottom-1/2 left-0 h-1/4 w-1/4 translate-y-1/2 rounded-3xl
			bg-gradient-to-br from-[#602A76] via-[#DC3092] to-[#F58823] blur-lg lg:hidden"
		>
		</span>
		<div class="flex items-center gap-2 text-xs">
			{#if currentSnappedPanel == 'form'}
				<HandSwipeLeft size={20} weight="duotone" />
			{:else}
				<HandSwipeRight size={20} weight="duotone" />
			{/if}
			{currentSnappedPanel === 'form' ? 'Swipe left' : 'Swipe right'}
		</div>
	</div>
</div>
