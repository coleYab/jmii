<script lang="ts">
	import { onMount } from 'svelte';
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Plus, AlertCircle, CreditCard, DollarSign, Phone, Calendar } from 'lucide-svelte';

	import type { IWithdrawalSchema } from '$src/models/Withdrawal.model';

	const session = authClient.useSession();

	// State using Svelte 5 $state
	let withdrawals = $state<Array<IWithdrawalSchema & { id: string , createdAt: string }>>([]);
	let loading = $state(false);
	let showCreateForm = $state(false);
	let error = $state('');
	let success = $state('');

	// Form data for creating withdrawal requests
	let formData = $state({
		amount: 0,
		paymentMethod: '',
		phoneNumber: ''
	});

	// Payment method options
	const paymentMethods = [
		{ value: 'telebirr', label: 'Telebirr' },
		{ value: 'cbe_birr', label: 'CBE Birr' },
		{ value: 'bank_transfer', label: 'Bank Transfer' },
		{ value: 'mobile_money', label: 'Mobile Money' }
	];

	// Status colors for badges
	const statusColors = {
		pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
		approved: 'bg-blue-100 text-blue-800 border-blue-300',
		rejected: 'bg-red-100 text-red-800 border-red-300',
		processing: 'bg-purple-100 text-purple-800 border-purple-300',
		completed: 'bg-green-100 text-green-800 border-green-300'
	};

	// Derived value for payment method display
	const paymentMethodLabel = $derived(
		paymentMethods.find((pm) => pm.value === formData.paymentMethod)?.label ?? "Select payment method"
	);

	onMount(() => {
		if ($session.data?.user) {
			loadWithdrawals();
		}
	});

	async function loadWithdrawals() {
		loading = true;
		error = '';
		try {
			const response = await fetch('/api/withdrawal');
			if (response.ok) {
				const data = await response.json();
				withdrawals = data.withdrawals || [];
			} else {
				if (response.status === 401) {
					error = 'Please log in to view your withdrawals';
				} else {
					error = 'Failed to load withdrawals';
				}
			}
		} catch (e) {
			error = 'Network error while loading withdrawals';
		}
		loading = false;
	}

	async function createWithdrawal() {
		loading = true;
		error = '';
		success = '';

		// Validation
		if (!formData.amount || formData.amount <= 0) {
			error = 'Please enter a valid amount';
			loading = false;
			return;
		}

		if (!formData.paymentMethod) {
			error = 'Please select a payment method';
			loading = false;
			return;
		}

		if (!formData.phoneNumber.trim()) {
			error = 'Please enter a phone number';
			loading = false;
			return;
		}

		try {
			const response = await fetch('/api/withdrawal', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				const result = await response.json();
				success = 'Withdrawal request created successfully! Your request is being reviewed.';
				resetForm();
				showCreateForm = false;
				await loadWithdrawals();
			} else {
				if (response.status === 401) {
					error = 'Please log in to create a withdrawal request';
				} else {
					const errorText = await response.text();
					error = errorText || 'Failed to create withdrawal request';
				}
			}
		} catch (e) {
			error = 'Network error while creating withdrawal request';
		}
		loading = false;
	}

	function resetForm() {
		formData = {
			amount: 0,
			paymentMethod: '',
			phoneNumber: ''
		};
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2
		}).format(amount).replace('$', 'ETB ');
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusDescription(status: string) {
		switch (status) {
			case 'pending':
				return 'Your request is being reviewed by our team';
			case 'approved':
				return 'Your request has been approved and will be processed soon';
			case 'rejected':
				return 'Your request was rejected. Please contact support for details';
			case 'processing':
				return 'Payment is being processed';
			case 'completed':
				return 'Payment has been completed successfully';
			default:
				return '';
		}
	}
</script>

