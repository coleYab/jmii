<!-- Admin Payouts Management -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { IWithdrawalSchema } from '$src/models/Withdrawal.model';

	let withdrawals: Array<IWithdrawalSchema & { id: string }> = [];
	let loading = true;
	let error: string | null = null;
	let showNewRequestDialog = false;

	// New withdrawal form data
	let newWithdrawal = {
		userId: '',
		amount: '',
		paymentMethod: '',
		phoneNumber: ''
	};

	// Status badge colors
	const statusColors = {
		pending: 'bg-yellow-100 text-yellow-800',
		approved: 'bg-blue-100 text-blue-800',
		rejected: 'bg-red-100 text-red-800',
		processing: 'bg-purple-100 text-purple-800',
		completed: 'bg-green-100 text-green-800'
	};

	async function fetchWithdrawals() {
		try {
			const response = await fetch('/api/withdrawal');
			if (!response.ok) throw new Error('Failed to fetch withdrawals');
			const data = await response.json();
			withdrawals = data.withdrawals;
			loading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load withdrawals';
			loading = false;
		}
	}

	async function updateWithdrawalStatus(withdrawalId: string, status: string, notes?: string) {
		try {
			const response = await fetch('/api/withdrawal', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					withdrawalId,
					status,
					adminNotes: notes || undefined
				})
			});

			if (!response.ok) throw new Error('Failed to update withdrawal');
			await fetchWithdrawals(); // Refresh the list
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update withdrawal';
		}
	}

	async function createWithdrawal() {
		try {
			const response = await fetch('/api/withdrawal', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: newWithdrawal.userId,
					amount: parseFloat(newWithdrawal.amount),
					paymentMethod: newWithdrawal.paymentMethod,
					phoneNumber: newWithdrawal.phoneNumber
				})
			});

			if (!response.ok) throw new Error('Failed to create withdrawal');

			// Reset form and close dialog
			newWithdrawal = {
				userId: '',
				amount: '',
				paymentMethod: '',
				phoneNumber: ''
			};
			showNewRequestDialog = false;

			await fetchWithdrawals(); // Refresh the list
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create withdrawal';
		}
	}

	onMount(fetchWithdrawals);
</script>

<div class="container mx-auto py-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-xl font-bold">Payout Requests</h1>
		<div class="flex gap-2">
			<Button onclick={() => fetchWithdrawals()} variant="outline">Refresh</Button>
			<Button onclick={() => (showNewRequestDialog = true)} variant="default">New Request</Button>
		</div>
	</div>

	{#if loading}
		<div class="py-8 text-center">Loading withdrawals...</div>
	{:else if error}
		<div class="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700" role="alert">
			{error}
		</div>
	{:else}
		<div class="overflow-hidden rounded-lg bg-white shadow">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>User ID</TableHead>
						<TableHead>Amount</TableHead>
						<TableHead>Payment Method</TableHead>
						<TableHead>Phone</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each withdrawals as withdrawal}
						<TableRow>
							<TableCell>{withdrawal.userId}</TableCell>
							<TableCell>${withdrawal.amount.toFixed(2)}</TableCell>
							<TableCell>{withdrawal.paymentMethod}</TableCell>
							<TableCell>{withdrawal.phoneNumber}</TableCell>
							<TableCell>
								<span class="rounded-full px-2 py-1 text-xs {statusColors[withdrawal.status]}">
									{withdrawal.status}
								</span>
							</TableCell>
							<TableCell>
								<div class="flex gap-2">
									{#if withdrawal.status === 'pending'}
										<Button
											size="sm"
											variant="outline"
											onclick={() =>
												updateWithdrawalStatus(withdrawal.id, 'approved', 'Approved by admin')}
										>
											Approve
										</Button>
										<Button
											size="sm"
											variant="destructive"
											onclick={() =>
												updateWithdrawalStatus(withdrawal.id, 'rejected', 'Rejected by admin')}
										>
											Reject
										</Button>
									{:else if withdrawal.status === 'approved'}
										<Button
											size="sm"
											variant="outline"
											onclick={() =>
												updateWithdrawalStatus(withdrawal.id, 'processing', 'Processing payment')}
										>
											Process
										</Button>
									{:else if withdrawal.status === 'processing'}
										<Button
											size="sm"
											variant="outline"
											onclick={() =>
												updateWithdrawalStatus(withdrawal.id, 'completed', 'Payment completed')}
										>
											Complete
										</Button>
									{/if}
								</div>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{/if}
</div>

<!-- New Withdrawal Request Dialog -->
<Dialog bind:open={showNewRequestDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>New Withdrawal Request</DialogTitle>
		</DialogHeader>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="userId">User ID</Label>
				<Input id="userId" bind:value={newWithdrawal.userId} placeholder="User ID" />
			</div>
			<div class="grid gap-2">
				<Label for="amount">Amount</Label>
				<Input
					id="amount"
					type="number"
					bind:value={newWithdrawal.amount}
					placeholder="Enter amount"
					min="0"
					step="0.01"
				/>
			</div>
			<div class="grid gap-2">
				<Label for="paymentMethod">Payment Method</Label>
				<Input
					id="paymentMethod"
					bind:value={newWithdrawal.paymentMethod}
					placeholder="e.g. Bank Transfer, Mobile Money"
				/>
			</div>
			<div class="grid gap-2">
				<Label for="phone">Phone Number</Label>
				<Input id="phone" bind:value={newWithdrawal.phoneNumber} placeholder="Enter phone number" />
			</div>
		</div>
		<DialogFooter>
			<Button variant="outline" onclick={() => (showNewRequestDialog = false)}>Cancel</Button>
			<Button onclick={createWithdrawal}>Create Request</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
