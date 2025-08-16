<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { CreditCard, ArrowLeft, X } from 'phosphor-svelte';
	import AmountStep from './AmountStep.svelte';
	import { browser } from '$app/environment';
	import { tipFlowStore } from '$src/stores/tipFlowStore';

	interface TipFlowProps {
		userName?: string;
		userId?: string;
	}

	let { userName = 'this creator', userId }: TipFlowProps = $props();

	// State management
	let currentStep = $state<'amount' | 'details'>('amount');
	let tipAmount = $state(5);
	let customAmount = $state('');
	let isAnonymous = $state(false);
	let senderPhone = $state('');
	let note = $state('');

	// Form submission handling
	let isSubmitting = $state(false);
	let formError = $state<string | null>(null);

	// localStorage key for phone number
	const PHONE_STORAGE_KEY = 'jami_tip_phone_number';

	// Load saved phone number on mount
	onMount(() => {
		if (browser) {
			const savedPhone = localStorage.getItem(PHONE_STORAGE_KEY);
			if (savedPhone) {
				senderPhone = savedPhone;
			}
		}
	});

	// Save phone number to localStorage when it changes (and is valid)
	$effect(() => {
		if (browser && senderPhone.trim()) {
			// Only save if it matches the expected format
			const phoneRegex = /^251[97]\d{8}$/;
			if (phoneRegex.test(senderPhone.trim())) {
				localStorage.setItem(PHONE_STORAGE_KEY, senderPhone.trim());
			}
		} else if (browser && !senderPhone.trim()) {
			// Clear saved phone number if user removes it
			localStorage.removeItem(PHONE_STORAGE_KEY);
		}
	});

	// Navigation functions
	const goToDetails = () => {
		currentStep = 'details';
	};

	const submitTip = async () => {
		// Validate required fields before submitting
		if (!senderPhone.trim()) {
			formError = 'Phone number is required';
			return;
		}

		// Validate phone number format (must be 251XXXXXXXXX)
		const phoneRegex = /^251[97]\d{8}$/;
		if (!phoneRegex.test(senderPhone.trim())) {
			formError = 'Phone number must be in format 251XXXXXXXXX (e.g., 251912345678)';
			return;
		}

		formError = null;
		await handleCheckout();
	};

	const goBack = () => {
		formError = null;
		if (currentStep === 'details') {
			currentStep = 'amount';
		}
	};

	const closeTipFlow = () => {
		tipFlowStore.update(state => ({ ...state, show: false, tipData: null }));
	};

	// Handle checkout submission
	const handleCheckout = async () => {
		if (!userId) {
			formError = 'User ID is required';
			return;
		}

		isSubmitting = true;
		formError = null;

		try {
			const response = await fetch('/api/tip/checkout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					amount: tipAmount,
					userName,
					userId,
					isAnonymous,
					senderPhone,
					note
				})
			});

			const result = await response.json();

			if (!response.ok) {
				formError = result.error || 'An error occurred';
				return;
			}

			if (result.success && result.paymentUrl) {
				// Redirect to payment URL
				window.location.href = result.paymentUrl;
			} else {
				formError = 'Payment URL not received';
			}
		} catch (error) {
			console.error('Checkout error:', error);
			formError = 'Network error occurred. Please try again.';
		} finally {
			isSubmitting = false;
		}
	};

	let subtitle = $derived(`Tipping ${userName} ${tipAmount} ETB`);

	// Step configuration
	const stepConfig = $derived({
		amount: {
			title: 'Choose tip amount',
			subtitle: `Show your support for ${userName}`
		},
		details: {
			title: 'Complete your tip',
			subtitle: subtitle
		}
	});
</script>

<!-- Backdrop -->
<div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onclick={closeTipFlow}>
</div>

