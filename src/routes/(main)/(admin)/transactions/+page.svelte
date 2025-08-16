<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Trash2 } from 'lucide-svelte';

	import { toast } from 'svelte-sonner';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	const session = authClient.useSession();

	// State using Svelte 5 $state
	let tips = $state<any[]>([]);
	let loading = $state(false);
	let showCreateForm = $state(false);
	let editingTip = $state<any>(null);
	let showCheckoutModal = $state(false);
	let checkoutTip = $state<any>(null);
	let phoneNumber = $state('');

	// Form data for creating/editing tips using $state
	let formData = $state({
		senderFullName: '',
		senderEmail: '',
		senderPhone: '',
		note: '',
		amount: 0,
		currency: 'ETB',
		type: 'Default',
		anonymous: false,
		verified: false,
		goalId: undefined as number | undefined
	});

	// Currency and type options
	const currencies = [
		{ value: 'ETB', label: 'Ethiopian Birr (ETB)' },
		{ value: 'USD', label: 'US Dollar (USD)' },
		{ value: 'EUR', label: 'Euro (EUR)' }
	];

	const tipTypes = [
		{ value: 'Default', label: 'Default' },
		{ value: 'Goal', label: 'Goal' },
		{ value: 'Anonymous', label: 'Anonymous' }
	];

	// Derived values for select displays
	const currencyLabel = $derived(
		currencies.find((c) => c.value === formData.currency)?.label ?? 'Select currency'
	);

	const typeLabel = $derived(
		tipTypes.find((t) => t.value === formData.type)?.label ?? 'Select type'
	);

	onMount(() => {
		loadTips();
	});

	async function loadTips() {
		loading = true;
		try {
			const response = await fetch('/api/tip');
			if (response.ok) {
				const data = await response.json();
				tips = data.tips || [];
			} else {
				toast.error('Failed to load tips');
			}
		} catch (e) {
			toast.error('Network error while loading tips');
		}
		loading = false;
	}

	async function createTip() {
		loading = true;
		try {
			const response = await fetch('/api/tip', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				toast.success('Tip created successfully');
				resetForm();
				showCreateForm = false;
				await loadTips();
			} else {
				const errorText = await response.text();
				toast.error(errorText || 'Failed to create tip');
			}
		} catch (e) {
			toast.error('Network error while creating tip');
		}
		loading = false;
	}

	async function updateTip(tipId: string) {
		loading = true;
		try {
			const response = await fetch('/api/tip', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tipId, ...formData })
			});

			if (response.ok) {
				toast.success('Tip updated successfully');
				editingTip = null;
				resetForm();
				await loadTips();
			} else {
				const errorText = await response.text();
				toast.error(errorText || 'Failed to update tip');
			}
		} catch (e) {
			toast.error('Network error while updating tip');
		}
		loading = false;
	}

	async function deleteTip(tipId: string) {
		if (!confirm('Are you sure you want to delete this tip?')) return;

		loading = true;
		try {
			const response = await fetch('/api/tip', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tipId })
			});

			if (response.ok) {
				toast.success('Tip deleted successfully');
				await loadTips();
			} else {
				const errorText = await response.text();
				toast.error(errorText || 'Failed to delete tip');
			}
		} catch (e) {
			toast.error('Network error while deleting tip');
		}
		loading = false;
	}

	async function quickVerifyTip(tipId: string) {
		loading = true;
		try {
			const response = await fetch('/api/tip', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tipId, verified: true })
			});

			if (response.ok) {
				toast.success('Tip verified successfully');
				await loadTips();
			} else {
				const errorText = await response.text();
				toast.error(errorText || 'Failed to verify tip');
			}
		} catch (e) {
			toast.error('Network error while verifying tip');
		}
		loading = false;
	}

	async function checkoutTipPayment() {
		if (!phoneNumber.trim()) {
			toast.error('Phone number is required for checkout');
			return;
		}

		loading = true;
		try {
			const response = await fetch('/api/arifpay/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phone: phoneNumber,
					tipId: checkoutTip.id,
					amount: checkoutTip.amount,
					currency: checkoutTip.currency
				})
			});

			if (response.ok) {
				const result = await response.json();

				// Check if we have the payment URL in the response data
				if (result.data && result.data.paymentUrl) {
					toast.success('Redirecting to payment...');
					// Close modal before redirect
					showCheckoutModal = false;
					// Redirect to the payment URL
					window.location.href = result.data.paymentUrl;
					return;
				} else {
					toast.error('Payment URL not found in response');
				}
			} else {
				const errorResponse = await response.json();
				toast.error(errorResponse.message || 'Failed to create checkout session');
			}
		} catch (e) {
			toast.error('Network error during checkout');
			console.error('Checkout error:', e);
		}
		loading = false;
	}

	function startCheckout(tip: any) {
		checkoutTip = tip;
		showCheckoutModal = true;
		phoneNumber = '';
	}

	function cancelCheckout() {
		showCheckoutModal = false;
		checkoutTip = null;
		phoneNumber = '';
	}

	function startEdit(tip: any) {
		editingTip = tip;
		formData = {
			senderFullName: tip.senderFullName || '',
			senderEmail: tip.senderEmail || '',
			senderPhone: tip.senderPhone || '',
			note: tip.note || '',
			amount: tip.amount || 0,
			currency: tip.currency || 'ETB',
			type: tip.type || 'Default',
			anonymous: tip.anonymous || false,
			verified: tip.verified || false,
			goalId: tip.goalId
		};
	}

	function resetForm() {
		formData = {
			senderFullName: '',
			senderEmail: '',
			senderPhone: '',
			note: '',
			amount: 0,
			currency: 'ETB',
			type: 'Default',
			anonymous: false,
			verified: false,
			goalId: undefined
		};
	}

	function cancelEdit() {
		editingTip = null;
		resetForm();
	}

	function formatCurrency(amount: number, currency: string) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency === 'ETB' ? 'USD' : currency,
			minimumFractionDigits: 2
		})
			.format(amount)
			.replace('$', currency === 'ETB' ? 'ETB ' : '$');
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
</script>

