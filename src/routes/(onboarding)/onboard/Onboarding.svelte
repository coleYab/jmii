<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	// Import all onboarding step components
	import PersonalInfo from './OnboardingSteps/PersonalInfo.svelte';
	import ModeSelect from './OnboardingSteps/ModeSelect.svelte';
	import LinkInsert from './OnboardingSteps/LinkInsert.svelte';
	import TippingSetup from './OnboardingSteps/TippingSetup.svelte';
	import OnboardingPreview from './OnboardingPreview.svelte';
	import { GridFour, HandCoins, Link, User } from 'phosphor-svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { goto } from '$app/navigation';

	let stepComponents: any[] = $state([]);

	let { data, onRefresh, profileData } = $props();

	console.log(profileData);

	let currentStep = $state(1);
	const totalSteps = 4;
	let isCompleting = $state(false);
	let currentSnappedPanel: 'form' | 'preview' = $state('form'); // 'form' or 'preview'
	let formPanelRef: HTMLDivElement;
	let previewPanelRef: HTMLDivElement;

	// 602A76
	// DC3092
	// F58823

	const steps = [
		{
			title: 'Personal Info',
			description: 'Tell us about yourself',
			component: PersonalInfo,
			icon: User,
			estimatedTime: '3 minutes'
		},
		{
			title: 'Mode Select',
			description: 'Choose your style',
			component: ModeSelect,
			icon: GridFour,
			estimatedTime: '2 minutes'
		},
		{
			title: 'Your Links',
			description: 'Add your social links',
			component: LinkInsert,
			icon: Link,
			estimatedTime: '10 minutes'
		},
		{
			title: 'Tipping Setup',
			description: 'Set up payments',
			component: TippingSetup,
			icon: HandCoins,
			estimatedTime: '5 minutes'
		}
	];

	onMount(() => {
		// Initialize step components array
		stepComponents = new Array(steps.length);

		// Set up intersection observer to track which panel is in view
		if (typeof window !== 'undefined') {
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
							const panelId = entry.target.getAttribute('data-panel-id') as 'form' | 'preview';
							if (panelId && panelId !== currentSnappedPanel) {
								currentSnappedPanel = panelId;
								console.log('Snapped to panel:', panelId);
							}
						}
					});
				},
				{
					root: null,
					rootMargin: '0px',
					threshold: [0.1, 0.5, 0.9]
				}
			);

			// Wait for elements to be available then observe them
			setTimeout(() => {
				if (formPanelRef) observer.observe(formPanelRef);
				if (previewPanelRef) observer.observe(previewPanelRef);
			}, 0);

			// Cleanup
			return () => {
				observer.disconnect();
			};
		}
	});

	function canContinue() {
		const component = stepComponents[currentStep - 1];
		return component?.canContinue ? component.canContinue() : true;
	}

	async function handleFinish() {
		isCompleting = true;
	
			// Handle onboarding completion
			console.log('Onboarding completed!');

			// update the profile.firstTime to false
			await fetch('/api/user/profile', {
				method: 'PUT',
				body: JSON.stringify({ firstTime: false })
			});


		goto('/builder');
	}

	function nextStep() {
		if (currentStep < totalSteps) {
			currentStep++;
		}
	}

	function prevStep() {
		currentStep = Math.max(currentStep - 1, 1);
	}

	function skipStep() {
		nextStep();
	}

	// Navigate directly to a specific step
	function goToStep(stepNumber: number) {
		currentStep = stepNumber;
	}

	// Navigate to specific panel
	function goToPanel(panelId: 'form' | 'preview') {
		const targetElement = panelId === 'form' ? formPanelRef : previewPanelRef;
		if (targetElement) {
			targetElement.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
				inline: 'start'
			});
		}
	}

	// Calculate progress percentage: should align with the current active dot
	let progressPercentage = $derived(() => {
		if (isCompleting) return 100;
		// Progress should reach the current active dot
		// Dots are positioned at 10%, 36.67%, 63.33%, 90% (with 10% margins)
		const marginPercent = 10;
		const availableWidth = 100 - marginPercent * 2;
		const currentDotPosition =
			marginPercent + ((currentStep - 1) / (totalSteps - 1)) * availableWidth;
		return currentDotPosition;
	});

	// Calculate dot positions with spacing from edges (10% margin on each side)
	let dotPositions = $derived(() => {
		const marginPercent = 10;
		const availableWidth = 100 - marginPercent * 2;
		return steps.map((_, index) => {
			return marginPercent + (index / (totalSteps - 1)) * availableWidth;
		});
	});

	$inspect(profileData);
</script>

