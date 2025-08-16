<script lang="ts">
	import * as d3 from 'd3';
	import { onMount } from 'svelte'; // Use onMount for initial setup if needed, $effect for reactive updates

	// --- Component Props Interface --- //
	export interface TimeSeriesMetric {
		key: string; // Key in the data object
		label: string; // Label for the legend/tooltip
		color: string; // Color for the line/indicators
		formatValue?: (value: number | null) => string; // Optional custom formatter
	}

	export interface TimeSeriesDataPoint {
		date: Date;
		[key: string]: any; // Allow any other data properties
	}

	interface Props {
		data: TimeSeriesDataPoint[];
		metrics: TimeSeriesMetric[];
		marginTop?: number;
		marginRight?: number;
		marginBottom?: number;
		marginLeft?: number;
		height?: number;
		curve?: d3.CurveFactory; // Optional curve type
	}

	// --- Component State & Props Setup --- //
	let {
		data,
		metrics,
		marginTop = 20,
		marginRight = 20,
		marginBottom = 30,
		marginLeft = 40,
		height = 400,
		curve = d3.curveMonotoneX // Default curve
	}: Props = $props();

	let containerEl = $state<HTMLDivElement | undefined>(undefined); // Bind to the container div
	let width = $state<number | undefined>(undefined); // Width derived from container
	let gx = $state<SVGGElement | undefined>(undefined);
	let gy = $state<SVGGElement | undefined>(undefined);

	// --- Internal Processed Data Type --- //
	// Add change properties for each metric dynamically
	type ProcessedDataPoint = TimeSeriesDataPoint & {
		[changeKey: string]: number | null; // e.g., clicksChange, viewsChange
	};

	// --- Scales, Generators, Processed Data (State variables, updated by $effect) --- //
	let x: d3.ScaleTime<number, number> | undefined = $state(undefined);
	let y: d3.ScaleLinear<number, number> | undefined = $state(undefined);
	let lineGenerators: { [key: string]: d3.Line<ProcessedDataPoint> } = $state({});
	let processedDataForTemplate: ProcessedDataPoint[] = $state([]);

	// --- Tooltip State --- //
	let tooltipVisible = $state(false);
	let tooltipLeft = $state(0);
	let tooltipTop = $state(0);
	let tooltipContent = $state<{ date: string; values: { label: string; value: string; change: string; color: string }[] } | null>(null);
	let tooltipOffsetX = $state(0);
	let tooltipOffsetY = $state(0);
	let hoveredDataPoint = $state<ProcessedDataPoint | null>(null);

	// --- Colors & Config --- //
	const increaseColor = '#27ae60';
	const decreaseColor = 'tomato';
	const gridColor = 'lightgray';
	const axisColor = 'gray';
	const tooltipBackgroundColor = 'white';
	const tooltipBorderColor = '#ccc';

	// --- Bisector --- //
	const bisectDate = d3.bisector<ProcessedDataPoint, Date>((d) => d.date).center;

	// --- Default Formatters --- //
	function defaultFormatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			timeZone: 'UTC'
		});
	}
	function defaultFormatNumber(value: number | null): string {
		return value?.toLocaleString('en-US') ?? 'N/A';
	}
	function defaultFormatChange(value: number | null): string {
		if (value === null || value === undefined) return '(N/A)';
		const sign = value > 0 ? '+' : ''; // Negative sign is automatic
		return `(${sign}${value.toLocaleString('en-US')})`;
	}

	// --- Calculation and Drawing Effect --- //
	$effect(() => {
		if (containerEl) {
			// Use ResizeObserver to react to container size changes
			const resizeObserver = new ResizeObserver(entries => {
				if (entries[0]) {
					width = entries[0].contentRect.width;
				}
			});
			resizeObserver.observe(containerEl);

			// Cleanup observer on component unmount or container change
			return () => resizeObserver.disconnect();
		}
	});


	$effect(() => {
		if (width !== undefined && width > 0 && data && data.length > 0 && metrics && metrics.length > 0) {
			// --- Calculate Processed Data (including change values) ---
			const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
			const localProcessedData: ProcessedDataPoint[] = sortedData.map((d, i, arr) => {
				const processed: ProcessedDataPoint = { ...d };
				if (i === 0) {
					metrics.forEach(m => {
						processed[`${m.key}Change`] = null;
					});
				} else {
					const prev = arr[i - 1];
					metrics.forEach(m => {
						const currentVal = d[m.key] as number | null | undefined;
						const prevVal = prev[m.key] as number | null | undefined;
						if (typeof currentVal === 'number' && typeof prevVal === 'number') {
							processed[`${m.key}Change`] = currentVal - prevVal;
						} else {
							processed[`${m.key}Change`] = null;
						}
					});
				}
				return processed;
			});
			processedDataForTemplate = localProcessedData;

			// --- Calculate Scales ---
			const allMetricValues = localProcessedData.flatMap(d => metrics.map(m => d[m.key] as number | null | undefined)).filter(v => typeof v === 'number') as number[];

			const xScale = d3
				.scaleTime()
				.domain(d3.extent(localProcessedData, (d) => d.date) as [Date, Date])
				.range([marginLeft, width - marginRight]);

			const yScale = d3
				.scaleLinear()
				.domain([
					Math.min(0, d3.min(allMetricValues) ?? 0) - 1, // Add padding, ensure 0 is included if all positive
					(d3.max(allMetricValues) ?? 1) + 1 // Add padding
				])
				.range([height - marginBottom, marginTop])
				.nice();

			x = xScale;
			y = yScale;

			// --- Update Line Generators ---
			const newGenerators: { [key: string]: d3.Line<ProcessedDataPoint> } = {};
			metrics.forEach(m => {
				newGenerators[m.key] = d3
					.line<ProcessedDataPoint>()
					.defined(d => d[m.key] != null && !isNaN(d[m.key])) // Handle missing/invalid data points
					.x((d) => xScale(d.date))
					.y((d) => yScale(d[m.key]))
					.curve(curve);
			});
			lineGenerators = newGenerators;

			// --- Draw Axes ---
			if (gx && gy) {
				const xAxis = d3
					.axisBottom(xScale)
					// .ticks(width / 80) // Adjust number of ticks based on width
					.tickValues(localProcessedData.map((d) => d.date)) // Show tick for each data point's date
					.tickFormat(
						d3.timeFormat('%a %d') as (
							domainValue: Date | { valueOf(): number },
							index: number
						) => string
					)
					.tickSizeOuter(0);

				const yAxis = d3.axisLeft(yScale).ticks(height / 40); // Adjust based on height

				d3.select(gx).call(xAxis);
				d3.select(gy).call(yAxis);

                // Remove default axis lines if desired
				d3.select(gx).select('.domain').remove();
				d3.select(gy).select('.domain').remove();
                 // Style ticks
                d3.select(gx).selectAll('.tick line').attr('stroke', gridColor).attr('stroke-opacity', 0); // Hide x tick lines if using grid
                d3.select(gy).selectAll('.tick line').attr('stroke', gridColor).attr('stroke-opacity', 0.7);
                d3.select(gx).selectAll('.tick text').attr('fill', axisColor);
                d3.select(gy).selectAll('.tick text').attr('fill', axisColor);
			}
		} else {
			// Reset state if dependencies not ready
			x = undefined;
			y = undefined;
			lineGenerators = {};
			processedDataForTemplate = [];
		}
	});

	// --- Tooltip Event Handlers --- //
	function pointermoved(event: PointerEvent) {
		if (
			!x ||
			!y ||
			!processedDataForTemplate ||
			processedDataForTemplate.length === 0 ||
			width === undefined
		)
			return;

		const [pointerX] = d3.pointer(event);
		if (pointerX < marginLeft || pointerX > width - marginRight) {
			pointerleft(); // Hide tooltip if pointer is outside chart bounds
			return;
		}
		const date = x.invert(pointerX);
		const i = bisectDate(processedDataForTemplate, date, 1);
		const d0 = processedDataForTemplate[i - 1];
		const d1 = processedDataForTemplate[i];

		// Check if d0 or d1 exists before accessing properties
		if (!d0) return; // Can't determine closest point if no points exist before index i

        // Choose the closer point
        const d = d1 && date.getTime() - d0.date.getTime() > d1.date.getTime() - date.getTime() ? d1 : d0;

		// --- Calculate Target Position & Estimate Dimensions ---
		const targetX = x(d.date);
		// Find the y position of the highest metric at this date for tooltip anchor
		const targetY = Math.min(...metrics.map(m => y!(d[m.key])).filter(v => !isNaN(v)));

		const estTooltipWidth = 150; // Rough estimate
		const estTooltipHeight = 30 + metrics.length * 18; // Estimate based on number of metrics
		const paddingAbove = 10;
		const paddingBelow = 10;


		// --- Vertical Offset Calculation ---
		let currentOffsetY = -(estTooltipHeight + paddingAbove); // Default above
		const tooltipTopEdgeIfAbove = targetY + currentOffsetY;
		if (tooltipTopEdgeIfAbove < marginTop) {
			currentOffsetY = paddingBelow; // Flip below
		}
		// TODO: Add check to prevent overflowing bottom edge?

		// --- Horizontal Offset Calculation ---
		let currentOffsetX = 0;
		const estTooltipHalfWidth = estTooltipWidth / 2;
		currentOffsetX = -estTooltipHalfWidth; // Default center

		const tooltipLeftEdge = targetX + currentOffsetX;
		const tooltipRightEdge = targetX + currentOffsetX + estTooltipWidth;

		if (tooltipLeftEdge < marginLeft) {
			currentOffsetX += marginLeft - tooltipLeftEdge; // Adjust right
		} else if (tooltipRightEdge > width - marginRight) {
			currentOffsetX -= tooltipRightEdge - (width - marginRight); // Adjust left
		}

		// Update Tooltip State & Hovered Point
		hoveredDataPoint = d;
		tooltipLeft = targetX;
		tooltipTop = targetY; // Use the highest point as vertical anchor
		tooltipOffsetX = currentOffsetX;
		tooltipOffsetY = currentOffsetY;
		tooltipVisible = true;
		tooltipContent = {
			date: defaultFormatDate(d.date),
			values: metrics.map(m => ({
				label: m.label,
				value: (m.formatValue || defaultFormatNumber)(d[m.key]),
				change: defaultFormatChange(d[`${m.key}Change`]),
                color: m.color
			}))
		};
	}

	function pointerleft() {
		tooltipVisible = false;
		hoveredDataPoint = null;
	}

