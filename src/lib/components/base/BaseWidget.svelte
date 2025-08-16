<script lang="ts">
	import { getWidgetPixelSize } from '$src/utils/widgetRegistry';
	import { getEmptyDragImage } from '$src/utils/dragUtils';
	import { page } from '$app/state';
	import {
		devicePixelRatio,
		innerHeight,
		innerWidth,
		online,
		outerHeight,
		outerWidth,
		screenLeft,
		screenTop,
		scrollX,
		scrollY
	} from 'svelte/reactivity/window';

	interface Props {
		size: { width: number; height: number };
		type: string;
		onclick?: () => void;
		onHover?: () => void;
		children?: import('svelte').Snippet;
	}

	let { size, type, children, onclick = () => {}, onHover = () => {} }: Props = $props();

	const grab = page.url.pathname == '/';

	let isMobile: boolean = $derived(!!(innerWidth.current && innerWidth.current < 768));

	const sizing = $derived.by(() => {
		// Use responsive sizing based on viewport width instead of just mobile/desktop
		const viewportWidth = innerWidth.current || 1024; // Fallback to tablet size
		return getWidgetPixelSize(size.width, size.height, viewportWidth);
	});

	const dragStartHandler = (e: DragEvent) => {
		if (!e.dataTransfer) return;

		// User started to drag the widget , set the basic widgetness data and then the
		// layout and sizing can be default
		const data = {
			type,
			layouts: {
				desktop: {
					// Attempt to go to the top right corner of the board
					anchorRow: 0,
					anchorCol: 0,
					size: size // Take the default size of the widget
				},
				mobile: {
					// Attempt to go to the top right corner of the board
					anchorRow: 0,
					anchorCol: 0,
					size: size // Take the default size of the widget
				}
			}
		};

		console.log('BaseWidget:: dragStartHandler', data);

		e.dataTransfer.dropEffect = 'move';
		e.dataTransfer.setData('application/json', JSON.stringify(data));
		e.dataTransfer.setDragImage(getEmptyDragImage(), 0, 0);
	};

	// Check if there's a meaningful onclick handler
	const hasClickHandler = $derived(onclick.toString() !== '() => {}');
</script>

<!-- 
	This widget sets the base fixed sizes 
	that all widgets are supposed to adhere to 
	-->

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_mouse_events_have_key_events -->

<div
	ondragstart={dragStartHandler}
	{onclick}
	onmouseover={onHover}
	draggable="true"
	role="button"
	tabindex="-1"
	style="width: {sizing.width}px; height: {sizing.height}px; border-radius: {sizing.radius}px;"
	class="font-lexend flex h-full
		{grab ? 'cursor-grab' : 'cursor-default'} 
		flex-col overflow-clip rounded-lg border border-primary/30 text-sm shadow-lg
		transition-all duration-300
		hover:border-primary"
>
	{#if children}{@render children()}{:else}
		Base Widget (Size: {size.width}x{size.height})
	{/if}
</div>
