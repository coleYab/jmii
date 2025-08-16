<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Plus, Target, Calendar, CurrencyDollar, PencilSimple, Trash } from 'phosphor-svelte';
	import TimeRangeFilter from './Goals-comp/TimeRangeFilter.svelte';
	import {
		CalendarDateTime,
		getLocalTimeZone,
		today,
		type DateValue
	} from '@internationalized/date';

	// Goal interface
	interface Goal {
		id: string;
		name: string;
		amount: number;
		startDate: string;
		endDate: string;
		description: string;
		createdAt: string;
		updatedAt: string;
	}

	// Form interface
	interface GoalForm {
		name: string;
		amount: number | '';
		startDate: string;
		endDate: string;
		description: string;
	}

	// State
	let goals: Goal[] = $state([]);
	let loading = $state(false);
	let dialogOpen = $state(false);
	let editingGoal: Goal | null = $state(null);
	let submitting = $state(false);
	let error = $state('');

	// Form state
	let form: GoalForm = $state({
		name: '',
		amount: '',
		startDate: '',
		endDate: '',
		description: ''
	});

	// Time range filter state
	let timeRangeFilterOptions = $state({
		timeRangeFilter: [today(getLocalTimeZone()), today(getLocalTimeZone()).add({ days: 30 })] as [
			DateValue,
			DateValue
		],
		selectedTimeRange: 'next30days' as string
	});

	// Helper functions
	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(amount);

	const formatDate = (dateString: string) =>
		new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});

	const getGoalStatus = (startDate: string, endDate: string) => {
		const now = new Date();
		const start = new Date(startDate);
		const end = new Date(endDate);

		if (now < start) return { status: 'upcoming', color: 'bg-blue-100 text-blue-800' };
		if (now > end) return { status: 'completed', color: 'bg-green-100 text-green-800' };
		return { status: 'active', color: 'bg-yellow-100 text-yellow-800' };
	};

	const getDaysRemaining = (endDate: string) => {
		const now = new Date();
		const end = new Date(endDate);
		const diffTime = end.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	};

	// API functions
	const fetchGoals = async () => {
		loading = true;
		try {
			const response = await fetch('/api/goal');
			if (response.ok) {
				const data = await response.json();
				goals = data.goals || [];
			} else {
				error = 'Failed to fetch goals';
			}
		} catch (err) {
			error = 'Network error occurred';
			console.error('Error fetching goals:', err);
		} finally {
			loading = false;
		}
	};

	const createGoal = async (goalData: GoalForm) => {
		const response = await fetch('/api/goal', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(goalData)
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'Failed to create goal');
		}

		return response.json();
	};

	const updateGoal = async (id: string, goalData: GoalForm) => {
		const response = await fetch('/api/goal', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id, ...goalData })
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'Failed to update goal');
		}

		return response.json();
	};

	const deleteGoal = async (id: string) => {
		const response = await fetch('/api/goal', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id })
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'Failed to delete goal');
		}

		return response.json();
	};

	// Event handlers
	const openCreateDialog = () => {
		editingGoal = null;
		form = {
			name: '',
			amount: '',
			startDate: '',
			endDate: '',
			description: ''
		};
		// Reset time range filter to default
		timeRangeFilterOptions = {
			timeRangeFilter: [today(getLocalTimeZone()), today(getLocalTimeZone()).add({ days: 30 })],
			selectedTimeRange: 'next30days'
		};
		error = '';
		dialogOpen = true;
	};

	const openEditDialog = (goal: Goal) => {
		editingGoal = goal;
		form = {
			name: goal.name,
			amount: goal.amount,
			startDate: goal.startDate.split('T')[0], // Format for input[type="date"]
			endDate: goal.endDate.split('T')[0],
			description: goal.description
		};

		// Convert existing goal dates to DateValue for time range filter
		const startDate = new Date(goal.startDate);
		const endDate = new Date(goal.endDate);

		timeRangeFilterOptions = {
			timeRangeFilter: [
				new CalendarDateTime(
					startDate.getFullYear(),
					startDate.getMonth() + 1,
					startDate.getDate(),
					startDate.getHours(),
					startDate.getMinutes(),
					startDate.getSeconds(),
					startDate.getMilliseconds()
				),
				new CalendarDateTime(
					endDate.getFullYear(),
					endDate.getMonth() + 1,
					endDate.getDate(),
					endDate.getHours(),
					endDate.getMinutes(),
					endDate.getSeconds(),
					endDate.getMilliseconds()
				)
			],
			selectedTimeRange: 'custom'
		};
		error = '';
		dialogOpen = true;
	};

	// Handle time range change from TimeRangeFilter
	const handleTimeRangeChange = (range: [DateValue, DateValue]): boolean => {
		try {
			// Update the form dates
			form.startDate = range[0].toDate(getLocalTimeZone()).toISOString().split('T')[0];
			form.endDate = range[1].toDate(getLocalTimeZone()).toISOString().split('T')[0];

			// Update the filter options
			timeRangeFilterOptions.timeRangeFilter = range;

			return true;
		} catch (error) {
			console.error('Error updating time range:', error);
			return false;
		}
	};

	const handleSubmit = async () => {
		if (!form.name || !form.amount || !form.startDate || !form.endDate) {
			error = 'Please fill in all required fields';
			return;
		}

		if (new Date(form.endDate) <= new Date(form.startDate)) {
			error = 'End date must be after start date';
			return;
		}

		submitting = true;
		error = '';

		try {
			if (editingGoal) {
				await updateGoal(editingGoal.id, form);
			} else {
				await createGoal(form);
			}

			dialogOpen = false;
			await fetchGoals();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			submitting = false;
		}
	};

	const handleDelete = async (goal: Goal) => {
		if (!confirm(`Are you sure you want to delete "${goal.name}"?`)) return;

		try {
			await deleteGoal(goal.id);
			await fetchGoals();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete goal';
		}
	};

	// Lifecycle
	onMount(() => {
		fetchGoals();
	});
