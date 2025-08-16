<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { onMount, onDestroy } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import type {
		TimeSeriesMetric,
		TimeSeriesDataPoint
	} from '$lib/components/charts/TimeSeriesChart.svelte';

	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Separator } from '$lib/components/ui/separator';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { MediaQuery } from 'svelte/reactivity';

	import Tips from './tabs/Tips.svelte';
	import Withdrawals from './tabs/Withdrawals.svelte';
	import Goals from './tabs/Goals.svelte';
	import { HandCoins, HandWithdraw, Target } from 'phosphor-svelte';
	import type { ITipSchema } from '$src/models/Tip.model';
	import type { Profile, Kyc, KycDocumentType, KycStatusType } from '$lib/types/profile';
	import FileUpload from '$lib/components/common/FileUpload.svelte';

	const session = authClient.useSession();

	// Real data state
	let tips = $state<ITipSchema[]>([]);
	let loading = $state(true);
	let refreshing = $state(false);
	let error = $state<string | null>(null);
	let refreshInterval: NodeJS.Timeout | null = null;
	let countdownInterval: NodeJS.Timeout | null = null;
	let nextRefreshIn = $state(15);
	let initialDataLoaded = $state(false);

	// Profile data for withdrawal address
	let profile = $state<Profile | null>(null);
	let profileLoading = $state(false);

	// KYC data and state
	let kyc = $state<Kyc | null>(null);
	let kycLoading = $state(false);
	let kycError = $state<string | null>(null);

	// KYC submission/editing state
	let showKycSubmission = $state(false);
	let kycDocumentType = $state<KycDocumentType>('national_id');
	let kycDocumentUrl = $state('');
	let submittingKyc = $state(false);
	let uploadingKycDocument = $state(false);
	let kycSubmissionError = $state<string | null>(null);
	let kycSubmissionSuccess = $state(false);

	// Withdrawal address editing state
	let showAddressEdit = $state(false);
	let addressValue = $state('');
	let addressType = $state('');
	let savingAddress = $state(false);
	let addressError = $state<string | null>(null);
	let addressSaved = $state(false);

	// Media query for responsive design
	const isDesktop = new MediaQuery('(min-width: 768px)');

	// Calculate balance from tips
	let balance = $derived(tips.reduce((total, tip) => total + tip.amount, 0));

	let verifiedBalance = $derived(
		tips.reduce((total, tip) => {
			return tip.verified ? total + tip.amount : total;
		}, 0)
	);

	// Tweened stores for smooth balance animations
	const tweenedBalance = new Tween(0, {
		duration: 1500,
		easing: cubicOut
	});

	const tweenedVerifiedBalance = new Tween(0, {
		duration: 1500,
		easing: cubicOut
	});

	// Update tweened values when derived values change
	$effect(() => {
		tweenedBalance.target = balance;
	});

	$effect(() => {
		tweenedVerifiedBalance.target = verifiedBalance;
	});

	// Format balance to K/M format
	function formatBalance(amount: number): string {
		if (amount >= 1000000) {
			return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
		} else if (amount >= 1000) {
			return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
		}
		return amount.toString();
	}

	// Fetch user profile data
	async function fetchProfile() {
		profileLoading = true;
		try {
			const response = await fetch('/api/user/profile');
			if (response.ok) {
				const data = await response.json();
				profile = data.profile;

				// Update form fields with profile data
				if (profile?.withdrawalAddress) {
					addressValue = profile.withdrawalAddress.value || '';
					addressType = profile.withdrawalAddress.type || '';
				}
			} else {
				console.error('Failed to fetch profile');
			}
		} catch (error) {
			console.error('Error fetching profile:', error);
		} finally {
			profileLoading = false;
		}
	}

	// Fetch KYC data
	async function fetchKyc() {
		kycLoading = true;
		kycError = null;
		try {
			const response = await fetch('/api/kyc');
			if (response.ok) {
				const data = await response.json();
				kyc = data.kyc;
				console.log('✅ Loaded KYC data:', kyc);
			} else if (response.status === 401) {
				kycError = 'Please log in to view KYC status.';
			} else {
				const errorData = await response.json();
				kycError = errorData.error || 'Failed to load KYC data';
			}
		} catch (error) {
			console.error('Error fetching KYC:', error);
			kycError = 'Failed to load KYC data. Please try again.';
		} finally {
			kycLoading = false;
		}
	}

	// Submit new KYC document
	async function submitKyc() {
		if (!validateKycForm()) {
			return;
		}

		submittingKyc = true;
		kycSubmissionError = null;

		try {
			const submitData = {
				documentType: kycDocumentType,
				documentUrl: kycDocumentUrl.trim()
			};

			const response = await fetch('/api/kyc', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(submitData)
			});

			if (response.ok) {
				const data = await response.json();
				kyc = data.kyc;
				kycSubmissionSuccess = true;
				showKycSubmission = false;

				// Reset form
				kycDocumentType = 'national_id';
				kycDocumentUrl = '';

				// Show success feedback
				setTimeout(() => {
					kycSubmissionSuccess = false;
				}, 5000);
			} else {
				const errorData = await response.json();
				kycSubmissionError = errorData.error || 'Failed to submit KYC document';
			}
		} catch (error) {
			console.error('Error submitting KYC:', error);
			kycSubmissionError = 'Failed to submit KYC document. Please try again.';
		} finally {
			submittingKyc = false;
		}
	}

	// Update existing KYC document (resubmit)
	async function updateKyc() {
		if (!validateKycForm()) {
			return;
		}

		submittingKyc = true;
		kycSubmissionError = null;

		try {
			const updateData = {
				documentType: kycDocumentType,
				documentUrl: kycDocumentUrl.trim()
			};

			const response = await fetch('/api/kyc', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updateData)
			});

			if (response.ok) {
				const data = await response.json();
				kyc = data.kyc;
				kycSubmissionSuccess = true;
				showKycSubmission = false;

				// Reset form
				kycDocumentType = 'national_id';
				kycDocumentUrl = '';

				// Show success feedback
				setTimeout(() => {
					kycSubmissionSuccess = false;
				}, 5000);
			} else {
				const errorData = await response.json();
				kycSubmissionError = errorData.error || 'Failed to update KYC document';
			}
		} catch (error) {
			console.error('Error updating KYC:', error);
			kycSubmissionError = 'Failed to update KYC document. Please try again.';
		} finally {
			submittingKyc = false;
		}
	}

	function validateKycForm() {
		kycSubmissionError = null;

		if (!kycDocumentUrl?.trim()) {
			kycSubmissionError = 'Please upload a document image.';
			return false;
		}

		return true;
	}

	function openKycSubmission() {
		// Reset form
		if (kyc) {
			kycDocumentType = kyc.documentType;
			kycDocumentUrl = kyc.documentUrl || '';
		} else {
			kycDocumentType = 'national_id';
			kycDocumentUrl = '';
		}
		kycSubmissionError = null;
		showKycSubmission = true;
	}

	function handleKycDocumentUpload(url: string) {
		kycDocumentUrl = url;
		kycSubmissionError = null; // Clear any previous errors
	}

	function getKycStatusColor(status: KycStatusType) {
		switch (status) {
			case 'approved':
				return 'border-green-500 bg-green-50 text-green-700';
			case 'rejected':
				return 'border-red-500 bg-red-50 text-red-700';
			case 'under_review':
				return 'border-yellow-500 bg-yellow-50 text-yellow-700';
			case 'pending':
			default:
				return 'border-blue-500 bg-blue-50 text-blue-700';
		}
	}

	function getKycStatusText(status: KycStatusType) {
		switch (status) {
			case 'approved':
				return 'KYC Verified';
			case 'rejected':
				return 'KYC Rejected';
			case 'under_review':
				return 'Under Review';
			case 'pending':
			default:
				return 'KYC Pending';
		}
	}

	// Update withdrawal address
	async function updateWithdrawalAddress() {
		if (!validateAddressForm()) {
			return;
		}

		savingAddress = true;
		addressError = null;

		try {
			const updateData = {
				withdrawalAddress: {
					value: addressValue.trim(),
					type: addressType.trim()
				}
			};

			const response = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updateData)
			});

			if (response.ok) {
				const data = await response.json();
				profile = data.profile;
				addressSaved = true;
				showAddressEdit = false;

				// Show success feedback
				setTimeout(() => {
					addressSaved = false;
				}, 3000);
			} else {
				const errorData = await response.json();
				addressError = errorData.error || 'Failed to update withdrawal address';
			}
		} catch (error) {
			console.error('Error updating withdrawal address:', error);
			addressError = 'Failed to update withdrawal address. Please try again.';
		} finally {
			savingAddress = false;
		}
	}

	function validateAddressForm() {
		addressError = null;

		if (!addressValue?.trim()) {
			addressError = 'Address value cannot be empty.';
			return false;
		}
		if (!addressType?.trim()) {
			addressError = 'Address type cannot be empty.';
			return false;
		}

		return true;
	}

	function openAddressEdit() {
		// Reset form with current values
		if (profile?.withdrawalAddress) {
			addressValue = profile.withdrawalAddress.value || '';
			addressType = profile.withdrawalAddress.type || '';
		} else {
			addressValue = '';
			addressType = '';
		}
		addressError = null;
		showAddressEdit = true;
	}

	interface Tab {
		id: string;
		label: string;
		description: string;
		icon: any;
	}

	const tabs: Tab[] = [
		{
			id: 'tips',
			label: 'Tips',
			description: 'Manage Tips',
			icon: HandCoins
		},
		{
			id: 'withdrawals',
			label: 'Withdrawals',
			description: 'Get paid !',
			icon: HandWithdraw
		},
		{
			id: 'goals',
			label: 'Goals',
			description: 'Set milestones',
			icon: Target
		}
	];

	let activeTab = $state(tabs[0].id);

	async function loadTips(isRefresh = false) {
		if (isRefresh) {
			refreshing = true;
		} else {
			loading = true;
		}
		error = null;

		try {
			const response = await fetch('/api/tip');
			if (response.ok) {
				const data = await response.json();
				tips = data.tips || [];
				console.log('✅ Loaded', tips.length, 'tips from database');
				console.log('Raw tips data:', tips);
			} else if (response.status === 401) {
				error = 'Please log in to view your tips.';
			} else {
				throw new Error('Failed to load tips');
			}
		} catch (e) {
			console.error('❌ Error loading tips:', e);
			error = 'Failed to load tips. Please try again.';
		} finally {
			loading = false;
			refreshing = false;
		}
	}

	function startRefreshTimer() {
		// Clear any existing intervals
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
		if (countdownInterval) {
			clearInterval(countdownInterval);
		}

		// Reset countdown
		nextRefreshIn = 15;

		// Set up countdown timer (updates every second)
		countdownInterval = setInterval(() => {
			nextRefreshIn--;
			if (nextRefreshIn <= 0) {
				nextRefreshIn = 15;
			}
		}, 1000);

		// Set up 15-second refresh interval
		refreshInterval = setInterval(() => {
			if ($session.data?.user?.id) {
				loadTips(true);
				nextRefreshIn = 15; // Reset countdown when refresh happens
			}
		}, 15000);
	}

	onMount(() => {
		console.log('Session:', $session);

		// Load tips and profile immediately if user is authenticated
		if ($session.data?.user?.id) {
			loadTips(); // Initial load - no delay
			fetchProfile(); // Load profile data
			fetchKyc(); // Load KYC data
			startRefreshTimer(); // Start the refresh timer after initial load
			initialDataLoaded = true;
		}

		// Cleanup function
		return () => {
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
			if (countdownInterval) {
				clearInterval(countdownInterval);
			}
		};
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
		if (countdownInterval) {
			clearInterval(countdownInterval);
		}
	});

	// React to session changes - load tips immediately when user logs in
	$effect(() => {
		if ($session.data?.user?.id && !initialDataLoaded) {
			console.log('User logged in, loading tips, profile, and KYC immediately');
			loadTips();
			fetchProfile();
			fetchKyc();
			startRefreshTimer();
			initialDataLoaded = true;
		}
	});
