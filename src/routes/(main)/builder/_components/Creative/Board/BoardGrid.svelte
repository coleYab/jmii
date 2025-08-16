<script lang="ts">
	import EmptyCell from './EmptyCell.svelte';
	import type { WidgetProps } from '$src/types/widgets';

	interface Props {
		rows: number;
		columns: number;
		cellDimensions: {
			width: number;
			height: number;
			gap: number;
		};
		isPublicView: boolean;
		draggedWidget: WidgetProps | null;
		targetRow: number;
		targetCol: number;
		isValid: boolean;
		board: (WidgetProps | null)[][];
	}

	let {
		rows,
		columns,
		cellDimensions,
		isPublicView,
		draggedWidget,
		targetRow,
		targetCol,
		isValid,
		board
	}: Props = $props();

	let rowsSafe = $derived(Number(rows));
	let columnsSafe = $derived(Number(columns));

	// $inspect(rows, columns);
</script>

<!-- <small class="absolute -top-4 left-0">r{rows}, c{columns}</small> -->
{#key cellDimensions && rowsSafe && columnsSafe}
	<!-- Render empty cells based on client-side constraints (rows x columns) -->
	{#each Array(rowsSafe) as r, i}
		<!-- <div class="flex flex-row border border-red-500" style="height: {cellDimensions.height}px">  -->

		{#each Array(columnsSafe) as c, j}
			<!-- <div class="border border-blue-500" style="width: {cellDimensions.width}px">
				{c},{i}, {j} {Array(columnsSafe).length}
			</div> -->

			{#if !isPublicView && !!!board?.[i]?.[j]}
				{@const top = (cellDimensions.height + cellDimensions.gap) * i}
				{@const left = (cellDimensions.width + cellDimensions.gap) * j}
				<small
					style="
				position: absolute;
				left: {left}px;
				top: {top}px;
				width: {cellDimensions.width}px;
				height: {cellDimensions.height}px;
			">{board?.[i]?.[j]?.id}</small
				>
				<EmptyCell
					{i}
					{j}
					{isValid}
					style="
                        position: absolute;
                        left: {left}px;
                        top: {top}px;
                        width: {cellDimensions.width}px;
                        height: {cellDimensions.height}px;
                    "
					isPartOfDropArea={false}
				/>
			{/if}
		{/each}
		<!-- </div> -->
	{/each}
{/key}