</script>

<section class="flex w-full flex-col gap-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-xl font-bold tracking-tight sm:text-2xl">Goals</h2>
			<p class="text-muted-foreground text-sm sm:text-base">Set and track your financial milestones</p>
		</div>
		<Button onclick={openCreateDialog} class="gap-2 w-full sm:w-auto">
			<Plus class="h-4 w-4" />
			New Goal
		</Button>
	</div>

	{#if error}
		<div class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
			{error}
		</div>
	{/if}

	<!-- Goals Grid -->
	{#if loading}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(3) as _}
				<div class="animate-pulse rounded-lg border bg-card text-card-foreground shadow-sm">
					<div class="p-4 sm:p-6">
						<div class="mb-4 h-4 rounded bg-gray-200"></div>
						<div class="mb-2 h-8 rounded bg-gray-200"></div>
						<div class="mb-4 h-4 rounded bg-gray-200"></div>
						<div class="flex gap-2">
							<div class="h-6 flex-1 rounded bg-gray-200"></div>
							<div class="h-6 flex-1 rounded bg-gray-200"></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if goals.length === 0}
		<div class="rounded-lg border bg-card text-card-foreground shadow-sm">
			<div class="flex flex-col items-center justify-center p-4 py-12 sm:p-6 sm:py-16">
				<Target class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="mb-2 text-lg font-semibold">No goals yet</h3>
				<p class="mb-6 text-center text-muted-foreground text-sm">
					Create your first goal to start tracking your financial milestones
				</p>
				<Button onclick={openCreateDialog} class="gap-2 w-full sm:w-auto">
					<Plus class="h-4 w-4" />
					Create Goal
				</Button>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each goals as goal}
				{@const statusInfo = getGoalStatus(goal.startDate, goal.endDate)}
				{@const daysRemaining = getDaysRemaining(goal.endDate)}

				<div class="relative rounded-lg border bg-card text-card-foreground shadow-sm">
					<div class="flex flex-col space-y-1.5 p-4 sm:p-6 sm:pb-4">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<h3 class="text-base font-semibold leading-none tracking-tight sm:text-lg">{goal.name}</h3>
								<div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
									<Badge class={statusInfo.color}>
										{statusInfo.status}
									</Badge>
									{#if statusInfo.status === 'active'}
										<span class="text-xs text-muted-foreground sm:text-sm">
											{daysRemaining > 0 ? `${daysRemaining} days left` : 'Due today'}
										</span>
									{/if}
								</div>
							</div>
							<div class="flex gap-1">
								<Button
									variant="ghost"
									size="sm"
									onclick={() => openEditDialog(goal)}
									class="h-8 w-8 p-0"
								>
									<PencilSimple class="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => handleDelete(goal)}
									class="h-8 w-8 p-0 text-red-600 hover:text-red-700"
								>
									<Trash class="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>

					<div class="p-4 pt-0 sm:p-6 sm:pt-0">
						<div class="space-y-4">
							<!-- Amount -->
							<div class="flex items-center gap-2">
								<CurrencyDollar class="h-4 w-4 text-muted-foreground" />
								<span class="text-lg font-bold sm:text-xl">{formatCurrency(goal.amount)}</span>
							</div>

							<!-- Dates -->
							<div class="space-y-2">
								<div class="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
									<Calendar class="h-4 w-4" />
									<span>Starts: {formatDate(goal.startDate)}</span>
								</div>
								<div class="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
									<Calendar class="h-4 w-4" />
									<span>Ends: {formatDate(goal.endDate)}</span>
								</div>
							</div>

							<!-- Description -->
							{#if goal.description}
								<Separator />
								<p class="text-xs text-muted-foreground sm:text-sm">{goal.description}</p>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>

<!-- Create/Edit Dialog -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="w-[95vw] max-w-[425px] sm:w-auto">
		<Dialog.Header>
			<Dialog.Title>
				{editingGoal ? 'Edit Goal' : 'Create New Goal'}
			</Dialog.Title>
			<Dialog.Description>
				{editingGoal
					? 'Update your goal details below.'
					: 'Set a new financial milestone to track your progress.'}
			</Dialog.Description>
		</Dialog.Header>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
			class="space-y-4"
		>
			<div class="space-y-2">
				<Label for="name">Goal Name *</Label>
				<Input id="name" bind:value={form.name} placeholder="e.g., Emergency Fund" required />
			</div>

			<div class="space-y-2">
				<Label for="amount">Target Amount (ETB) *</Label>
				<Input
					id="amount"
					type="number"
					bind:value={form.amount}
					placeholder="e.g., 50000"
					min="0"
					step="0.01"
					required
				/>
			</div>

			<div class="space-y-2">
				<Label>Goal Timeline *</Label>
				<TimeRangeFilter
					setTimeRange={handleTimeRangeChange}
					bind:filterOptions={timeRangeFilterOptions}
				/>
			</div>

			<div class="space-y-2">
				<Label for="description">Description</Label>
				<Textarea
					id="description"
					bind:value={form.description}
					placeholder="Optional description for your goal..."
					rows={3}
				/>
			</div>

			{#if error}
				<div class="text-sm text-red-600">{error}</div>
			{/if}

			<Dialog.Footer class="flex flex-col gap-2 sm:flex-row sm:justify-end">
				<Button
					type="button"
					variant="outline"
					onclick={() => (dialogOpen = false)}
					disabled={submitting}
					class="w-full sm:w-auto"
				>
					Cancel
				</Button>
				<Button type="submit" disabled={submitting} class="w-full sm:w-auto">
					{#if submitting}
						Saving...
					{:else}
						{editingGoal ? 'Update Goal' : 'Create Goal'}
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
