<script lang="ts">
	import { scale } from 'svelte/transition';
	import type { WidgetProps } from '$src/types/widgets';
	import WidgetRenderer from '$lib/components/base/WidgetRenderer.svelte';
	import { quintInOut, quintOut } from 'svelte/easing';

	interface Props {
		widget: WidgetProps;
		isMobile: boolean;
		cellDimensions: {
			width: number;
			height: number;
			gap: number;
		};
		isPublicView: boolean;
		editingWidgetId: string | null;
		draggingWidgetId: string | null;
		targetCol: number;
		saveSuccess: boolean;
		boardElement?: HTMLElement | null;
		rows?: number;
		columns?: number;
	}

	let {
		widget,
		isMobile,
		cellDimensions,
		isPublicView,
		editingWidgetId,
		draggingWidgetId,
		targetCol,
		saveSuccess,
		boardElement = null,
		rows = 10,
		columns = 4
	}: Props = $props();

	function getTilt(horizontalDiff: number): string {
		if (isPublicView || draggingWidgetId !== widget.id) return '0deg';
		if (horizontalDiff > 0) {
			return '3deg';
		} else if (horizontalDiff < 0) {
			return '-3deg';
		}
		return '0deg';
	}

	let left = $derived(
		(cellDimensions.width + cellDimensions.gap) * 
		(isMobile ? widget.layouts.mobile.anchorCol : widget.layouts.desktop.anchorCol)
	);
	let top = $derived(
		(cellDimensions.height + cellDimensions.gap) * 
		(isMobile ? widget.layouts.mobile.anchorRow : widget.layouts.desktop.anchorRow)
	);

	let rotation = $derived(getTilt(targetCol - (isMobile ? widget.layouts.mobile.anchorCol : widget.layouts.desktop.anchorCol)));

	let scaleFactor = $derived(draggingWidgetId === widget.id ? '1.05' : '1');
	let translateY = $derived(draggingWidgetId === widget.id ? '-0.5rem' : '0px');
</script>

<!-- Empua ass widget transitions  -->
<div
	in:scale={{
		duration: 500,
		start: 0.8,
		delay:
			widget.layouts[isMobile ? 'mobile' : 'desktop'].anchorRow * 100 +
			widget.layouts[isMobile ? 'mobile' : 'desktop'].anchorCol * 100,
		easing: quintInOut
	}}
	out:scale={{ duration: 300, start: 0.9, easing: quintOut }}
	class="absolute 
	{draggingWidgetId === widget.id ? 'shadow-lg' : ''}
	{saveSuccess ? 'save-success' : ''}"
	style=" 
    transform: translateX({left}px) translateY({top}px) translateY({translateY}) rotate({rotation}) scale({scaleFactor});
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: {editingWidgetId === widget.id ? '110' : '0'};
    transform-origin: center;
    "
>
	<WidgetRenderer
		{...widget}
		{isMobile}
		{boardElement}
		{rows}
		{columns}
		size={isMobile ? widget.layouts.mobile.size : widget.layouts.desktop.size}
		on:startedDrag
		on:endedDrag
		on:resize
		on:edit
		on:delete
		locked={isPublicView}
		initialSpecificProps={widget.specificProps}
	/>
</div>

<style lang="postcss">
	.save-success {
		animation: saveOutline 1s ease-in-out;
		outline-offset: 2px;
		border-radius: 0.5rem;
	}

	@keyframes saveOutline {
		0% {
			outline: 1px solid transparent;
		}
		50% {
			outline: 1px solid theme(colors.green.900);
		}
		100% {
			outline: 1px solid transparent;
		}
	}
</style>
