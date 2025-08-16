<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { CreditCard , ArrowLeft } from 'phosphor-svelte';
	import AmountStep from './AmountStep.svelte';
	import { browser } from '$app/environment';

	interface TipModalProps {
		userName?: string;
		userId?: string;
	}

	let { userName = 'this creator', userId }: TipModalProps = $props();

	// State management
	let currentStep = $state<'amount' | 'details' | 'checkout'>('amount');
	let tipAmount = $state(5);
	let customAmount = $state('');
	let isAnonymous = $state(false);
	let senderName = $state('');
	let senderEmail = $state('');
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
		}
	});

	// Navigation functions
	const goToDetails = () => {
		currentStep = 'details';
	};

	const goToCheckout = () => {
		// Validate required fields before going to checkout
		if (!senderPhone.trim()) {
			formError = 'Phone number is required for all tips';
			return;
		}

		// Validate phone number format (must be 251XXXXXXXXX)
		const phoneRegex = /^251[97]\d{8}$/;
		if (!phoneRegex.test(senderPhone.trim())) {
			formError = 'Phone number must be in format 251XXXXXXXXX (e.g., 251912345678)';
			return;
		}

		formError = null;
		currentStep = 'checkout';
	};

	const goBack = () => {
		formError = null;
		if (currentStep === 'details') {
			currentStep = 'amount';
		} else if (currentStep === 'checkout') {
			currentStep = 'details';
		}
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
					senderName,
					senderEmail,
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
			title: 'Tip details',
			subtitle: subtitle
		},
		checkout: {
			title: 'Review & Pay',
			subtitle: subtitle
		}
	});
</script>

