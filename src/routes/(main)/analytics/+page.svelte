<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { onMount } from 'svelte';
	import { Rows, TrendUp, TrendDown } from 'phosphor-svelte';
	import Analytics from './Analytics.svelte';
	import { Separator } from '$lib/components/ui/separator';

	// Define analytics data type
	type AnalyticsData = {
		lifetimeViews: number;
		viewsTrend: number;
		lifetimeClicks: number;
		clicksTrend: number;
		lifetimeCtr: number;
		ctrTrend: number;
		lifetimeSubs: number;
		subsTrend: number;
		chartData: Array<{
			date: Date;
			views: number;
			clicks: number;
			ctr: number;
		}>;
	} | null;

	let { session }: { session: any } = $props();

	let analyticsData: AnalyticsData = $state(null);
	let loading = $state(true);
	let error = $state('');

	function formatNumber(num: number | undefined | null): string {
		return num?.toLocaleString() ?? 'N/A';
	}

	function getTrendDetails(trend: number | undefined | null) {
		if (trend == null || isNaN(trend)) {
			return { text: '', color: 'text-muted-foreground', icon: null };
		}
		const prefix = trend > 0 ? '+' : '';
		const color =
			trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-muted-foreground';
		const icon = trend > 0 ? TrendUp : trend < 0 ? TrendDown : null;
		return {
			text: `${prefix}${trend.toFixed(1)}%`,
			color,
			icon
		};
	}

	async function fetchAnalyticsData() {
		try {
			loading = true;
			error = '';

			const response = await fetch('/api/analytics');
			const result = await response.json();
			console.log(result);

			if (!response.ok) {
				throw new Error(result.error || 'Failed to fetch analytics data');
			}

			if (result.success && result.data) {
				analyticsData = {
					lifetimeViews: result.data.lifetime.lifetimeViews,
					viewsTrend: result.data.trends.viewsTrend,
					lifetimeClicks: result.data.lifetime.lifetimeClicks,
					clicksTrend: result.data.trends.clicksTrend,
					lifetimeCtr: result.data.lifetime.lifetimeCtr,
					ctrTrend: result.data.trends.ctrTrend,
					lifetimeSubs: result.data.lifetime.lifetimeSubs,
					subsTrend: result.data.trends.subsTrend,
					chartData: result.data.chartData.map((item: any) => ({
						date: new Date(item.date),
						views: item.views,
						clicks: item.clicks,
						ctr: item.ctr
					}))
				};
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			console.error('Analytics fetch error:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchAnalyticsData();
		console.log(analyticsData);
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

<section class="flex w-full flex-col px-12">
	<div class="flex flex-col gap-4 rounded-lg ">
		<div>
			<h2 class="text-2xl font-semibold">Lifetime analytics</h2>
			<p class="text-muted-foreground">Overview of your all-time performance.</p>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#snippet analyticsCard(title: string, Icon: any = Rows, data: any = 8888, trend: any = 0.2)}
				{@const trendDetails = getTrendDetails(trend)}
				<div class="flex flex-col rounded-3xl border p-4">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-sm font-medium text-muted-foreground">{title}</span>
						<Icon class="h-4 w-4 text-muted-foreground" />
					</div>
					{#if data}
						<div class="text-2xl font-bold">{formatNumber(data)}</div>
						{#if trendDetails.text}
							<p class="mt-1 flex items-center gap-1 text-xs {trendDetails.color}">
								{#if trendDetails.icon}
									<trendDetails.icon class="h-3 w-3" />
								{/if}
								{trendDetails.text} vs last period
							</p>
						{:else}
							<p class="mt-1 text-xs text-muted-foreground"></p>
						{/if}
					{:else}
						<div class="text-2xl font-bold">N/A</div>
						<p class="mt-1 text-xs text-muted-foreground"></p>
					{/if}
				</div>
			{/snippet}

			{@render analyticsCard(
				'Clicks',
				Rows,
				analyticsData?.lifetimeClicks ?? 0,
				analyticsData?.clicksTrend ?? 0
			)}
			{@render analyticsCard(
				'CTR',
				Rows,
				analyticsData?.lifetimeCtr ?? 0,
				analyticsData?.ctrTrend ?? 0
			)}
			{@render analyticsCard(
				'Views',
				Rows,
				analyticsData?.lifetimeViews ?? 0,
				analyticsData?.viewsTrend ?? 0
			)}
			{@render analyticsCard(
				'Subs',
				Rows,
				analyticsData?.lifetimeSubs ?? 0,
				analyticsData?.subsTrend ?? 0
			)}
		</div>
	</div>
	<div class="mt-4 flex w-full flex-col gap-4">
		{#if loading}
			<div class="flex items-center justify-center py-8">
				<div class="text-center">
					<div
						class="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
					></div>
					<p class="text-muted-foreground">Loading analytics data...</p>
				</div>
			</div>
		{:else if error}
			<div class="flex items-center justify-center py-8">
				<div class="text-center">
					<p class="mb-2 text-red-600">Error loading analytics data</p>
					<p class="text-sm text-muted-foreground">{error}</p>
					<button
						class="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
						onclick={fetchAnalyticsData}
					>
						Retry
					</button>
				</div>
			</div>
		{:else}
			<Analytics data={analyticsData?.chartData || []} />
		{/if}
	</div>
</section>