</script>

<div
	class="timeseries-chart-container relative w-full"
	bind:this={containerEl}
	style="min-height: {height}px;"
>
	<!-- Legend (Optional) -->
	<div class="chart-legend flex flex-wrap justify-center gap-x-4 gap-y-1 pb-2 text-sm">
		{#each metrics as metric}
			<div class="flex items-center gap-1.5">
				<span class="h-2.5 w-2.5 rounded-full" style="background-color: {metric.color};"></span>
				<span>{metric.label}</span>
			</div>
		{/each}
	</div>

	<!-- SVG Container -->
	<div class="relative">
		{#if width && width > 0 && x && y && processedDataForTemplate.length > 0}
			<svg
				{width}
				{height}
				style="display: block; overflow: visible; -webkit-tap-highlight-color: transparent;"
				onpointermove={pointermoved}
				onpointerleave={pointerleft}
				ontouchstart={(event) => event.preventDefault()} >

				<!-- Axes placeholders -->
				<g class="axis axis-x" bind:this={gx} transform="translate(0,{height - marginBottom})"></g>
				<g class="axis axis-y" bind:this={gy} transform="translate({marginLeft},0)"></g>

				<!-- Grid Lines (Optional: can use axis ticks) -->
				<g class="grid-lines">
					<!-- Vertical grid lines (aligned with X axis ticks) -->
					{#if gx}
						{#each x.ticks(width / 80) as tickValue}
							<line
								class="grid-line vertical"
								x1={x(tickValue)} y1={marginTop}
								x2={x(tickValue)} y2={height - marginBottom}
								stroke={gridColor} stroke-opacity="0.7" stroke-dasharray="2,2"
							></line>
						{/each}
					{/if}
					<!-- Horizontal grid lines (aligned with Y axis ticks) -->
					{#if gy}
						{#each y.ticks(height / 40) as tickValue}
                             {#if tickValue !== 0}
								<line
									class="grid-line horizontal"
									x1={marginLeft} y1={y(tickValue)}
									x2={width - marginRight} y2={y(tickValue)}
									stroke={gridColor} stroke-opacity="0.7" stroke-dasharray="2,2"
								></line>
                             {/if}
						{/each}
					{/if}
				</g>

				<!-- Lines for each metric -->
				{#each metrics as metric (metric.key)}
					{#if lineGenerators[metric.key]}
						<path
							class="metric-line"
							fill="none"
							stroke={metric.color}
							stroke-width="1.5"
							stroke-linejoin="round"
							stroke-linecap="round"
							d={lineGenerators[metric.key](processedDataForTemplate)}
						/>
					{/if}
				{/each}

				<!-- Change Indicators for each metric -->
				{#each metrics as metric (metric.key)}
					<g class="change-indicators-{metric.key}">
						{#each processedDataForTemplate as d, i}
							{#if x && y && d[metric.key] != null}
								<circle
									class="change-indicator"
									cx={x(d.date)}
									cy={y(d[metric.key])}
									r={hoveredDataPoint?.date === d.date ? 6 : 4}
									fill={i === 0
										? metric.color // Use metric color for the first point
										: d[`${metric.key}Change`] !== null && d[`${metric.key}Change`] >= 0
											? increaseColor
											: decreaseColor}
									stroke={tooltipBackgroundColor}
									stroke-width="0.5"
									pointer-events="none"
								/>
							{/if}
						{/each}
					</g>
				{/each}

                 <!-- Optional: Highlight line/points on hover -->
                 {#if hoveredDataPoint && x}
                    <line class="hover-line"
                        x1={x(hoveredDataPoint.date)} y1={marginTop}
                        x2={x(hoveredDataPoint.date)} y2={height-marginBottom}
                        stroke={axisColor} stroke-width="1" stroke-dasharray="3,3"
                        pointer-events="none"
                    ></line>
                 {/if}

				<!-- Interaction Layer (Transparent Rect) -->
				<rect
                    class="interaction-layer"
					fill="none"
					pointer-events="all"
					x={marginLeft}
					y={marginTop}
					width={Math.max(0, width - marginLeft - marginRight)}
					height={Math.max(0, height - marginTop - marginBottom)}
				/>
			</svg>

			<!-- HTML Tooltip -->
			<div
				class="html-tooltip !bg-background/80 backdrop-blur-sm  "
				style:left="{tooltipLeft + tooltipOffsetX}px"
                style:top="{tooltipTop + tooltipOffsetY}px"
                style:display="{tooltipVisible ? 'block' : 'none'}"
                style:opacity="{tooltipVisible ? 1 : 0}"
			>
				{#if tooltipContent}
					<div class="font-semibold mb-1">{tooltipContent.date}</div>
					{#each tooltipContent.values as val}
						<div  class="text-xs text-muted-foreground">
							{val.label}: {val.value}
							<span class="text-muted-foreground ml-1">{val.change}</span>
						</div>
					{/each}
				{/if}
			</div>
		{:else if !data || data.length === 0}
            <div style="height: {height}px;" class="flex items-center justify-center text-muted-foreground text-sm">
                No data available.
            </div>
        {:else}
			<div style="height: {height}px;" class="flex items-center justify-center text-muted-foreground text-sm">
				Loading chart...
			</div>
		{/if}
	</div>
</div>

<style>
	/* Basic styling, can be customized further */
	:global(.timeseries-chart-container .axis text) {
		font-family: sans-serif;
		font-size: 10px;
        /* fill: defined via JS */
	}
    :global(.timeseries-chart-container .axis path),
	:global(.timeseries-chart-container .axis line) {
        /* stroke: defined via JS */
        shape-rendering: crispEdges;
	}

	.html-tooltip {
		position: absolute;
		pointer-events: none;
		background:  white; /* Use CSS variable for background */
		border: 1px solid  #ccc;
		border-radius: 4px;
		padding: 6px 10px;
		font-size: 12px;
		white-space: nowrap;
		z-index: 10;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
		transition:
			opacity 0.15s ease-out,
			left 0.15s ease-out,
			top 0.15s ease-out;
        /* Use theme variables from app.pcss if available */
        background-color: var(--card);
        color: var(--card-foreground);
        border-color: var(--border);
	}

    /* Ensure container has position relative if not already applied */
    .timeseries-chart-container {
        position: relative;
    }

</style>