<!-- Dialog-like container -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" in:fly={{ y: 20, duration: 300, easing: cubicOut }}>
	<div class="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg max-h-[85vh] overflow-hidden">
		<div class="flex h-full w-full flex-col rounded-xl border border-primary bg-background shadow-2xl transition-all duration-300">
			<!-- Header -->
			<div class="flex items-center justify-between rounded-t-xl border-b border-primary bg-sidebar px-3 py-2 sm:px-4 sm:py-3">
				<div class="flex-1 text-center">
					<h3 class="text-xs font-semibold text-primary sm:text-sm md:text-base">{stepConfig[currentStep].title}</h3>
					<p class="text-xs text-primary">{stepConfig[currentStep].subtitle}</p>
				</div>
				<button
					onclick={closeTipFlow}
					class="ml-2 rounded-full p-1 text-primary/60 transition-colors hover:bg-primary/10 hover:text-primary"
				>
					<X size={16} class="sm:w-4 sm:h-4" />
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto">
				{#if currentStep === 'amount'}
					<div class="flex h-full w-full flex-col px-3 py-3 sm:px-4 sm:py-4" in:fly={{ x: -10, easing: cubicOut }}>
						<div class="flex flex-1 flex-col justify-center">
							<AmountStep bind:tipAmount />
						</div>
					</div>
				{:else if currentStep === 'details'}
					<div class="flex h-full w-full flex-col px-3 py-3 sm:px-4 sm:py-4" in:fly={{ x: -10, easing: cubicOut }}>
						<div class="flex h-full flex-1 flex-col justify-center space-y-2 sm:space-y-3 md:space-y-4">
							<!-- Anonymous toggle -->
							<div class="flex items-center space-x-2">
								<Switch id="anonymous" bind:checked={isAnonymous} />
								<Label for="anonymous" class="text-xs">Send anonymously</Label>
							</div>

							<!-- Phone number -->
							<div class="space-y-1">
								<Label for="sender-phone" class="text-xs">Phone Number</Label>
								<Input
									id="sender-phone"
									type="tel"
									placeholder="251912345678"
									bind:value={senderPhone}
									class="font-mono text-xs h-7 sm:h-8"
								/>
								<p class="text-xs text-muted-foreground">
									Format: 251XXXXXXXXX (must start with 2519 or 2517)
								</p>
							</div>

							<!-- Message -->
							<div class="flex flex-1 flex-col space-y-1">
								<Label for="note" class="text-xs">Message (optional)</Label>
								<Textarea
									id="note"
									placeholder="Leave a message for {userName}..."
									bind:value={note}
									class="flex-1 min-h-[60px] sm:min-h-[80px] text-xs resize-none"
								/>
							</div>

							{#if formError}
								<div class="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
									{formError}
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="rounded-b-xl border-t border-primary bg-sidebar px-3 py-2 sm:px-4 sm:py-3">
				{#if currentStep === 'amount'}
					<div class="flex gap-2" in:fly={{ y: -4, easing: cubicOut }}>
						<Button
							onclick={goToDetails}
							disabled={!tipAmount && !customAmount}
							class="h-auto w-full rounded-lg border-b-4 border-l border-r-4 border-t border-primary bg-primary/90 py-2 text-xs text-background"
						>
							Continue with <span class="truncate">{tipAmount} ETB</span>
						</Button>
					</div>
				{:else if currentStep === 'details'}
					<div class="flex gap-2" in:fly={{ y: -4, easing: cubicOut }}>
						<Button
							class="h-auto w-full rounded-lg 
						border-b-4 border-l border-r-4 border-t border-primary bg-background py-2 text-xs text-primary hover:bg-sidebar"
							onclick={goBack}
						>
							<ArrowLeft class="mr-1 h-3 w-3" />
							Back
						</Button>
						<Button
							onclick={submitTip}
							class="h-auto w-full rounded-lg border-b-4 border-l border-r-4 border-t border-primary bg-primary/90 py-2 text-xs text-background"
							disabled={isSubmitting || !userId}
						>
							<CreditCard class="mr-1 h-4 w-4" />
							{isSubmitting ? 'Processing...' : 'Pay Now'}
						</Button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div> 