<script lang="ts">
	import { GearSix, HandCoins, PencilSimple } from 'phosphor-svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import TipModal from './TipModal.svelte';
	import { onMount } from 'svelte';
	import TippingDataEdit from './EditModals/TippingDataEdit.svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { tipFlowStore } from '$src/stores/tipFlowStore';

	let mounted = $state(false);
	let showBlink = $state(false);
	let textElement: HTMLElement;
	let needsMarquee = $state(false);

	// Mobile viewport detection
	const isMobileViewport = new MediaQuery('(max-width: 768px)');

	// Get user data from page data
	interface TipMeProps {
		userName?: string;
		userId?: string;
		tipMeText?: string;
		profileData: any;
		refresh?: () => void;
		isPublicView?: boolean;
	}

	let {
		userName = 'this creator',
		userId,
		tipMeText = 'Tip me',
		profileData,
		refresh,
		isPublicView = false
	}: TipMeProps = $props();

	// Mobile-responsive sizes
	let iconSize = $derived(isMobileViewport.current ? 16 : 24);
	let padding = $derived(isMobileViewport.current ? 'px-2 py-1' : 'px-4 py-2');
	let fontSize = $derived(isMobileViewport.current ? 'text-sm' : 'text-md');
	let settingsButtonSize = $derived(isMobileViewport.current ? 32 : 42);
	let borderRadius = $derived(isMobileViewport.current ? 'rounded-xl' : 'rounded-2xl');
	
	// Fixed width for the text container
	let maxTextWidth = $derived(isMobileViewport.current ? '100px' : '120px');

	// Check if text needs marquee effect
	const checkTextOverflow = () => {
		if (textElement) {
			// Create a temporary element to measure text width
			const tempElement = document.createElement('span');
			tempElement.style.visibility = 'hidden';
			tempElement.style.position = 'absolute';
			tempElement.style.whiteSpace = 'nowrap';
			tempElement.className = textElement.className.replace('animate-marquee', '');
			tempElement.textContent = tipMeText;
			document.body.appendChild(tempElement);
			
			const textWidth = tempElement.offsetWidth;
			const containerWidth = parseInt(maxTextWidth);
			needsMarquee = textWidth > containerWidth;
			
			document.body.removeChild(tempElement);
		}
	};

	// Handle tip button click
	const handleTipClick = () => {
		tipFlowStore.update(state => ({
			...state,
			show: !state.show,
			tipData: state.show ? null : { userName, userId }
		}));
	};

	// Reactive statement to check text overflow when text or viewport changes
	$effect(() => {
		if (mounted && textElement) {
			checkTextOverflow();
		}
	});

	onMount(() => {
		// Start the blink effect immediately
		setTimeout(() => {
			showBlink = true;
		}, 500);

		// Remove the blur effect after blink
		setTimeout(() => {
			mounted = true;
		}, 2000);
		
		// Check text overflow after mount
		setTimeout(checkTextOverflow, 100);
	});
</script>

