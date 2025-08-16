<!-- Admin KYC Management -->
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
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import type { IKyc } from '$src/models/Profile/Kyc.types';

	interface KycWithUser extends Omit<IKyc, 'user' | 'reviewedBy'> {
		id: string;
		user: {
			id: string;
			username?: string;
			email?: string;
			displayName?: string;
		} | null;
		reviewedBy: {
			id: string;
			username?: string;
			email?: string;
			displayName?: string;
		} | null;
	}

	let kycRequests: KycWithUser[] = [];
	let loading = true;
	let error: string | null = null;
	let showReviewDialog = false;
	let showDocumentDialog = false;

	// Review form data
	let selectedKyc: KycWithUser | null = null;
	let reviewStatus: 'approved' | 'rejected' | 'under_review' = 'under_review';
	let adminNotes = '';
	let submittingReview = false;

	// Document viewing
	let documentUrl = '';

	// Status badge colors
	const statusColors = {
		pending: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
		under_review: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
		approved: 'bg-green-100 text-green-800 hover:bg-green-200',
		rejected: 'bg-red-100 text-red-800 hover:bg-red-200'
	};

	// Document type labels
	const documentTypeLabels = {
		national_id: 'National ID',
		passport: 'Passport',
		drivers_license: "Driver's License"
	};

	async function fetchKycRequests() {
		try {
			loading = true;
			error = null;
			const response = await fetch('/api/kyc/admin');
			if (!response.ok) throw new Error('Failed to fetch KYC requests');
			const data = await response.json();
			kycRequests = data.kycRequests;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load KYC requests';
		} finally {
			loading = false;
		}
	}

	async function updateKycStatus(kycId: string, status: string, notes?: string) {
		try {
			submittingReview = true;
			const response = await fetch('/api/kyc/admin', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					kycId,
					status,
					adminNotes: notes || undefined
				})
			});

			if (!response.ok) throw new Error('Failed to update KYC status');
			
			await fetchKycRequests(); // Refresh the list
			showReviewDialog = false;
			resetReviewForm();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update KYC status';
		} finally {
			submittingReview = false;
		}
	}

	function openReviewDialog(kyc: KycWithUser) {
		selectedKyc = kyc;
		reviewStatus = 'under_review';
		adminNotes = kyc.adminNotes || '';
		showReviewDialog = true;
	}

	function openDocumentDialog(url: string) {
		documentUrl = url;
		showDocumentDialog = true;
	}

	function resetReviewForm() {
		selectedKyc = null;
		reviewStatus = 'under_review';
		adminNotes = '';
	}

	function formatDate(date: string | Date) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusBadgeVariant(status: string) {
		switch (status) {
			case 'approved':
				return 'default';
			case 'rejected':
				return 'destructive';
			case 'under_review':
				return 'secondary';
			case 'pending':
			default:
				return 'outline';
		}
	}

	onMount(fetchKycRequests);
</script>

