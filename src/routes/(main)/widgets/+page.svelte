<script lang="ts">
	import type { WidgetConfig, WidgetSize } from '$src/types/widgets';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { browser } from '$app/environment';
	import { getWidgetComponent, getWidgetConfig, getAllWidgets } from '$src/utils/widgetRegistry';
	import WidgetRenderer from '$lib/components/base/WidgetRenderer.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	const widgets = getAllWidgets();

	let selectedWidget = $state(widgets[0] || '');
	let widgetId: string = crypto.randomUUID();

	let WidgetComponent = $derived(selectedWidget ? getWidgetComponent(selectedWidget.type) : null);
	let widgetConfig: WidgetConfig = $derived(getWidgetConfig(selectedWidget.type));

	let isSpecificLayout = $derived(
		widgetConfig &&
			widgetConfig.sizes &&
			widgetConfig.sizes.length === 4 &&
			widgetConfig.sizes.some((s: WidgetSize) => s.width === 1 && s.height === 1) &&
			widgetConfig.sizes.some((s: WidgetSize) => s.width === 1 && s.height === 2) &&
			widgetConfig.sizes.some((s: WidgetSize) => s.width === 2 && s.height === 1) &&
			widgetConfig.sizes.some((s: WidgetSize) => s.width === 2 && s.height === 2)
	);

	function selectWidget(widget: { type: string; previewIcon: any }) {
		selectedWidget = widget;
		localStorage.setItem('lastSelectedWidget', widget.type);
	}

	onMount(() => {
		let lastSelectedWidget = localStorage.getItem('lastSelectedWidget');
		if (lastSelectedWidget && widgets.some((w) => w.type === lastSelectedWidget)) {
			selectedWidget = widgets.find((w) => w.type === lastSelectedWidget) ?? widgets[0];
		}
	});
</script>

<div class="flex flex-col items-center justify-center gap-4 py-12">
	<div class="flex flex-col items-center justify-center gap-4">
		<div class="flex flex-wrap justify-center gap-4">
			<ScrollArea class=" whitespace-nowrap rounded-md border" orientation="horizontal">
				<div class="flex max-w-xl space-x-4 p-4">
					{#each widgets as widget, index}
						{#if browser}
							<button
								transition:slide={{ delay: index * 50 }}
								onclick={() => selectWidget(widget)}
								class="flex flex-row items-center gap-2 rounded-md border border-transparent px-4 py-2 text-stone-800 transition-all {selectedWidget.type ===
								widget.type
									? 'bg-primary text-white '
									: 'text-stone-600  hover:border-primary'}"
							>
								<widget.previewIcon />
								{widget.type}
							</button>
						{/if}
					{/each}
				</div>
			</ScrollArea>
		</div>
	</div>

	<div class="mx-auto flex h-full w-full max-w-4xl items-center justify-center p-4">
		{#if WidgetComponent && selectedWidget}
			{#key widgetConfig}
				{#if isSpecificLayout && widgetConfig}
					<div class="grid h-full w-full p-2 gap-4 grid-cols-3 rounded-lg border ">
						<div class="rounded-lg bg-sidebar shadow p-4 flex items-center justify-center h-full w-full">
							<WidgetRenderer
								on:update={(event) => {
									widgetConfig.defaultProps = event.detail.specificProps ?? {};
								}}
								id={widgetId}
								type={selectedWidget.type}
								size={{ width: 1, height: 1 }}
								initialSpecificProps={widgetConfig.defaultProps}
							/>
						</div>

						<div class="col-span-2 rounded-lg bg-sidebar shadow p-4 flex items-center justify-center h-full w-full">
							<WidgetRenderer
								on:update={(event) => {
									widgetConfig.defaultProps = event.detail.specificProps ?? {};
								}}
								id={widgetId}
								type={selectedWidget.type}
								size={{ width: 2, height: 1 }}
								initialSpecificProps={widgetConfig.defaultProps}
							/>
						</div>

						<div class="row-span-2 rounded-lg bg-sidebar shadow p-4 flex items-center justify-center h-full w-full">
							<WidgetRenderer
								on:update={(event) => {
									widgetConfig.defaultProps = event.detail.specificProps ?? {};
								}}
								id={widgetId}
								type={selectedWidget.type}
								size={{ width: 1, height: 2 }}
								initialSpecificProps={widgetConfig.defaultProps}
							/>
						</div>

						<div class="col-span-2 row-span-2 rounded-lg bg-sidebar shadow p-4 flex items-center justify-center h-full w-full">
							<WidgetRenderer
								on:update={(event) => {
									widgetConfig.defaultProps = event.detail.specificProps ?? {};
								}}
								id={widgetId}
								type={selectedWidget.type}
								size={{ width: 2, height: 2 }}
								initialSpecificProps={widgetConfig.defaultProps}
							/>
						</div>
					</div>
				{:else}
					<div class="grid h-full w-full grid-cols-4 gap-4 rounded-lg p-4">
						{#each widgetConfig.sizes as size}
							<div
								class="rounded-lg bg-sidebar shadow p-4 flex items-center justify-center h-full w-full"
								style="grid-column: span {size.width}; grid-row: span {size.height};"
							>
								<WidgetRenderer
									id={widgetId}
									type={selectedWidget.type}
									{size}
									initialSpecificProps={widgetConfig.defaultProps}
								/>
							</div>
						{/each}
					</div>
				{/if}
			{/key}
		{:else}
			<p>Select a widget to display</p>
		{/if}
	</div>
</div>
