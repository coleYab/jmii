<script lang="ts">
	import WidgetRenderer from '$lib/components/base/WidgetRenderer.svelte';
	import { BOARD_CONFIG, getResponsiveCellDimensions } from '$src/stores/board/board.config';
	import { browser } from '$app/environment';
	import { innerWidth } from 'svelte/reactivity/window';
	import { getWidgetPixelSize } from '$src/utils/widgetRegistry';
	import type { WidgetProps } from '$src/types/widgets';

	interface Props {
		widgets: WidgetProps[];
		rows: number;
		columns: number;
		userProfile?: {
			name: string;
			picture: string;
			description: string;
			coverImage: string;
			handle: string;
			links?: {
				url: string;
				platform: string;
				username: string;
				icon: string;
				highlighted?: boolean;
			}[];
		} | null;
		tipsEnabled?: boolean;
		userId?: string;
		tipMeText: string;
		theme?: any;
	}

	let {
		widgets = [],
		rows = 10,
		columns = 5,
		userProfile,
		tipsEnabled = false,
		userId,
		tipMeText,
		theme
	}: Props = $props();

	// Responsive viewport detection
	let isMobileViewport = $state(false);
	let effectiveColumns = $state(columns);

	// Update viewport detection
	$effect(() => {
		if (browser) {
			const mediaQuery = window.matchMedia('(max-width: 1200px)');
			isMobileViewport = mediaQuery.matches;

			// Listen for viewport changes
			const handleViewportChange = (e: MediaQueryListEvent) => {
				isMobileViewport = e.matches;
			};

			mediaQuery.addEventListener('change', handleViewportChange);

			return () => {
				mediaQuery.removeEventListener('change', handleViewportChange);
			};
		}
	});

	// Auto-scale columns based on viewport size
	$effect(() => {
		if (browser) {
			rows = 0;
			for (const widget of widgets) {
				if (isMobileViewport) {
					const { anchorRow, size } = widget.layouts.mobile;
					rows = Math.max(rows, anchorRow + size.height);
				} else {
					const { anchorRow, size } = widget.layouts.desktop;
					rows = Math.max(rows, anchorRow + size.height);
				}
			}
			effectiveColumns = isMobileViewport ? Math.min(columns, 2) : columns;
		}
	});

	let cellDimensions = $derived.by(() => {
		const viewportWidth = innerWidth.current || 1024; // Fallback to tablet size
		const responsive = getResponsiveCellDimensions(viewportWidth);
		return {
			width: responsive.CELL_WIDTH,
			height: responsive.CELL_HEIGHT,
			gap: responsive.CELL_GAP
		};
	});

	// Calculate total board width using effective columns
	const boardWidth = $derived(
		effectiveColumns * (cellDimensions.width + cellDimensions.gap) - cellDimensions.gap
	);
	const minRowHeight = $derived(cellDimensions.height);

	// Transform widgets to have proper positioning with mobile adjustments
	const positionedWidgets = $derived(
		widgets
			.filter((widget: any) => {
				// Get the appropriate layout based on viewport
				let layout;
				if (widget.layouts) {
					// Use the appropriate layout (mobile or desktop)
					layout = isMobileViewport ? widget.layouts.mobile : widget.layouts.desktop;
				} else {
					// Fallback for flattened structure
					layout = {
						anchorRow: widget.anchorRow,
						anchorCol: widget.anchorCol,
						size: widget.size
					};
				}

				// Filter out widgets that would overflow
				if (isMobileViewport && layout.anchorCol + layout.size.width > 2) {
					return false;
				}
				return layout.anchorCol + layout.size.width <= effectiveColumns;
			})
			.map((widget: any) => {
				// Get the appropriate layout based on viewport
				let layout;
				if (widget.layouts) {
					// Use the appropriate layout (mobile or desktop)
					layout = isMobileViewport ? widget.layouts.mobile : widget.layouts.desktop;
				} else {
					// Fallback for flattened structure
					layout = {
						anchorRow: widget.anchorRow,
						anchorCol: widget.anchorCol,
						size: widget.size
					};
				}

				return {
					...widget,
					left: (cellDimensions.width + cellDimensions.gap) * layout.anchorCol,
					top: (cellDimensions.height + cellDimensions.gap) * layout.anchorRow,
					width:
						cellDimensions.width * layout.size.width + cellDimensions.gap * (layout.size.width - 1),
					height:
						cellDimensions.height * layout.size.height +
						cellDimensions.gap * (layout.size.height - 1)
				};
			})
	);
</script>

<div class="relative flex h-full w-full max-w-[100vw] items-center justify-center px-2 pt-12">
	<!-- Board Container with proper centering and max-width constraints -->
	<div
		class="relative flex-shrink max-w-full"
		style="
			height: {minRowHeight * rows}px;
			width: {boardWidth}px;
		"
	>
		<!-- Grid Background (optional visual guide) - now uses effectiveColumns -->
		<div class="absolute inset-0 opacity-10">
			{#each Array(rows) as _, i}
				{#each Array(effectiveColumns) as _, j}
					<div
						class="absolute border border-muted-foreground/20"
						style="
							left: {(cellDimensions.width + cellDimensions.gap) * j}px;
							top: {(cellDimensions.height + cellDimensions.gap) * i}px;
							width: {cellDimensions.width}px;
							height: {cellDimensions.height}px;
						"
					></div>
				{/each}
			{/each}
		</div>

		<!-- Widgets -->
		{#each positionedWidgets as widget (widget.id)}
			{@const layout = isMobileViewport ? widget.layouts?.mobile : widget.layouts?.desktop}
			{@const size = layout?.size || widget.size || { width: 1, height: 1 }}
			<div
				class="absolute transition-all duration-300 ease-in-out"
				style="
					left: {widget.left}px;
					top: {widget.top}px;
					width: {widget.width}px;
					height: {widget.height}px;
				"
			>
				<WidgetRenderer
					id={widget.id}
					type={widget.type}
					{size}
					locked={true}
					initialSpecificProps={widget.specificProps}
					isMobile={isMobileViewport}
				/>
			</div>
		{/each}

		<!-- Empty State -->
		{#if widgets.length === 0}
			<div class="absolute inset-0 flex items-center justify-center">
				<div class="text-center text-muted-foreground">
					<div class="mb-4 text-6xl">🎨</div>
					<h3 class="mb-2 text-xl font-semibold">No widgets yet</h3>
					<p class="max-w-md text-sm">This creative board is empty.</p>
				</div>
			</div>
		{/if}
	</div>
</div>