<div class="container mx-auto py-8">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">KYC Requests</h1>
			<p class="text-muted-foreground">Review and manage user identity verification requests</p>
		</div>
		<div class="flex gap-2">
			<Button onclick={() => fetchKycRequests()} variant="outline">Refresh</Button>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
			<span class="ml-2">Loading KYC requests...</span>
		</div>
	{:else if error}
		<div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
			<p class="text-destructive">{error}</p>
			<Button onclick={() => fetchKycRequests()} class="mt-2" variant="outline">Retry</Button>
		</div>
	{:else if kycRequests.length === 0}
		<div class="rounded-lg border border-dashed p-12 text-center">
			<p class="text-muted-foreground">No KYC requests found</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Document</TableHead>
						<TableHead>User</TableHead>
						<TableHead>Document Type</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Submitted</TableHead>
						<TableHead>Reviewed By</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each kycRequests as kyc}
						<TableRow>
							<TableCell>
								<button class="flex items-center justify-center"
								onclick={() => openDocumentDialog(kyc.documentUrl)}
								>
									<img
										src={kyc.documentUrl}
										alt="Document preview"
										class="h-12 w-16 cursor-pointer rounded border object-cover hover:opacity-80"
										loading="lazy"
									/>
								</button>
							</TableCell>
							<TableCell>
								<div class="flex flex-col">
									<span class="font-medium">
										{kyc.user?.displayName || kyc.user?.username || 'Unknown User'}
									</span>
									{#if kyc.user?.email}
										<span class="text-sm text-muted-foreground">{kyc.user.email}</span>
									{/if}
								</div>
							</TableCell>
							<TableCell>
								<span class="capitalize">
									{documentTypeLabels[kyc.documentType] || kyc.documentType}
								</span>
							</TableCell>
							<TableCell>
								<Badge variant={getStatusBadgeVariant(kyc.status)}>
									{kyc.status.replace('_', ' ')}
								</Badge>
							</TableCell>
							<TableCell>
								<span class="text-sm">{formatDate(kyc.createdAt)}</span>
							</TableCell>
							<TableCell>
								{#if kyc.reviewedBy}
									<div class="flex flex-col">
										<span class="text-sm">
											{kyc.reviewedBy.displayName || kyc.reviewedBy.username || 'Admin'}
										</span>
										{#if kyc.reviewedAt}
											<span class="text-xs text-muted-foreground">
												{formatDate(kyc.reviewedAt)}
											</span>
										{/if}
									</div>
								{:else}
									<span class="text-sm text-muted-foreground">Not reviewed</span>
								{/if}
							</TableCell>
							<TableCell>
								<div class="flex gap-2">
									<Button
										size="sm"
										variant="outline"
										onclick={() => openReviewDialog(kyc)}
									>
										Review
									</Button>
									{#if kyc.status === 'pending'}
										<Button
											size="sm"
											variant="default"
											onclick={() => updateKycStatus(kyc.id, 'approved', 'Approved by admin')}
										>
											Quick Approve
										</Button>
										<Button
											size="sm"
											variant="destructive"
											onclick={() => updateKycStatus(kyc.id, 'rejected', 'Rejected by admin')}
										>
											Quick Reject
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

<!-- Document Viewing Dialog -->
<Dialog bind:open={showDocumentDialog}>
	<DialogContent class="max-w-4xl">
		<DialogHeader>
			<DialogTitle>KYC Document</DialogTitle>
		</DialogHeader>
		<div class="flex justify-center">
			<img
				src={documentUrl}
				alt="KYC Document"
				class="max-h-[70vh] max-w-full rounded-lg border object-contain"
				loading="lazy"
			/>
		</div>
		<DialogFooter>
			<Button onclick={() => (showDocumentDialog = false)}>Close</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Review Dialog -->
<Dialog bind:open={showReviewDialog}>
	<DialogContent class="sm:max-w-[500px]">
		<DialogHeader>
			<DialogTitle>Review KYC Request</DialogTitle>
		</DialogHeader>
		{#if selectedKyc}
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label>User Information</Label>
					<div class="rounded-lg border p-3 bg-muted/50">
						<p class="font-medium">
							{selectedKyc.user?.displayName || selectedKyc.user?.username || 'Unknown User'}
						</p>
						{#if selectedKyc.user?.email}
							<p class="text-sm text-muted-foreground">{selectedKyc.user.email}</p>
						{/if}
						<p class="text-sm text-muted-foreground">
							Document: {documentTypeLabels[selectedKyc.documentType] || selectedKyc.documentType}
						</p>
						<p class="text-sm text-muted-foreground">
							Submitted: {formatDate(selectedKyc.createdAt)}
						</p>
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="reviewStatus">Status</Label>
					<select
						id="reviewStatus"
						bind:value={reviewStatus}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<option value="under_review">Under Review</option>
						<option value="approved">Approved</option>
						<option value="rejected">Rejected</option>
					</select>
				</div>

				<div class="grid gap-2">
					<Label for="adminNotes">Admin Notes</Label>
					<Textarea
						id="adminNotes"
						bind:value={adminNotes}
						placeholder="Add notes about your review decision..."
						rows={3}
					/>
				</div>
			</div>
		{/if}
		<DialogFooter>
			<Button
				variant="outline"
				onclick={() => {
					showReviewDialog = false;
					resetReviewForm();
				}}
			>
				Cancel
			</Button>
			<Button
				onclick={() => selectedKyc && updateKycStatus(selectedKyc.id, reviewStatus, adminNotes)}
				disabled={submittingReview}
			>
				{submittingReview ? 'Updating...' : 'Update Status'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog> 