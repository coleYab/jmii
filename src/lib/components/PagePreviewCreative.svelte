<script lang="ts">
	import { getWidgetPixelSize, getWidgetConfig } from '$src/utils/widgetRegistry';
	import WidgetRenderer from '$lib/components/base/WidgetRenderer.svelte';
	import UserProfileSection from './UserProfileSection.svelte';
	import { BOARD_CONFIG, getResponsiveCellDimensions } from '$src/stores/board/board.config';
	import { innerWidth } from 'svelte/reactivity/window';

	interface IPagePreviewCreativeProps {
		profileData: any;
		focusOn: 'profile' | 'cover' | 'widgets';
	}

	let { profileData, focusOn }: IPagePreviewCreativeProps = $props();

	// Board dimensions for preview
	const rows = 3;
	const columns = 2;

	// Cell dimensions for the preview (responsive based on viewport)
	let cellDimensions = $derived.by(() => {
		const viewportWidth = innerWidth.current || 1024; // Fallback to tablet size
		const responsive = getResponsiveCellDimensions(viewportWidth);
		return {
			width: responsive.CELL_WIDTH,
			height: responsive.CELL_HEIGHT,
			gap: responsive.CELL_GAP
		};
	});

	// Create preset widgets for the preview
	let presetWidgets = $derived.by(() => {
		return [
			{
				id: 'preview-calendar',
				type: 'Calendar',
				size: { width: 1, height: 2 },
				anchorRow: 0,
				anchorCol: 0,
				specificProps: getWidgetConfig('Calendar').defaultProps,
				draggable: false
			},
			{
				id: 'preview-media',
				type: 'Media',
				size: { width: 1, height: 1 },
				anchorRow: 0,
				anchorCol: 1,
				specificProps: { ...getWidgetConfig('Media').defaultProps, src: profileData.image },
				draggable: false
			},
			{
				id: 'preview-button',
				type: 'Button',
				size: { width: 1, height: 1 },
				anchorRow: 1,
				anchorCol: 1,
				specificProps: { ...getWidgetConfig('Button').defaultProps, href: profileData.url },
				draggable: false
			},
			{
				id: 'preview-color',
				type: 'Color',
				size: { width: 2, height: 1 },
				anchorRow: 2,
				anchorCol: 0,
				specificProps: { ...getWidgetConfig('Color').defaultProps, color: '#10b981' },
				draggable: false
			}
		];
	});

	// Calculate board dimensions for preview (same formula as Board.svelte)
	let boardWidth = $derived(
		columns * (cellDimensions.width + cellDimensions.gap) - cellDimensions.gap
	);
	let boardHeight = $derived(
		rows * (cellDimensions.height + cellDimensions.gap) - cellDimensions.gap
	);
</script>

<div class="flex flex-col items-center justify-center bg-background p-2 pt-4">
	<!-- Creative Mode - Full Size Board -->
	<!-- Enhanced User Profile Section (similar to Classic style) -->
	<UserProfileSection {profileData} mode="creative" {boardWidth} {cellDimensions} />

	<!-- Creative Board Preview with Real Widgets at Full Size -->
	<div class="relative flex justify-center w-full">
		<div
			class="relative rounded-lg bg-muted/20"
			style="width: {boardWidth + 16}px; height: {boardHeight + 16}px;"
		>
			{#each presetWidgets as widget (widget.id)}
				<div
					class="absolute"
					style="
			transform: translateX({(cellDimensions.width + cellDimensions.gap) * widget.anchorCol +
						8}px) translateY({(cellDimensions.height + cellDimensions.gap) * widget.anchorRow +
						8}px);
					"
				>
					<WidgetRenderer {...widget} locked={true} initialSpecificProps={widget.specificProps} />
				</div>
			{/each}
		</div>
	</div>
</div>