{#if $session.isPending && !$session.data}
	<div class="flex flex-col items-center justify-center py-12">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		<p class="mt-4 text-gray-600">Loading...</p>
	</div>
{:else if !$session.data?.user}
	<div class="flex flex-col items-center justify-center py-12">
		<AlertCircle class="w-12 h-12 text-gray-400 mb-4" />
		<h3 class="text-lg font-semibold text-gray-700 mb-2">Authentication Required</h3>
		<p class="text-gray-600 text-center">Please log in to manage your withdrawal requests.</p>
	</div>
{:else}
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-xl font-bold text-gray-900 sm:text-2xl">Withdrawal Requests</h2>
				<p class="text-gray-600 mt-1 text-sm sm:text-base">Request payouts and track their status</p>
			</div>
			<Button onclick={() => (showCreateForm = true)} disabled={loading} class="w-full sm:w-auto">
				<Plus class="w-4 h-4 mr-2" />
				New Request
			</Button>
		</div>

		<!-- Messages -->
		{#if error}
			<div class="bg-red-50 border border-red-200 rounded-md p-4">
				<div class="flex">
					<AlertCircle class="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
					<p class="text-red-600 text-sm">{error}</p>
				</div>
			</div>
		{/if}

		{#if success}
			<div class="bg-green-50 border border-green-200 rounded-md p-4">
				<div class="flex">
					<div class="w-5 h-5 bg-green-400 rounded-full mr-3 mt-0.5 flex items-center justify-center flex-shrink-0">
						<div class="w-2 h-2 bg-white rounded-full"></div>
					</div>
					<p class="text-green-600 text-sm">{success}</p>
				</div>
			</div>
		{/if}

		<!-- Create Form -->
		{#if showCreateForm}
			<div class="bg-white shadow-sm border border-gray-200 rounded-lg">
				<div class="p-4 border-b border-gray-200 sm:p-6">
					<h3 class="text-lg font-semibold text-gray-900 flex items-center">
						<CreditCard class="w-5 h-5 mr-2" />
						New Withdrawal Request
					</h3>
				</div>
				<div class="p-4 sm:p-6">
					<form class="space-y-4">
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<Label for="amount">Amount (ETB) *</Label>
								<div class="relative">
									<DollarSign class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
									<Input
										id="amount"
										type="number"
										step="0.01"
										min="1"
										bind:value={formData.amount}
										placeholder="Enter amount"
										class="pl-10"
										required
									/>
								</div>
								<p class="text-xs text-gray-500 mt-1">Minimum withdrawal: ETB 1.00</p>
							</div>

							<div>
								<Label for="paymentMethod">Payment Method *</Label>
								<Select.Root type="single" bind:value={formData.paymentMethod}>
									<Select.Trigger class="w-full">
										{paymentMethodLabel}
									</Select.Trigger>
									<Select.Content>
										<Select.Group>
											{#each paymentMethods as method (method.value)}
												<Select.Item
													value={method.value}
													label={method.label}
												>
													{method.label}
												</Select.Item>
											{/each}
										</Select.Group>
									</Select.Content>
								</Select.Root>
							</div>
						</div>

						<div>
							<Label for="phoneNumber">Phone Number *</Label>
							<div class="relative">
								<Phone class="absolute left-3 top-3 h-4 w-4 text-gray-400" />
								<Input
									id="phoneNumber"
									type="tel"
									bind:value={formData.phoneNumber}
									placeholder="e.g., +251912345678"
									class="pl-10"
									required
								/>
							</div>
							<p class="text-xs text-gray-500 mt-1">
								Enter the phone number associated with your payment method
							</p>
						</div>

						<div class="flex flex-col gap-3 pt-4 sm:flex-row sm:space-x-3">
							<Button 
								onclick={createWithdrawal} 
								disabled={loading || !formData.amount || !formData.paymentMethod || !formData.phoneNumber.trim()}
								class="w-full sm:w-auto"
							>
								{loading ? 'Creating...' : 'Create Request'}
							</Button>
							<Button
								variant="outline"
								onclick={() => {
									showCreateForm = false;
									resetForm();
								}}
								disabled={loading}
								class="w-full sm:w-auto"
							>
								Cancel
							</Button>
						</div>
					</form>
				</div>
			</div>
		{/if}

		<!-- Withdrawals List -->
		{#if loading}
			<div class="text-center py-8">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
				<p class="mt-4 text-gray-600">Loading withdrawals...</p>
			</div>
		{:else if withdrawals.length === 0}
			<div class="bg-white shadow-sm border border-gray-200 rounded-lg">
				<div class="text-center py-8 p-4 sm:py-12 sm:p-6">
					<CreditCard class="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h3 class="text-lg font-semibold text-gray-700 mb-2">No Withdrawal Requests</h3>
					<p class="text-gray-600 mb-4 text-sm">You haven't made any withdrawal requests yet.</p>
					<Button onclick={() => (showCreateForm = true)} class="w-full sm:w-auto">
						<Plus class="w-4 h-4 mr-2" />
						Create Your First Request
					</Button>
				</div>
			</div>
		{:else}
			<div class="space-y-4">
				{#each withdrawals as withdrawal}
					<div class="bg-white shadow-sm border border-gray-200 rounded-lg">
						<div class="p-4 sm:p-6">
							<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
								<div class="flex-1 space-y-3">
									<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-3">
										<h3 class="text-lg font-semibold">
											{formatCurrency(withdrawal.amount)}
										</h3>
										<Badge class={statusColors[withdrawal.status]}>
											{withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
										</Badge>
									</div>

									<div class="grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-3">
										<div class="flex items-center">
											<CreditCard class="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
											<span class="text-xs sm:text-sm"><strong>Method:</strong> {withdrawal.paymentMethod}</span>
										</div>
										<div class="flex items-center">
											<Phone class="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
											<span class="text-xs sm:text-sm"><strong>Phone:</strong> {withdrawal.phoneNumber}</span>
										</div>
										<div class="flex items-center">
											<Calendar class="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
											<span class="text-xs sm:text-sm"><strong>Created:</strong> {formatDate(withdrawal.createdAt)}</span>
										</div>
									</div>

									<div class="text-sm text-gray-600">
										<strong class="text-xs sm:text-sm">Reference:</strong> <span class="text-xs sm:text-sm">{withdrawal.trxRef}</span>
									</div>

									{#if withdrawal.adminNotes}
										<div class="bg-gray-50 p-3 rounded-md">
											<p class="text-sm text-gray-700">
												<strong>Note:</strong> {withdrawal.adminNotes}
											</p>
										</div>
									{/if}

									<div class="text-xs text-gray-500">
										{getStatusDescription(withdrawal.status)}
									</div>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}