</script>

<header
	class="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
>
	<div class="flex items-center gap-2 px-4">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mr-2 h-4" />
	</div>
</header>

<section class="flex w-full flex-col items-start justify-center px-4 md:px-12">
	<!-- Balance and withdrawal info section -->
	<section class="flex w-full flex-col gap-4">
		<div class="flex flex-col gap-4 md:flex-row md:justify-between">
			<div class="flex w-full flex-col items-center justify-center overflow-clip p-2 md:w-56">
				<div
					class="flex w-full flex-col items-center justify-center gap-2 rounded-t-2xl bg-primary p-2"
				>
					<h2 class="whitespace-nowrap p-2 text-center text-primary-foreground text-lg md:text-2xl">
						{formatBalance(Math.round(tweenedBalance.current))} <span class="text-xs">ETB</span>
					</h2>

					<small class="text-center text-primary-foreground text-xs md:text-sm">Your Balance with jami </small>
				</div>
				<h2
					class="w-full rounded-b-2xl bg-primary/80 p-2 text-center text-xs text-primary-foreground md:text-sm"
				>
					{formatBalance(Math.round(tweenedVerifiedBalance.current))}
					<span class="text-xs">ETB</span>
					Available
				</h2>
			</div>

			<div class="flex w-full flex-col items-center justify-center gap-4 overflow-clip rounded-2xl p-2 md:w-auto">
				<div
					class="flex flex-col items-center justify-center gap-2 overflow-clip rounded-2xl pt-4 md:pt-6"
				>
					<div class="relative w-full">
						<h2
							class="rounded-2xl rounded-tl-none border border-primary p-2 text-center text-lg text-primary md:text-2xl"
						>
							{profileLoading
								? 'Loading...'
								: profile?.withdrawalAddress?.value || 'No address set'}
						</h2>
						<div class="absolute -top-3 flex w-full flex-col gap-2 md:-top-4 md:flex-row">
							<small
								class="rounded-md border border-primary bg-primary px-2 py-1 text-center text-xs text-primary-foreground md:text-sm"
								>{profileLoading
									? 'Loading...'
									: profile?.withdrawalAddress?.type || 'Not set'}</small
							>
							<small
								class="rounded-md border px-2 py-1 text-center text-xs md:text-sm {kycLoading
									? 'border-gray-300 bg-gray-50 text-gray-500'
									: kyc?.status === 'approved'
										? 'border-emerald-500 bg-emerald-50 text-emerald-700'
										: 'border-yellow-500 bg-yellow-50 text-yellow-700'}"
							>
								{kycLoading
									? 'Loading...'
									: kyc
										? getKycStatusText(kyc.status)
										: 'KYC Not Submitted'}
							</small>
						</div>
					</div>
					<small class="text-center text-xs md:text-sm"> Your withdrawal address </small>
				</div>
				<div class="flex w-full flex-col gap-2 md:flex-row">
					<Button onclick={openAddressEdit} class="w-full md:w-auto">Edit Address</Button>
					<Button onclick={openKycSubmission} class="w-full md:w-auto">{kyc ? 'Update KYC' : 'Submit KYC'}</Button>
				</div>
			</div>
		</div>

		{#if addressSaved}
			<div class="rounded-lg border border-green-200 bg-green-50 p-2 text-center">
				<p class="text-sm text-green-600">Withdrawal address updated successfully!</p>
			</div>
		{/if}

		{#if kycSubmissionSuccess}
			<div class="rounded-lg border border-green-200 bg-green-50 p-2 text-center">
				<p class="text-sm text-green-600">
					KYC document {kyc ? 'updated' : 'submitted'} successfully!
				</p>
			</div>
		{/if}

		{#if kycError}
			<div class="rounded-lg border border-red-200 bg-red-50 p-2 text-center">
				<p class="text-sm text-red-600">{kycError}</p>
				<Button onclick={() => fetchKyc()} class="mt-2" size="sm">Retry</Button>
			</div>
		{/if}
	</section>

	<!-- Withdrawal Address Edit Modal - responsive drawer/dialog -->
	{#if isDesktop.current}
		<Dialog.Root bind:open={showAddressEdit}>
			<Dialog.Trigger />
			<Dialog.Content class="sm:max-w-[425px]">
				<Dialog.Header>
					<Dialog.Title>Edit Withdrawal Address</Dialog.Title>
					<Dialog.Description>
						Update your withdrawal address information for receiving payments.
					</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4">
					<div class="grid gap-2">
						<Label for="addressType">Address Type</Label>
						<Input
							id="addressType"
							bind:value={addressType}
							placeholder="e.g., Telebirr, Bank Account, Crypto"
							class={addressError ? 'border-destructive' : ''}
						/>
					</div>
					<div class="grid gap-2">
						<Label for="addressValue">Address Value</Label>
						<Input
							id="addressValue"
							bind:value={addressValue}
							placeholder="e.g., phone number, account number, wallet address"
							class={addressError ? 'border-destructive' : ''}
						/>
					</div>
					{#if addressError}
						<p class="text-sm text-destructive">{addressError}</p>
					{/if}
					<div class="flex justify-end gap-2">
						<Button variant="outline" onclick={() => (showAddressEdit = false)}>Cancel</Button>
						<Button onclick={updateWithdrawalAddress} disabled={savingAddress}>
							{savingAddress ? 'Saving...' : 'Save Address'}
						</Button>
					</div>
				</div>
			</Dialog.Content>
		</Dialog.Root>
	{:else}
		<Drawer.Root bind:open={showAddressEdit}>
			<Drawer.Trigger />
			<Drawer.Content>
				<Drawer.Header class="text-left">
					<Drawer.Title>Edit Withdrawal Address</Drawer.Title>
					<Drawer.Description>
						Update your withdrawal address information for receiving payments.
					</Drawer.Description>
				</Drawer.Header>
				<div class="grid gap-4 px-4">
					<div class="grid gap-2">
						<Label for="addressType">Address Type</Label>
						<Input
							id="addressType"
							bind:value={addressType}
							placeholder="e.g., Telebirr, Bank Account, Crypto"
							class={addressError ? 'border-destructive' : ''}
						/>
					</div>
					<div class="grid gap-2">
						<Label for="addressValue">Address Value</Label>
						<Input
							id="addressValue"
							bind:value={addressValue}
							placeholder="e.g., phone number, account number, wallet address"
							class={addressError ? 'border-destructive' : ''}
						/>
					</div>
					{#if addressError}
						<p class="text-sm text-destructive">{addressError}</p>
					{/if}
				</div>
				<Drawer.Footer class="pt-2">
					<Button onclick={updateWithdrawalAddress} disabled={savingAddress}>
						{savingAddress ? 'Saving...' : 'Save Address'}
					</Button>
					<Drawer.Close>
						<Button variant="outline" class="w-full">Cancel</Button>
					</Drawer.Close>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer.Root>
	{/if}

	<!-- KYC Submission Modal - responsive drawer/dialog -->
	{#if isDesktop.current}
		<Dialog.Root bind:open={showKycSubmission}>
			<Dialog.Trigger />
			<Dialog.Content class="sm:max-w-[425px]">
				<Dialog.Header>
					<Dialog.Title>{kyc ? 'Update KYC Document' : 'Submit KYC Document'}</Dialog.Title>
					<Dialog.Description>
						{kyc
							? 'Update your KYC document for identity verification.'
							: 'Submit your identity document for KYC verification to enable withdrawals.'}
						{kyc?.status === 'rejected' && kyc.adminNotes
							? `Previous submission was rejected: ${kyc.adminNotes}`
							: ''}
					</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4">
					<div class="grid gap-2">
						<Label for="kycDocumentType">Document Type</Label>
						<select
							id="kycDocumentType"
							bind:value={kycDocumentType}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="national_id">National ID</option>
							<option value="passport">Passport</option>
							<option value="drivers_license">Driver's License</option>
						</select>
					</div>
					<div class="grid gap-2">
						<Label for="kycDocumentUrl">Document Image</Label>
						<FileUpload
							accept="image/*"
							disabled={uploadingKycDocument || submittingKyc}
							on:start={() => (uploadingKycDocument = true)}
							on:success={({ detail }) => {
								uploadingKycDocument = false;
								handleKycDocumentUpload(detail.url);
							}}
							on:error={({ detail }) => {
								uploadingKycDocument = false;
								kycSubmissionError = `Upload failed: ${detail.error}`;
							}}
						/>
						{#if uploadingKycDocument}
							<div class="flex items-center justify-center py-2">
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
								></div>
								<span class="ml-2 text-sm">Uploading document...</span>
							</div>
						{/if}
						{#if kycDocumentUrl}
							<div class="mt-2 rounded-md border border-green-200 bg-green-50 p-2">
								<p class="text-sm text-green-700">✓ Document uploaded successfully</p>
							</div>
						{/if}
						<small class="text-muted-foreground">
							Upload a clear image of your identity document (JPG, PNG, etc.)
						</small>
					</div>
					{#if kyc?.status}
						<div class="rounded-lg border p-3 {getKycStatusColor(kyc.status)}">
							<p class="text-sm font-medium">Current Status: {getKycStatusText(kyc.status)}</p>
							{#if kyc.adminNotes}
								<p class="mt-1 text-xs">Admin Notes: {kyc.adminNotes}</p>
							{/if}
						</div>
					{/if}
					{#if kycSubmissionError}
						<p class="text-sm text-destructive">{kycSubmissionError}</p>
					{/if}
					<div class="flex justify-end gap-2">
						<Button variant="outline" onclick={() => (showKycSubmission = false)}>Cancel</Button>
						<Button
							onclick={kyc ? updateKyc : submitKyc}
							disabled={submittingKyc || uploadingKycDocument}
						>
							{submittingKyc
								? 'Submitting...'
								: uploadingKycDocument
									? 'Uploading...'
									: kyc
										? 'Update Document'
										: 'Submit Document'}
						</Button>
					</div>
				</div>
			</Dialog.Content>
		</Dialog.Root>
	{:else}
		<Drawer.Root bind:open={showKycSubmission}>
			<Drawer.Trigger />
			<Drawer.Content>
				<Drawer.Header class="text-left">
					<Drawer.Title>{kyc ? 'Update KYC Document' : 'Submit KYC Document'}</Drawer.Title>
					<Drawer.Description>
						{kyc
							? 'Update your KYC document for identity verification.'
							: 'Submit your identity document for KYC verification to enable withdrawals.'}
						{kyc?.status === 'rejected' && kyc.adminNotes
							? `Previous submission was rejected: ${kyc.adminNotes}`
							: ''}
					</Drawer.Description>
				</Drawer.Header>
				<div class="grid gap-4 px-4">
					<div class="grid gap-2">
						<Label for="kycDocumentTypeMobile">Document Type</Label>
						<select
							id="kycDocumentTypeMobile"
							bind:value={kycDocumentType}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="national_id">National ID</option>
							<option value="passport">Passport</option>
							<option value="drivers_license">Driver's License</option>
						</select>
					</div>
					<div class="grid gap-2">
						<Label for="kycDocumentUrlMobile">Document Image</Label>
						<FileUpload
							accept="image/*"
							disabled={uploadingKycDocument || submittingKyc}
							on:start={() => (uploadingKycDocument = true)}
							on:success={({ detail }) => {
								uploadingKycDocument = false;
								handleKycDocumentUpload(detail.url);
							}}
							on:error={({ detail }) => {
								uploadingKycDocument = false;
								kycSubmissionError = `Upload failed: ${detail.error}`;
							}}
						/>
						{#if uploadingKycDocument}
							<div class="flex items-center justify-center py-2">
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
								></div>
								<span class="ml-2 text-sm">Uploading document...</span>
							</div>
						{/if}
						{#if kycDocumentUrl}
							<div class="mt-2 rounded-md border border-green-200 bg-green-50 p-2">
								<p class="text-sm text-green-700">✓ Document uploaded successfully</p>
							</div>
						{/if}
						<small class="text-muted-foreground">
							Upload a clear image of your identity document (JPG, PNG, etc.)
						</small>
					</div>
					{#if kyc?.status}
						<div class="rounded-lg border p-3 {getKycStatusColor(kyc.status)}">
							<p class="text-sm font-medium">Current Status: {getKycStatusText(kyc.status)}</p>
							{#if kyc.adminNotes}
								<p class="mt-1 text-xs">Admin Notes: {kyc.adminNotes}</p>
							{/if}
						</div>
					{/if}
					{#if kycSubmissionError}
						<p class="text-sm text-destructive">{kycSubmissionError}</p>
					{/if}
				</div>
				<Drawer.Footer class="pt-2">
					<Button
						onclick={kyc ? updateKyc : submitKyc}
						disabled={submittingKyc || uploadingKycDocument}
					>
						{submittingKyc
							? 'Submitting...'
							: uploadingKycDocument
								? 'Uploading...'
								: kyc
									? 'Update Document'
									: 'Submit Document'}
					</Button>
					<Drawer.Close>
						<Button variant="outline" class="w-full">Cancel</Button>
					</Drawer.Close>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer.Root>
	{/if}

	{#if $session.isPending}
		<div class="container flex w-full max-w-5xl flex-col gap-6 p-4">
			<div class="flex items-center justify-center py-8">
				<Skeleton class="h-8 w-32" />
			</div>
		</div>
	{:else if !$session.data?.user}
		<div class="container flex w-full max-w-5xl flex-col gap-6 p-4">
			<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
				<p class="text-yellow-800">Please log in to view your tips.</p>
			</div>
		</div>
	{:else}
		<section class="flex w-full flex-col gap-6 p-2 md:p-4">
			<div class="mb-2 w-full">
				<nav class="flex w-full flex-col space-y-2 rounded-lg border border-primary/10 bg-muted p-1 md:flex-row md:w-fit md:space-x-1 md:space-y-0">
					{#each tabs as tab}
						<button
							class="flex w-full flex-row items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors md:w-36 {activeTab ===
							tab.id
								? 'border border-primary bg-background text-foreground shadow-sm'
								: 'border border-transparent text-muted-foreground hover:text-foreground'}"
							onclick={() => (activeTab = tab.id)}
						>
							<tab.icon size="20" weight="duotone" class="md:hidden" />
							<tab.icon size="24" weight="duotone" class="hidden md:block" />
							<div class="text-center">
								<div class="text-sm md:text-base">{tab.label}</div>
								<div class="whitespace-nowrap text-xs opacity-70">{tab.description}</div>
							</div>
						</button>
					{/each}
				</nav>
			</div>

			{#if error}
				<div class="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
					<p class="text-red-600">{error}</p>
					<Button onclick={() => loadTips()} class="mt-2">Retry</Button>
				</div>
			{:else if activeTab === 'tips'}
				<div>
					<Tips {tips} {refreshing} {nextRefreshIn} />
				</div>
			{:else if activeTab === 'withdrawals'}
				<Withdrawals />
			{:else if activeTab === 'goals'}
				<Goals />
			{/if}
		</section>
	{/if}
</section>
