<script lang="ts">
	import TimeSeriesChart from '$lib/components/charts/TimeSeriesChart.svelte';
	import * as Table from '$lib/components/ui/table';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { CurrencyDollar, Rows, TrendDown, TrendUp } from 'phosphor-svelte';
	import type { ITipSchema } from '$src/models/Tip.model';
	import type {
		TimeSeriesDataPoint,
		TimeSeriesMetric
	} from '$lib/components/charts/TimeSeriesChart.svelte';

	const {
		tips,
		refreshing,
		nextRefreshIn
	}: { tips: ITipSchema[]; refreshing: boolean; nextRefreshIn: number } = $props();
	let loading = $state(false);

	// Preprocess tips data for TimeSeriesChart
	function preprocessTipsData(tips: ITipSchema[]): {
		data: TimeSeriesDataPoint[];
		metrics: TimeSeriesMetric[];
	} {
		// Group tips by date (day level)
		const dailyData = new Map<
			string,
			{
				date: Date;
				totalAmount: number;
				tipCount: number;
				verifiedAmount: number;
				anonymousTips: number;
			}
		>();

		tips.forEach((tip) => {
			if (!tip.createdAt) return;

			// Convert createdAt to Date object if it's not already
			const createdAtDate = tip.createdAt instanceof Date ? tip.createdAt : new Date(tip.createdAt);

			// Check if the date is valid
			if (isNaN(createdAtDate.getTime())) {
				console.warn('Invalid date found in tip:', tip.id, tip.createdAt);
				return;
			}

			// Get date at day level (remove time)
			const dateKey = createdAtDate.toISOString().split('T')[0];
			const date = new Date(dateKey + 'T00:00:00.000Z');

			if (!dailyData.has(dateKey)) {
				dailyData.set(dateKey, {
					date,
					totalAmount: 0,
					tipCount: 0,
					verifiedAmount: 0,
					anonymousTips: 0
				});
			}

			const dayData = dailyData.get(dateKey)!;
			dayData.totalAmount += tip.amount;
			dayData.tipCount += 1;

			if (tip.verified) {
				dayData.verifiedAmount += tip.amount;
			}

			if (tip.anonymous) {
				dayData.anonymousTips += 1;
			}
		});

		// Convert to array and sort by date
		const sortedData = Array.from(dailyData.values()).sort(
			(a, b) => a.date.getTime() - b.date.getTime()
		);

		// Calculate cumulative totals starting from 0
		let cumulativeTotal = 0;
		const data: TimeSeriesDataPoint[] = sortedData.map((dayData) => {
			cumulativeTotal += dayData.totalAmount;
			return {
				...dayData,
				cumulativeTotal
			};
		});

		// Define metrics to display
		const metrics: TimeSeriesMetric[] = [
			{
				key: 'totalAmount',
				label: 'Daily Amount',
				color: '#D53380',
				formatValue: (value: number | null) => (value ? `${value.toLocaleString()} ETB` : 'N/A')
			},
			{
				key: 'verifiedAmount',
				label: 'Daily Verified Amount',
				color: '#4C27A8', // purple
				formatValue: (value: number | null) => (value ? `${value.toLocaleString()} ETB` : 'N/A')
			},
			{
				key: 'cumulativeTotal',
				label: 'Total Balance',
				color: '#059669', // emerald green
				formatValue: (value: number | null) => (value ? `${value.toLocaleString()} ETB` : 'N/A')
			}
		];

		return { data, metrics };
	}

	// Get processed data for chart
	const { data: tipsTrendData, metrics: tipsMetrics } = $derived(preprocessTipsData(tips));
</script>



<section class="flex w-full flex-col">
	<div
		class="tips-trend-chart-wrapper mb-6 rounded-lg border bg-card p-2 text-card-foreground shadow-sm md:p-6"
	>
		<div class="h-[380px]">
			<TimeSeriesChart data={tipsTrendData} metrics={tipsMetrics} height={320} marginLeft={40} marginTop={20} marginBottom={20} />
		</div>
	</div>

	<!-- Detailed Tips Table -->
	{#if refreshing}
		<div class="rounded-t-2xl border border-blue-200 bg-blue-50 p-2 text-center">
			<p class="text-sm text-blue-800">🔄 Refreshing tips data...</p>
		</div>
	{:else if nextRefreshIn > 0}
		<div class="rounded-t-2xl border border-gray-200 bg-gray-50 p-2 text-center">
			<p class="text-sm text-gray-600">⏱️ Next refresh in {nextRefreshIn}s</p>
		</div>
	{/if}
	<div class="rounded-b-2xl border border-t-transparent bg-background p-2 shadow-sm md:p-6">
		<h3 class="mb-4 text-lg font-semibold">Recent Tips</h3>
		{#if loading}
			<!-- Loading skeleton for table -->
			<div class="space-y-4">
				{#each Array(5) as _, i}
					<div class="flex space-x-4 py-3">
						<Skeleton class="h-4 w-24" />
						<Skeleton class="h-4 w-20" />
						<Skeleton class="h-4 w-16" />
						<Skeleton class="h-4 w-32" />
					</div>
				{/each}
			</div>
		{:else}
			<!-- Mobile responsive table -->
			<div class="block md:hidden">
				{#each tips as tip (tip.id)}
					<div class="mb-4 rounded-lg border p-4">
						<div class="flex items-center justify-between mb-2">
							<span class="font-medium text-sm">
								{tip.senderFullName || (tip.anonymous ? 'Anonymous' : 'Unknown')}
							</span>
							<div class="rounded-2xl border px-3 py-1 text-center">
								<span class="text-base font-semibold">
									{tip.amount}
								</span>
								<span class="text-xs ml-1">
									{tip.currency || 'ETB'}
								</span>
							</div>
						</div>
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">
								{tip.type}
								{tip.verified ? ' ✓' : ''}
							</span>
							<span class="text-xs text-muted-foreground">
								{tip.createdAt?.toLocaleString()}
							</span>
						</div>
						{#if tip.note}
							<div class="text-sm text-muted-foreground border-t pt-2">
								{tip.note}
							</div>
						{/if}
					</div>
				{/each}
			</div>
			
			<!-- Desktop table -->
			<div class="hidden md:block">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>From</Table.Head>
							<Table.Head>Amount</Table.Head>
							<Table.Head>Type</Table.Head>
							<Table.Head class="text-right">Notes</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each tips as tip (tip.id)}
							<Table.Row>
								<Table.Cell
									>{tip.senderFullName || (tip.anonymous ? 'Anonymous' : 'Unknown')}</Table.Cell
								>
								<Table.Cell>
									<div class="rounded-2xl border px-4 py-2 text-center">
										<span class="text-lg">
											{tip.amount}
										</span>
										<span class="text-sm">
											{tip.currency || 'ETB'}
										</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<!-- Display tip type and verification status -->
									<span class:text-green-600={tip.verified} class:text-gray-600={!tip.verified}>
										{tip.type}
										{tip.verified ? '✓' : ''}
									</span>
								</Table.Cell>
								<Table.Cell>
									<div class="flex flex-col">
										<span class="text-sm">
											{tip.note || 'No message provided'}
										</span>
										<span class="text-right italic text-muted-foreground">
											{tip.createdAt?.toLocaleString()}
										</span>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}
	</div>
</section>
