<script lang="ts">
	import { onMount } from 'svelte';
	import { ChevronDown, Target, Calendar, DollarSign } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '$lib/components/ui/collapsible';

	interface TipGoal {
		id: string;
		name: string;
		amount: number;
		startDate: string;
		endDate: string;
		description: string;
		currentAmount?: number;
		tipCount?: number;
	}

	interface Props {
		userId: string;
		theme?: any;
	}

	let { userId, theme }: Props = $props();
	let goals: TipGoal[] = $state([]);
	let loading = $state(true);
	let isOpen = $state(false);

	onMount(async () => {
		await loadGoals();
	});

	async function loadGoals() {
		try {
			loading = true;
			const response = await fetch(`/api/goal?userId=${userId}`);
			if (response.ok) {
				const data = await response.json();
				goals = data.goals || [];
			}
		} catch (error) {
			console.error('Error loading goals:', error);
		} finally {
			loading = false;
		}
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'ETB',
			minimumFractionDigits: 0
		}).format(amount);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function calculateProgress(current: number, target: number): number {
		return Math.min((current || 0) / target, 1) * 100;
	}

	function getDaysRemaining(endDate: string): number {
		const end = new Date(endDate);
		const now = new Date();
		const diffTime = end.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return Math.max(0, diffDays);
	}

	let primaryGoal = $derived(goals[0]);
	let otherGoals = $derived(goals.slice(1));
	let hasGoals = $derived(goals.length > 0);
	let hasMultipleGoals = $derived(goals.length > 1);
</script>