<div class="mx-auto flex h-full w-full flex-col overflow-y-auto">
	<!-- Header  -->
	<div
		class="sticky top-0 flex flex-col gap-4 rounded-t-3xl border-b border-primary bg-sidebar px-4 py-4 lg:px-8 lg:py-6"
	>
		<div class="flex flex-row items-start justify-between gap-2 lg:flex-col lg:items-start">
			<div class="flex flex-col gap-2">
				<div class="flex items-baseline gap-4 text-xs font-medium lg:text-sm">
					<h1 class="text-base text-primary lg:text-lg">
						{steps[currentStep - 1].title} | <span> Onboarding </span>
					</h1>
				</div>
				<p class="text-xs text-primary lg:text-sm">
					<span>
						{currentStep} of {totalSteps}
					</span>
					{steps[currentStep - 1].description} • Est. {steps[currentStep - 1].estimatedTime}
				</p>
			</div>
			<!-- Mobile Panel Indicators (only visible on mobile) -->
			<div class="flex justify-center gap-2 px-4 py-2 lg:hidden">
				<button
					onclick={() => goToPanel('form')}
					class="flex items-center gap-2 rounded-full px-3 py-1 text-xs transition-all
					{currentSnappedPanel === 'form'
						? 'border border-transparent bg-primary text-primary-foreground'
						: ' border border-primary bg-background text-primary'}"
				>
					Form
				</button>
				<button
					onclick={() => goToPanel('preview')}
					class="flex items-center gap-2 rounded-full px-3 py-1 text-xs transition-all
					{currentSnappedPanel === 'preview'
						? 'border border-transparent bg-primary text-primary-foreground'
						: 'border border-primary bg-background text-primary'}"
				>
					Preview
				</button>
			</div>
		</div>
		<!-- Progress Bar with Dots -->
		<div class="relative flex h-4 w-full items-center">
			<!-- Single Progress Line -->
			<div
				class="absolute top-1/2 h-6 w-full -translate-y-1/2 overflow-clip rounded-full border border-primary bg-white"
			>
				<!-- Progress Fill -->
				<div
					class="h-full rounded-full bg-gradient-to-br from-[#602A76] via-[#DC3092] to-[#F58823] blur-lg transition-all duration-300"
					style="width: {progressPercentage()}%"
				></div>
			</div>

			<!-- Absolutely Positioned Dots -->
			{#each steps as step, index}
				<button
					onclick={() => goToStep(index + 1)}
					class="absolute top-1/2 flex h-8 w-8
							-translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-primary text-sm
							shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all
							duration-300
							hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
							active:-translate-y-[40%] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]
							{index + 1 === currentStep
						? 'bg-primary text-background'
						: index + 1 < currentStep || isCompleting
							? `border border-primary bg-white text-black`
							: `bg-white text-black`}"
					style="left: {dotPositions()[index]}%"
					title="Go to {step.title}"
				>
					<step.icon size={20} weight="duotone" />
				</button>
			{/each}
		</div>
	</div>

	<!-- Main Content -->
	<div
		class="relative flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden
		py-2 scrollbar-hide lg:snap-none lg:overflow-y-auto lg:overflow-x-visible lg:px-8 lg:py-4"
	>
		<!-- Onboarding Form Panel -->
		<div
			bind:this={formPanelRef}
			data-panel-id="form"
			class="flex h-full w-[70%] flex-shrink-0 snap-start flex-col px-6 lg:w-[50%]"
		>
			<ScrollArea class="h-full w-full pr-4">
				{#each steps as step, index}
					{#if index + 1 === currentStep}
						{#key profileData}
							<step.component
								onNext={nextStep}
								onPrev={prevStep}
								onSkip={skipStep}
								{onRefresh}
								isFirst={index === 0}
								isLast={index + 1 === steps.length}
								{data}
								{profileData}
							/>
						{/key}
					{/if}
				{/each}
			</ScrollArea>
		</div>

		<!-- Preview Panel -->
		<div
			bind:this={previewPanelRef}
			data-panel-id="preview"
			class="flex h-full w-full flex-shrink-0 snap-start flex-col px-4 lg:w-[50%] lg:min-w-[400px] lg:px-0"
		>
			<OnboardingPreview {profileData} {currentSnappedPanel} />
		</div>
	</div>

	<!-- Navigation -->
	<div
		class="sticky bottom-0 flex items-center justify-between rounded-b-3xl border-t border-primary bg-sidebar px-8 py-4"
	>
		<div class="flex items-center gap-2">
			{#if currentStep > 1}
				<button
					onclick={prevStep}
					class="flex items-center gap-2 rounded-xl border border-primary bg-white px-4 py-2 text-sm text-black
							shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all
							duration-300
							hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
							active:translate-y-[4%] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]"
				>
					<ChevronLeft class="mr-2 h-4 w-4" />
					Previous
				</button>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			{#if currentStep < steps.length}
				<button
					onclick={skipStep}
					class="flex items-center gap-2 rounded-xl border border-primary bg-white px-4 py-2 text-sm text-black
							shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all
							duration-300
							hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
							active:translate-y-[4%] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]"
				>
					Skip
				</button>
				<button
					onclick={nextStep}
					disabled={!canContinue()}
					class="flex items-center gap-2 rounded-xl border border-primary px-4 py-2 text-sm
							shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all
							duration-300
							hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
							active:translate-y-[4%] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]
							{!canContinue()
						? 'cursor-not-allowed bg-gray-200 text-gray-400 opacity-50'
						: 'bg-primary text-background'}"
				>
					Next
					<ChevronRight class="ml-2 h-4 w-4" />
				</button>
			{:else}
				<button
					onclick={handleFinish}
					class="flex items-center gap-2 rounded-xl border border-primary bg-primary px-4 py-2
							text-sm text-background
							shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
							transition-all
							duration-300 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
							active:translate-y-[4%] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]"
				>
					Complete Setup
				</button>
			{/if}
		</div>
	</div>
</div>
