<script lang="ts">
	import TimeSeriesChart from '$lib/components/charts/TimeSeriesChart.svelte';
	import type { TimeSeriesMetric } from '$lib/components/charts/TimeSeriesChart.svelte';

	// --- Component Props Interface --- //
	interface Props {
		marginTop?: number;
		marginRight?: number;
		marginBottom?: number;
		marginLeft?: number;
		height?: number;
		data?: Array<{
			date: Date;
			views: number;
			clicks: number;
			ctr?: number;
		}>;
	}

	// --- Component State & Props Setup --- //
	let {
		marginTop = 20,
		marginRight = 20,
		marginBottom = 30,
		marginLeft = 40,
		height = 400,
		data = []
	}: Props = $props();

	const chartData = data.length > 0 ? data : [];

	// --- Define Metrics for the TimeSeriesChart --- //
	const analyticsMetrics: TimeSeriesMetric[] = [
		{
			key: 'clicks',
			label: 'Clicks',
			color: 'steelblue'
			// formatValue: formatNumber // Optional: Let TimeSeriesChart use its default
		},
		{
			key: 'views',
			label: 'Views',
			color: 'darkorange'
			// formatValue: formatNumber // Optional: Let TimeSeriesChart use its default
		}
	];
</script>

<div
	class="chart-container relative flex w-full flex-col items-center justify-center"
	style="min-height: {height}px;"
>
	<h3 class="mb-4 text-lg font-semibold">Analytics Trends Over Time</h3>
	{#if chartData && chartData.length > 0}
		<TimeSeriesChart
			data={chartData}
			metrics={analyticsMetrics}
			{height}
			{marginTop}
			{marginRight}
			{marginBottom}
			{marginLeft}
		/>
	{:else}
		<!-- Optional: Show a loading state or placeholder -->
		<div
			style="height: {height}px;"
			class="flex items-center justify-center text-sm text-muted-foreground"
		>
			No analytics data available yet. Start sharing your page to see analytics!
		</div>
	{/if}
	<!-- Removed SVG implementation and HTML Tooltip -->
</div>

<!-- Removed chart-specific styles -->
<style>
	/* Keep only general container styles if needed */
	.chart-container {
		/* Add any necessary container styles here */
		/* Example: */
		/* padding: 1rem; */
		border: 1px solid hsl(var(--border));
		border-radius: 24px;
		background-color: hsl(var(--card));
		color: hsl(var(--card-foreground));
		box-shadow: var(--shadow-sm);
		padding: 1.5rem; /* Re-add padding similar to tips page */
	}

	h3 {
		/* Style the title */
		margin-bottom: 1rem; /* Match spacing from tips page */
	}
</style>