{#if hasGoals} 
	<section class="mt-8 w-4/5 flex flex-col items-center justify-center px-4 sm:mt-12">
		<div class="w-full max-w-lg sm:max-w-xl">
			<!-- Section Header -->
			<div class="mb-4 text-center sm:mb-6">
				<h2 class="mb-2 text-lg font-bold text-foreground sm:text-xl">
					Tip Goals
				</h2>
				<p class="text-xs text-muted-foreground sm:text-sm">
					Support my goals and help me achieve my dreams
				</p>
			</div>

			<!-- Primary Goal Display -->
			{#if primaryGoal}
				<div 
					class="mb-4 rounded-xl border border-border/50 bg-card p-3 shadow-md transition-all duration-300 hover:shadow-lg sm:p-4"
					style="border-color: {theme?.stroke || 'var(--border)'}; background-color: {theme?.background || 'var(--card)'};"
				>
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-2 sm:gap-3">
							<!-- <div 
								class="flex h-8 w-8 items-center justify-center rounded-lg sm:h-10 sm:w-10"
								style="background-color: {theme?.buttonBackground || 'var(--primary)'}; color: {theme?.buttonColor || 'white'};"
							>
								<Target size={18} class="sm:w-5 sm:h-5" />
							</div> -->
							<div>
								<h3 class="text-base font-semibold text-foreground sm:text-lg">
									{primaryGoal.name}
								</h3>
								<p class="text-xs text-muted-foreground sm:text-sm">
									{primaryGoal.description}
								</p>
							</div>
						</div>
						<div class="text-right">
							<div class="text-lg font-bold text-foreground sm:text-xl">
								{formatCurrency(primaryGoal.currentAmount || 0)}
							</div>
							<div class="text-xs text-muted-foreground sm:text-sm">
								of {formatCurrency(primaryGoal.amount)}
							</div>
						</div>
					</div>

					<!-- Progress Bar -->
					<div class="mt-2 sm:mt-3">
						<div class="mb-1 sm:mb-2 flex items-center justify-between text-xs">
							<span class="text-muted-foreground">Progress</span>
							<span class="font-medium text-foreground">
								{Math.round(calculateProgress(primaryGoal.currentAmount || 0, primaryGoal.amount))}%
							</span>
						</div>
						<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted sm:h-2">
							<div 
								class="h-full rounded-full transition-all duration-500 ease-out"
								style="
									width: {calculateProgress(primaryGoal.currentAmount || 0, primaryGoal.amount)}%;
									background-color: {theme?.buttonBackground || 'var(--primary)'};
								"
							></div>
						</div>
					</div>

					<!-- Goal Details -->
					<div class="mt-2 sm:mt-3 flex items-center justify-between text-xs text-muted-foreground">
						<div class="flex items-center gap-2 sm:gap-3">
							<div class="flex items-center gap-1">
								<Calendar size={12} class="sm:w-3.5 sm:h-3.5" />
								<span class="text-xs">Ends {formatDate(primaryGoal.endDate)}</span>
							</div>
							<div class="flex items-center gap-1">
								<DollarSign size={12} class="sm:w-3.5 sm:h-3.5" />
								<span class="text-xs">{getDaysRemaining(primaryGoal.endDate)} days left</span>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Other Goals Dropdown -->
			{#if hasMultipleGoals}
				<Collapsible bind:open={isOpen} class="w-full">
					<CollapsibleTrigger>
						<Button
							variant="outline"
							class="w-full justify-between rounded-lg border-2 border-dashed border-border/50 bg-transparent px-3 py-2 text-foreground hover:bg-muted/50 sm:px-4 sm:py-3"
							style="border-color: {theme?.stroke || 'var(--border)'};"
						>
							<span class="text-xs font-medium sm:text-sm">
								View {otherGoals.length} Other Goal{otherGoals.length === 1 ? '' : 's'}
							</span>
							<ChevronDown 
								size={16} 
								class="transition-transform duration-200 sm:w-4.5 sm:h-4.5 {isOpen ? 'rotate-180' : ''}"
							/>
						</Button>
					</CollapsibleTrigger>
					
					<CollapsibleContent class="mt-4">
						<div class="space-y-4">
							{#each otherGoals as goal (goal.id)}
								<div 
									class="rounded-lg border border-border/30 bg-card/50 p-2 shadow-sm transition-all duration-200 hover:shadow-md sm:p-3"
									style="border-color: {theme?.stroke || 'var(--border)'}; background-color: {theme?.background || 'var(--card)'};"
								>
									<div class="flex items-start justify-between">
										<div class="flex items-center gap-2">
											<div 
												class="flex h-6 w-6 items-center justify-center rounded-md sm:h-8 sm:w-8"
												style="background-color: {theme?.buttonBackground || 'var(--primary)'}; color: {theme?.buttonColor || 'white'};"
											>
												<Target size={14} class="sm:w-4 sm:h-4" />
											</div>
											<div>
												<h4 class="text-xs font-semibold text-foreground sm:text-sm">
													{goal.name}
												</h4>
												<p class="text-xs text-muted-foreground">
													{goal.description}
												</p>
											</div>
										</div>
										<div class="text-right">
											<div class="text-xs font-semibold text-foreground sm:text-sm">
												{formatCurrency(goal.currentAmount || 0)}
											</div>
											<div class="text-xs text-muted-foreground">
												of {formatCurrency(goal.amount)}
											</div>
										</div>
									</div>

									<!-- Mini Progress Bar -->
									<div class="mt-3">
										<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
											<div 
												class="h-full rounded-full transition-all duration-500 ease-out"
												style="
													width: {calculateProgress(goal.currentAmount || 0, goal.amount)}%;
													background-color: {theme?.buttonBackground || 'var(--primary)'};
												"
											></div>
										</div>
									</div>

									<!-- Goal Details -->
									<div class="mt-3 flex items-center justify-between text-xs text-muted-foreground">
										<span>Ends {formatDate(goal.endDate)}</span>
										<span>{getDaysRemaining(goal.endDate)} days left</span>
									</div>
								</div>
							{/each}
						</div>
					</CollapsibleContent>
				</Collapsible>
			{/if}
		</div>
	</section>
{/if}

<style>
	/* Apply theme colors to the component */
	:global(.tip-goals-container) {
		background-color: var(--theme-background, transparent);
		border-color: var(--theme-stroke, #e5e7eb);
	}
</style>