<div class="flex h-full w-full min-h-[500px] min-w-[300px] max-w-[400px] flex-col transition-all duration-300 sm:min-w-[400px]">
	<!-- Header -->
	<div class="rounded-t-3xl border-b border-primary bg-sidebar px-4 py-3 sm:px-6 sm:py-4">
		<div class="text-center">
			<h3 class="text-base font-semibold text-primary sm:text-lg">{stepConfig[currentStep].title}</h3>
			<p class="text-xs text-primary sm:text-sm">{stepConfig[currentStep].subtitle}</p>
		</div>
	</div>

	{#if currentStep === 'amount'}
		<div class="flex h-full w-full flex-col px-4 py-4 sm:px-6 sm:py-6" in:fly={{ x: -10, easing: cubicOut }}>
			<!-- Content -->
			<div class="flex flex-1 flex-col justify-center">
				<AmountStep bind:tipAmount />
			</div>
		</div>
	{:else if currentStep === 'details'}
		<div class="flex h-full w-full flex-col px-4 py-4 sm:px-6 sm:py-6" in:fly={{ x: -10, easing: cubicOut }}>
			<!-- Content -->
			<div class="flex-1 space-y-3 sm:space-y-4">
				<!-- Anonymous toggle -->
				<div class="flex items-center space-x-2">
					<Switch id="anonymous" bind:checked={isAnonymous} />
					<Label for="anonymous" class="text-sm">Send anonymously</Label>
				</div>

				{#if !isAnonymous}
					<!-- Sender details -->
					<div class="space-y-3 sm:space-y-4">
						<div class="space-y-2">
							<Label for="sender-name" class="text-sm">Your name</Label>
							<Input
								id="sender-name"
								type="text"
								placeholder="Your full name"
								bind:value={senderName}
								class="text-sm"
							/>
						</div>

						<div class="space-y-2">
							<Label for="sender-email" class="text-sm">Email (optional)</Label>
							<Input
								id="sender-email"
								type="email"
								placeholder="your@email.com"
								bind:value={senderEmail}
								class="text-sm"
							/>
						</div>
					</div>
				{/if}

				<!-- Phone number - always required -->
				<div class="space-y-2">
					<Label for="sender-phone" class="text-sm">Phone Number</Label>
					<Input
						id="sender-phone"
						type="tel"
						placeholder="251912345678"
						bind:value={senderPhone}
						class="font-mono text-sm"
					/>
					<p class="text-xs text-muted-foreground">
						Format: 251XXXXXXXXX (must start with 2519 or 2517)
					</p>
				</div>

				<!-- Note -->
				<div class="space-y-2">
					<Label for="note" class="text-sm">Message (optional)</Label>
					<Textarea
						id="note"
						placeholder="Leave a message for {userName}..."
						bind:value={note}
						rows={3}
						class="text-sm"
					/>
				</div>

				{#if formError}
					<div class="rounded-md bg-destructive/10 p-3 text-xs text-destructive sm:text-sm">
						{formError}
					</div>
				{/if}
			</div>
		</div>
	{:else if currentStep === 'checkout'}
		<div class="flex h-full w-full flex-col px-4 py-4 sm:px-6 sm:py-6" in:fly={{ x: -10, easing: cubicOut }}>
			<!-- Content -->
			<div class="flex-1 space-y-3 sm:space-y-4">
				<!-- Summary -->
				<div class="space-y-3 rounded-lg bg-muted/50 p-3 sm:p-4">
					<div class="flex justify-between">
						<span class="text-sm">Amount:</span>
						<span class="text-sm font-semibold">{tipAmount} ETB</span>
					</div>
					{#if !isAnonymous && senderName}
						<div class="flex justify-between">
							<span class="text-sm">From:</span>
							<span class="text-sm">{senderName}</span>
						</div>
					{:else if isAnonymous}
						<div class="flex justify-between">
							<span class="text-sm">From:</span>
							<span class="text-sm italic">Anonymous</span>
						</div>
					{/if}
					{#if note}
						<div class="flex flex-col gap-1">
							<span class="text-sm">Message:</span>
							<span class="text-xs italic text-muted-foreground sm:text-sm">"{note}"</span>
						</div>
					{/if}
				</div>

				{#if formError}
					<div class="rounded-md bg-destructive/10 p-3 text-xs text-destructive sm:text-sm">
						{formError}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Footer -->
	<div class="rounded-b-3xl border-t border-primary bg-sidebar px-4 py-3 sm:px-6 sm:py-4">
		{#if currentStep === 'amount'}
			<div class="flex gap-2" in:fly={{ y: -4, easing: cubicOut }}>
				<Button
					onclick={goToDetails}
					disabled={!tipAmount && !customAmount}
					class="h-auto w-full rounded-2xl border-b-4 border-l border-r-4 border-t border-primary bg-primary/90 py-3 text-sm text-background sm:py-4 sm:text-base"
				>
					Tip <span class="truncate">{tipAmount} ETB</span>
				</Button>
			</div>
		{:else if currentStep === 'details'}
			<div class="flex gap-2" in:fly={{ y: -4, easing: cubicOut }}>
				<Button
					class="h-auto w-full rounded-2xl 
					border-b-4 border-l border-r-4 border-t border-primary bg-background py-3 text-sm text-primary hover:bg-sidebar sm:py-4 sm:text-base"
					onclick={goBack}
				>
					<ArrowLeft class="mr-2 h-4 w-4" />
					Back
				</Button>
				<Button
					class="h-auto w-full rounded-2xl border-b-4 border-l border-r-4 border-t border-primary bg-primary/90 py-3 text-sm text-background sm:py-4 sm:text-base"
					onclick={goToCheckout}
				>
					Continue
				</Button>
			</div>
		{:else if currentStep === 'checkout'}
			<div class="flex gap-2" in:fly={{ y: -4, easing: cubicOut }}>
				<Button
					class="h-auto w-full rounded-2xl 
				border-b-4 border-l border-r-4 border-t border-primary bg-background py-3 text-sm text-primary hover:bg-sidebar sm:py-4 sm:text-base"
					onclick={goBack}
				>
					<ArrowLeft class="mr-2 h-4 w-4" />
					Back
				</Button>
				<Button
					onclick={handleCheckout}
					class="h-auto w-full rounded-2xl border-b-4 border-l border-r-4 border-t border-primary bg-primary/90 py-3 text-sm text-background sm:py-4 sm:text-base"
					disabled={isSubmitting || !userId}
				>
					<CreditCard class="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
					{isSubmitting ? 'Processing...' : 'Pay Now'}
				</Button>
			</div>
		{/if}
	</div>
</div>
