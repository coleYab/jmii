<script lang="ts">
	import type { WidgetProps } from '$src/types/widgets';
	import { createEventDispatcher } from 'svelte';
	import { boardStore } from '$src/stores/boardStore';
	import { dragStore } from '$src/stores/dragStore';
	import {
		getWidgetComponent,
		getWidgetConfig,
		getWidgetPixelSize
	} from '$src/utils/widgetRegistry';
	import { drawerStore } from '$src/stores/drawerStore';
	import BaseWidgetBar from './BaseWidgetBar.svelte';
	import { getEmptyDragImage } from '$src/utils/dragUtils';
	import { innerWidth } from 'svelte/reactivity/window';

	interface Props {
		id: string;
		locked?: boolean;
		type: string;
		size: { width: number; height: number };
		initialSpecificProps?: Record<string, any>;
		isMobile?: boolean;
		boardElement?: HTMLElement | null;
		rows?: number;
		columns?: number;
	}

	let {
		id,
		locked = false,
		type,
		size,
		initialSpecificProps = getWidgetConfig(type)?.defaultProps ?? {},
		isMobile = false,
		boardElement = null,
		rows = 10,
		columns = 4
	}: Props = $props();

	const dispatch = createEventDispatcher<{
		update: { id: string; specificProps: Record<string, any> };
		resize: { id: string; size: { width: number; height: number } };
		startedDrag: { id: string; data: WidgetProps; e: DragEvent };
		endedDrag: { id: string; e: DragEvent };
		edit: { id: string };
	}>();

	let refreshCount = $state(0);
	let specificProps = $state({ ...initialSpecificProps });
	const WidgetComponent = getWidgetComponent(type);

	// Check if the widget has click functionality
	const hasClickHandler = $derived(() => {
		// For now, we'll check if it's a Button widget type
		// This can be expanded to check other widget types that have click handlers
		return type === 'Button' || (specificProps.href && specificProps.href.length > 0);
	});

	const onBaseWidgetBarDelete = () => {
		if (locked) return;
		console.log('deleting widget with id', id);
		boardStore.removeWidget(id);
	};

	const onDragStart = (e: DragEvent) => {
		if (locked) return;

		const widgetData: WidgetProps = {
			id,
			type,
			layouts: {
				desktop: {
					anchorRow: 0,
					anchorCol: 0,
					size: size
				},
				mobile: {
					anchorRow: 0,
					anchorCol: 0,
					size: size
				}
			},
			specificProps
		};

		console.log('WidgetRenderer:: onDragStart', widgetData);

		$dragStore.widgetData = widgetData;
		$dragStore.isActive = true;

		e.dataTransfer?.setData('application/json', JSON.stringify(widgetData));

		if (e.dataTransfer) {
			e.dataTransfer.setDragImage(getEmptyDragImage(), 0, 0);
		}

		dispatch('startedDrag', { id, data: widgetData, e });
	};

	const onDragEnd = (e: DragEvent) => {
		if (locked) return;
		console.log('WidgetRenderer:: onDragEnd');
		$dragStore.isActive = false;
		$dragStore.widgetData = null;
		dispatch('endedDrag', { id, e });
	};

	const onedit = () => {
		if (locked) return;
		// Create layouts from the size prop and current mobile state
		const layouts = {
			desktop: {
				anchorRow: 0,
				anchorCol: 0,
				size: size
			},
			mobile: {
				anchorRow: 0,
				anchorCol: 0,
				size: size
			}
		};
		$drawerStore.widget = { id, type, specificProps, layouts };
		$drawerStore.show = true;
		dispatch('edit', { id });
		refreshCount++;
	};

	// Subscribe to drawer store changes
	$effect(() => {
		const drawerState = $drawerStore;
		if (drawerState.widget?.id === id) {
			// Get the updated widget from the widgets array
			const widgets = boardStore.getCurrentWidgets();
			const updatedWidget = widgets.find((widget) => widget.id === id);

			if (
				updatedWidget &&
				JSON.stringify(specificProps) !== JSON.stringify(updatedWidget.specificProps)
			) {
				specificProps = { ...updatedWidget.specificProps };
			}
		}
	});
</script>

{#key refreshCount}
	<div
		class="text-md relative flex h-full flex-col items-center justify-center rounded-xl bg-background transition-all
		{$dragStore.isSelected === id && isMobile ? 'border-2 border-primary' : ''} border border-primary"
		draggable="true"
		role="button"
		tabindex="-1"
		ondragstart={onDragStart}
		ondragend={onDragEnd}
	>
		<BaseWidgetBar
			{id}
			{locked}
			{type}
			{onedit}
			{boardElement}
			{rows}
			{columns}
			{isMobile}
			onduplicate={() => boardStore.duplicateWidget(id, false)}
			currentSize={size}
			hasClickHandler={hasClickHandler()}
			ondelete={onBaseWidgetBarDelete}
			onrefresh={() => refreshCount++}
			onresize={(size) => {
				dispatch('resize', { id, size });
				if (boardStore) boardStore.resizeWidget(id, size, isMobile);
			}}
		>
			{#if WidgetComponent}
				<WidgetComponent {size} {specificProps} />
			{:else}
				<div
					class="text-md relative flex h-full flex-col items-center justify-center rounded-xl border border-primary bg-background transition-all"
					style="width: {getWidgetPixelSize(size.width, size.height, innerWidth.current || 1024)
						.width}px; height: {getWidgetPixelSize(
						size.width,
						size.height,
						innerWidth.current || 1024
					).height}px;"
				>
					This widget type is not supported: {type}
				</div>
			{/if}
		</BaseWidgetBar>
	</div>
{/key}