<header
	class="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
>
	<div class="flex items-center gap-2 px-4">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mr-2 h-4" />
	</div>
	<h2 class="text-lg">Admin | Transactions</h2>
</header>

{#if $session.isPending && !$session.data}
	<div class="flex flex-col items-center justify-center">
		<p>Loading...</p>
	</div>
{:else if $session.data}
	<div class="container mx-auto max-w-6xl p-6">
		<!-- Tips List -->
		{#if loading}
			<div class="grid gap-4">
				{#each Array(3) as _, i}
					<Card>
						<CardContent class="p-6">
							<div class="flex items-start justify-between">
								<div class="flex-1 space-y-4">
									<!-- Header with Amount and Status Skeleton -->
									<div class="flex items-center space-x-3">
										<Skeleton class="h-7 w-24" />
										<Skeleton class="h-6 w-16" />
										<Skeleton class="h-6 w-12" />
									</div>

									<!-- Transaction Details Skeleton -->
									<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
										<!-- Left Column -->
										<div class="space-y-2">
											<div class="rounded-md bg-gray-50 p-3">
												<Skeleton class="mb-2 h-5 w-32" />
												<div class="space-y-2">
													<Skeleton class="h-4 w-full" />
													<Skeleton class="h-4 w-3/4" />
													<Skeleton class="h-4 w-1/2" />
													<Skeleton class="h-4 w-5/6" />
													<Skeleton class="h-4 w-2/3" />
												</div>
											</div>
										</div>

										<!-- Right Column -->
										<div class="space-y-2">
											<div class="rounded-md bg-blue-50 p-3">
												<Skeleton class="mb-2 h-5 w-28" />
												<div class="space-y-2">
													<Skeleton class="h-4 w-full" />
													<Skeleton class="h-4 w-4/5" />
													<Skeleton class="h-4 w-3/5" />
												</div>
											</div>
										</div>
									</div>

									<!-- Note Section Skeleton -->
									<div class="rounded-md bg-yellow-50 p-3">
										<Skeleton class="mb-2 h-5 w-20" />
										<Skeleton class="h-4 w-full" />
										<Skeleton class="h-4 w-3/4" />
									</div>
								</div>

								<div class="ml-4 flex space-x-2">
									<Skeleton class="h-8 w-20" />
									<Skeleton class="h-8 w-8" />
									<Skeleton class="h-8 w-8" />
								</div>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>
		{:else if tips.length === 0}
			<Card>
				<CardContent class="py-8 text-center">
					<p class="text-gray-500">No tips found</p>
				</CardContent>
			</Card>
		{:else}
			<div class="grid gap-4">
				{#each tips as tip}
					<Card>
						<CardContent class="p-6">
							{#if editingTip?.id === tip.id}
								<!-- Edit Form -->
								<form class="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div>
										<Label for="edit-senderFullName">Sender Full Name</Label>
										<Input id="edit-senderFullName" bind:value={formData.senderFullName} />
									</div>

									<div>
										<Label for="edit-senderEmail">Sender Email</Label>
										<Input id="edit-senderEmail" type="email" bind:value={formData.senderEmail} />
									</div>

									<div>
										<Label for="edit-senderPhone">Sender Phone</Label>
										<Input id="edit-senderPhone" bind:value={formData.senderPhone} />
									</div>

									<div>
										<Label for="edit-amount">Amount</Label>
										<Input
											id="edit-amount"
											type="number"
											step="0.01"
											bind:value={formData.amount}
											disabled={tip.verified && $session.data?.user?.role !== 'admin'}
										/>
									</div>

									<div>
										<Label for="edit-currency">Currency</Label>
										<Select.Root
											type="single"
											bind:value={formData.currency}
											disabled={tip.verified && $session.data?.user?.role !== 'admin'}
										>
											<Select.Trigger class="w-full">
												{currencyLabel}
											</Select.Trigger>
											<Select.Content>
												<Select.Group>
													{#each currencies as currency (currency.value)}
														<Select.Item value={currency.value} label={currency.label}>
															{currency.label}
														</Select.Item>
													{/each}
												</Select.Group>
											</Select.Content>
										</Select.Root>
									</div>

									<div>
										<Label for="edit-type">Type</Label>
										<Select.Root
											type="single"
											bind:value={formData.type}
											disabled={$session.data?.user?.role !== 'admin'}
										>
											<Select.Trigger class="w-full">
												{typeLabel}
											</Select.Trigger>
											<Select.Content>
												<Select.Group>
													{#each tipTypes as type (type.value)}
														<Select.Item value={type.value} label={type.label}>
															{type.label}
														</Select.Item>
													{/each}
												</Select.Group>
											</Select.Content>
										</Select.Root>
									</div>

									<div class="md:col-span-2">
										<Label for="edit-note">Note</Label>
										<Textarea id="edit-note" bind:value={formData.note} rows={3} />
									</div>

									<div class="flex items-center space-x-4 md:col-span-2">
										<label class="flex items-center">
											<input type="checkbox" bind:checked={formData.anonymous} class="mr-2" />
											Anonymous
										</label>

										{#if $session.data?.user?.role === 'admin'}
											<label class="flex items-center">
												<input type="checkbox" bind:checked={formData.verified} class="mr-2" />
												Verified
											</label>

											<div>
												<Label for="edit-goalId">Goal ID</Label>
												<Input
													id="edit-goalId"
													type="number"
													bind:value={formData.goalId}
													class="w-24"
												/>
											</div>
										{/if}
									</div>

									<div class="flex space-x-2 md:col-span-2">
										<Button onclick={() => updateTip(tip.id)} disabled={loading}>
											<Check class="mr-2 h-4 w-4" />
											Save
										</Button>
										<Button variant="outline" onclick={cancelEdit}>
											<X class="mr-2 h-4 w-4" />
											Cancel
										</Button>
									</div>
								</form>
							{:else}
								<!-- Display Mode -->
								<div class="flex items-start justify-between">
									<div class="flex-1 space-y-4">
										<!-- Header with Amount and Status -->
										<div class="flex items-center space-x-3">
											<h3 class="text-lg font-semibold">
												{formatCurrency(tip.amount, tip.currency)}
											</h3>
											<Badge variant={tip.verified ? 'default' : 'secondary'}>
												{tip.verified ? 'Verified' : 'Unverified'}
											</Badge>
											<Badge variant="outline">{tip.type}</Badge>
											{#if tip.anonymous}
												<Badge variant="outline">Anonymous</Badge>
											{/if}
										</div>

										<!-- Transaction Details -->
										<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
											<!-- Left Column -->
											<div class="space-y-2">
												<div class="rounded-md bg-gray-50 p-3">
													<h4 class="mb-2 font-medium text-gray-700">Transaction Info</h4>
													<div class="space-y-1">
														<p>
															<strong>Ref:</strong>
															<span class="font-mono text-xs">{tip.trxRef}</span>
														</p>
														{#if tip.sessionId}
															<p>
																<strong>Session ID:</strong>
																<span class="font-mono text-xs">{tip.sessionId}</span>
															</p>
														{/if}
														<p><strong>Currency:</strong> {tip.currency}</p>
														<p>
															<strong>Amount:</strong>
															{formatCurrency(tip.amount, tip.currency)}
														</p>
														{#if tip.goalId}
															<p><strong>Goal ID:</strong> {tip.goalId}</p>
														{/if}
														<p><strong>Created:</strong> {formatDate(tip.createdAt)}</p>
														{#if tip.updatedAt && tip.updatedAt !== tip.createdAt}
															<p><strong>Updated:</strong> {formatDate(tip.updatedAt)}</p>
														{/if}
													</div>
												</div>
											</div>

											<!-- Right Column -->
											<div class="space-y-2">
												{#if !tip.anonymous && (tip.senderFullName || tip.senderEmail || tip.senderPhone)}
													<div class="rounded-md bg-blue-50 p-3">
														<h4 class="mb-2 font-medium text-gray-700">Sender Details</h4>
														<div class="space-y-1">
															{#if tip.senderFullName}
																<p><strong>Name:</strong> {tip.senderFullName}</p>
															{/if}
															{#if tip.senderEmail}
																<p><strong>Email:</strong> {tip.senderEmail}</p>
															{/if}
															{#if tip.senderPhone}
																<p><strong>Phone:</strong> {tip.senderPhone}</p>
															{/if}
														</div>
													</div>
												{:else if tip.anonymous}
													<div class="rounded-md bg-gray-50 p-3">
														<h4 class="mb-2 font-medium text-gray-700">Sender Details</h4>
														<p class="italic text-gray-500">
															Anonymous tip - sender details hidden
														</p>
													</div>
												{:else}
													<div class="rounded-md bg-gray-50 p-3">
														<h4 class="mb-2 font-medium text-gray-700">Sender Details</h4>
														<p class="text-gray-500">No sender information provided</p>
													</div>
												{/if}

												<!-- User/Recipient Info if available -->
												{#if tip.userId}
													<div class="rounded-md bg-green-50 p-3">
														<h4 class="mb-2 font-medium text-gray-700">Recipient</h4>
														<p>
															<strong>User ID:</strong>
															<span class="font-mono text-xs">{tip.userId}</span>
														</p>
													</div>
												{/if}
											</div>
										</div>

										<!-- Note Section (Full Width) -->
										{#if tip.note}
											<div class="rounded-md bg-yellow-50 p-3">
												<h4 class="mb-2 font-medium text-gray-700">Message</h4>
												<p class="italic text-gray-700">"{tip.note}"</p>
											</div>
										{/if}

										<!-- Status and Debug Info for Admins -->
										{#if $session.data?.user?.role === 'admin'}
											<div class="rounded-md bg-purple-50 p-3">
												<h4 class="mb-2 font-medium text-gray-700">Admin Info</h4>
												<div class="grid grid-cols-2 gap-4 text-xs">
													<div>
														<p>
															<strong>Document ID:</strong> <span class="font-mono">{tip.id}</span>
														</p>
														<p><strong>Verified Status:</strong> {tip.verified ? 'Yes' : 'No'}</p>
														<p><strong>Anonymous:</strong> {tip.anonymous ? 'Yes' : 'No'}</p>
													</div>
													<div>
														<p><strong>Type:</strong> {tip.type}</p>
														{#if tip.sessionId}
															<p>
																<strong>Payment Session:</strong>
																<span class="font-mono">{tip.sessionId}</span>
															</p>
														{:else}
															<p>
																<strong>Payment Session:</strong>
																<span class="text-red-500">Not created</span>
															</p>
														{/if}
													</div>
												</div>
											</div>
										{/if}
									</div>

									<div class="ml-4 flex space-x-2">
										<Button
											size="sm"
											variant="default"
											onclick={() => startCheckout(tip)}
											disabled={loading}
										>
											<CreditCard class="mr-1 h-4 w-4" />
											Checkout
										</Button>
										{#if !tip.verified && $session.data?.user?.role === 'admin'}
											<Button
												size="sm"
												variant="secondary"
												onclick={() => quickVerifyTip(tip.id)}
												disabled={loading}
											>
												<Check class="mr-1 h-4 w-4" />
												Verify
											</Button>
										{/if}
										<Button size="sm" variant="outline" onclick={() => startEdit(tip)}>
											<Edit class="h-4 w-4" />
										</Button>
										<Button
											size="sm"
											variant="destructive"
											onclick={() => deleteTip(tip.id)}
											disabled={tip.verified && $session.data?.user?.role !== 'admin'}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</div>
							{/if}
						</CardContent>
					</Card>
				{/each}
			</div>
		{/if}
	</div>
{/if}