<div class="relative flex flex-row items-center justify-center rounded-2xl" style="gap: {isMobileViewport.current ? '8px' : '16px'};">
	{#if profileData?.tipsEnabled}
		<div class="group relative flex {borderRadius}">
			<button
				onclick={handleTipClick}
				class="relative z-20
			inline-flex flex-row items-center justify-center gap-1 md:gap-2 {borderRadius}
			bg-background backdrop-blur-lg
			transition-all duration-300 ease-in-out hover:bg-background/95
			{showBlink ? 'animate-blink' : ''} {padding}"
			>
				<div class="text-container overflow-hidden" style="width: {maxTextWidth};">
					{#if needsMarquee}
						<div 
							bind:this={textElement}
							class="{fontSize} text-primary whitespace-nowrap animate-marquee"
						>
							<span class="marquee-content">{tipMeText}</span>
							<span class="marquee-content">{tipMeText}</span>
						</div>
					{:else}
						<span 
							bind:this={textElement}
							class="{fontSize} text-primary whitespace-nowrap text-center block"
						>
							{tipMeText}
						</span>
					{/if}
				</div>
				<HandCoins size={iconSize} weight="duotone" />
			</button>
			<span
				class="absolute opacity-100
			transition-all duration-300 ease-in-out
			group-hover:-translate-x-[1px] md:group-hover:-translate-x-[2px] group-hover:-translate-y-[1px] md:group-hover:-translate-y-[2px] {borderRadius}"
				style="bottom: {isMobileViewport.current ? '-2px' : '-4px'}; right: {isMobileViewport.current ? '-2px' : '-4px'}; background: linear-gradient(to bottom right, #602A76, #DC3092, #F58823);
			width: calc(100%);
			height: calc(100%);"
			>
			</span>
			<span
				class="absolute -left-[1px] -top-[1px] opacity-100"
				style="border-radius: {isMobileViewport.current ? '12px' : '17px'}; background: linear-gradient(to bottom right, #602A76, #DC3092, #F58823);
			width: calc(100% + 2px);
			height: calc(100% + 2px);"
			>
			</span>
			<span
				class="absolute -left-[1px] -top-[1px] blur-lg {mounted
					? 'opacity-0'
					: 'opacity-100'} transition-all duration-1000 ease-in-out"
				style="border-radius: {isMobileViewport.current ? '12px' : '17px'}; background: linear-gradient(to bottom right, #602A76, #DC3092, #F58823);
			width: calc(100% + 2px);
			height: calc(100% + 2px);"
			>
			</span>
		</div>
	{:else if !isPublicView}
		<div class="group relative flex {borderRadius}">
			<button
				class="relative z-20
	inline-flex flex-row items-center justify-center gap-1 md:gap-2 {borderRadius}
	bg-background backdrop-blur-lg
	transition-all duration-300 ease-in-out hover:bg-background/95 {padding}"
			>
				<div class="text-container overflow-hidden" style="width: {maxTextWidth};">
					<span class="{fontSize} text-primary whitespace-nowrap text-center block">Tipping Disabled</span>
				</div>
				<HandCoins size={iconSize} weight="duotone" />
			</button>
			<span
				class="absolute opacity-100 saturate-0
	transition-all duration-300 ease-in-out
	group-hover:-translate-x-[1px] md:group-hover:-translate-x-[2px] group-hover:-translate-y-[1px] md:group-hover:-translate-y-[2px] {borderRadius}"
				style="bottom: {isMobileViewport.current ? '-2px' : '-4px'}; right: {isMobileViewport.current ? '-2px' : '-4px'}; background: linear-gradient(to bottom right, #602A76, #DC3092, #F58823);
	width: calc(100%);
	height: calc(100%);"
			>
			</span>
			<span
				class="absolute -left-[1px] -top-[1px] opacity-100 saturate-0"
				style="border-radius: {isMobileViewport.current ? '12px' : '17px'}; background: linear-gradient(to bottom right, #602A76, #DC3092, #F58823);
	width: calc(100% + 2px);
	height: calc(100% + 2px);"
			>
			</span>
		</div>
	{/if}

	{#if !isPublicView}
		<Dialog.Root>
			<Dialog.Trigger>
				<div class="group relative flex items-center justify-center {borderRadius}">
					<button
						class="z-20 inline-flex flex-row items-center justify-center {borderRadius} bg-background
						p-1 backdrop-blur-lg transition-all duration-300 ease-in-out"
						style="width: {settingsButtonSize}px; height: {settingsButtonSize}px;"
				>
						<span class="absolute inset-0 ml-[1px] md:ml-[2px] flex items-center justify-center">
							<GearSix size={isMobileViewport.current ? 16 : 24} weight="duotone" class="aspect-square text-primary" />
						</span>
					</button>

					<span
						class="absolute opacity-100
			transition-all duration-300 ease-in-out {borderRadius}"
						style="bottom: {isMobileViewport.current ? '-1px' : '-2px'}; right: {isMobileViewport.current ? '-1px' : '-2px'}; background: #333;
			width: calc(100%);
			height: calc(100%);"
					>
					</span>
					<span
						class="absolute -left-[1px] -top-[1px] opacity-100"
						style="border-radius: {isMobileViewport.current ? '12px' : '17px'}; background: #333;
			width: calc(100% + 2px);
			height: calc(100% + 2px);"
					>
					</span>
				</div>
			</Dialog.Trigger>
			<Dialog.Content
				class="!m-0 overflow-clip !rounded-3xl border border-primary !p-0 sm:max-w-md "
			>
				<TippingDataEdit
					{profileData}
					refresh={() => {
						refresh?.();
					}}
				/>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
</div>

<style>
	.animate-blink {
		animation: blink 500ms ease-in-out;
	}

	@keyframes blink {
		0% {
			opacity: 1;
		}
		25% {
			opacity: 0.2;
		}
		50% {
			opacity: 1;
		}
		75% {
			opacity: 0.4;
		}
		100% {
			opacity: 1;
		}
	}

	@keyframes marquee {
		0% {
			transform: translateX(0%);
		}
		100% {
			transform: translateX(-100%);
		}
	}

	.animate-marquee {
		animation: marquee 8s linear infinite;
		display: flex;
		width: max-content;
	}

	.marquee-content {
		padding-right: 2rem;
		flex-shrink: 0;
		white-space: nowrap;
	}
</style>
