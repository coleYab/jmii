<script lang="ts">
	import type { WidgetProps } from '$src/types/widgets';
	import { createEventDispatcher } from 'svelte';
	import { drawerStore } from '$src/stores/drawerStore';
	import { blur, slide } from 'svelte/transition';
	import { getWidgetConfig } from '$src/utils/widgetRegistry';
	import { fade } from 'svelte/transition';
	import FileUploadField from './widgetEditor/FileUploadField.svelte';
	import BooleanField from './widgetEditor/BooleanField.svelte';
	import SelectField from './widgetEditor/SelectField.svelte';
	import NumberField from './widgetEditor/NumberField.svelte';
	import TextField from './widgetEditor/TextField.svelte';
	import ColorField from './widgetEditor/ColorField.svelte';
	import { quintOut } from 'svelte/easing';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { innerWidth } from 'svelte/reactivity/window';
	import * as Drawer from '$lib/components/ui/drawer/index.js';

	interface Props {
		widget: Pick<WidgetProps, 'id' | 'type' | 'layouts' | 'specificProps'> | null;
		show: boolean;
	}

	let isMobile = $derived(innerWidth.current && innerWidth.current < 768);
	let { widget, show }: Props = $props();

	const dispatch = createEventDispatcher();
	console.log('widget', widget);

	// Get the widget's default props type from the registry
	let widgetDefaultProps = $derived(() => {
		if (!widget) return {};
		const config = getWidgetConfig(widget.type);
		console.log(config);
		return config.defaultProps;
	});

	$effect(() => {
		if (widget) {
			editedProps = { ...widget.specificProps };
		}
	});

	let editedProps = $state({});
	let isUploading = $state(false);

	function handleChange() {
		dispatch('save', { specificProps: editedProps });
	}
	// Helper function to match the labels into some know words
	function mapKey(key: string) {
		const labelMaps : Record<string, string> = {
			'src': 'Image Link',
			'href': 'Link',
			'altText': 'Alternative Description'
		}

		return labelMaps[key] ?? key;
	}

	function handleSave() {
		dispatch('save', { specificProps: editedProps });
		show = false;
		$drawerStore.show = false;
	}

	// Helper function to determine input type and validation based on default prop type
	function getInputConfig(key: string, value: any) {
		if (!widget) return { type: 'text' };

		const defaultValue = widgetDefaultProps()[key];

		// Check if the prop has options defined
		if (defaultValue && typeof defaultValue === 'object' && 'options' in defaultValue) {
			return {
				type: 'select',
				options: defaultValue.options,
				value: defaultValue.value
			};
		}

		// For non-option props, check their type
		const valueType = typeof (defaultValue?.value ?? defaultValue);

		if (valueType === 'boolean') {
			return { type: 'boolean' };
		}

		if (valueType === 'number') {
			return { type: 'number' };
		}

		// Check if it's a color value (string starting with #)
		if (typeof value === 'string' && value.startsWith('#')) {
			return { type: 'color' };
		}

		return { type: 'text' };
	}
</script>

{#if isMobile}
	<Drawer.Root
		bind:open={show}
		onOpenChange={(open) => {
			$drawerStore.show = open;
		}}
	>
		<Drawer.Content>
			<Drawer.Header>
				<Drawer.Title>Edit {widget?.type} Widget</Drawer.Title>
				<Drawer.Description>{widget?.id} |</Drawer.Description>
			</Drawer.Header>

			<div class="flex-1 overflow-y-auto p-6">
				{#if 'file' in editedProps && editedProps.file && typeof editedProps.file === 'object' && 'accept' in editedProps.file && 'url' in editedProps.file && Array.isArray(editedProps.file.accept)}
					<FileUploadField
						file={{
							accept: (editedProps as { file: { accept: string[]; url: string } }).file.accept,
							url: (editedProps as { file: { accept: string[]; url: string } }).file.url
						}}
						on:change={({ detail }) => {
							const props = editedProps as { file: { accept: string[]; url: string } };
							if (props.file) {
								props.file.url = detail.url;
								handleChange();
							}
						}}
					/>
				{/if}
				{#each Object.entries(editedProps as Record<string, unknown>) as [key, value], i}
					{@const inputConfig = getInputConfig(key, value)}
					<div class="mb-4" in:fade={{ delay: 200 * i, duration: 200 }}>
						{#if inputConfig.type === 'boolean'}
							<BooleanField
								id={key}
								label={mapKey(key)}
								bind:value={editedProps[key as keyof typeof editedProps]}
								on:change={handleChange}
							/>
						{:else if inputConfig.type === 'select'}
							<SelectField
								id={key}
								label={mapKey(key)}
								options={inputConfig.options}
								value={(editedProps[key as keyof typeof editedProps] as { value: string }).value}
								on:change={handleChange}
							/>
						{:else if inputConfig.type === 'number'}
							<NumberField
								id={key}
								label={mapKey(key)}
								bind:value={editedProps[key as keyof typeof editedProps]}
								on:change={handleChange}
							/>
						{:else if inputConfig.type === 'color'}
							<ColorField
								id={key}
								label={mapKey(key)}
								bind:value={editedProps[key as keyof typeof editedProps]}
								on:change={handleChange}
							/>
						{:else if key !== 'file'}
							<TextField
								id={key}
								label={mapKey(key)}
								bind:value={editedProps[key as keyof typeof editedProps]}
								on:change={handleChange}
							/>
						{/if}
					</div>
				{/each}
			</div>

			<Drawer.Footer>
				<button
					type="button"
					onclick={handleSave}
					disabled={isUploading}
					class="whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm text-background transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Save Changes
				</button>

				<Sheet.Close>Close</Sheet.Close>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{:else}
	<Sheet.Root
		bind:open={show}
		onOpenChange={(open) => {
			$drawerStore.show = open;
		}}
	>
		<div class="absolute flex h-full flex-col">
			<div class="flex h-full flex-col">
				<Sheet.Content side="right">
					<Sheet.Header>
						<Sheet.Title>Edit {widget?.type} Widget</Sheet.Title>
						<Sheet.Description>{widget?.id} |</Sheet.Description>
					</Sheet.Header>

					<!-- Content -->
					<div class="flex-1 overflow-y-auto p-6">
						{#if 'file' in editedProps && editedProps.file && typeof editedProps.file === 'object' && 'accept' in editedProps.file && 'url' in editedProps.file && Array.isArray(editedProps.file.accept)}
							<FileUploadField
								file={{
									accept: (editedProps as { file: { accept: string[]; url: string } }).file.accept,
									url: (editedProps as { file: { accept: string[]; url: string } }).file.url
								}}
								on:change={({ detail }) => {
									const props = editedProps as { file: { accept: string[]; url: string } };
									if (props.file) {
										props.file.url = detail.url;
										handleChange();
									}
								}}
							/>
						{/if}
						{#each Object.entries(editedProps as Record<string, unknown>) as [key, value], i}
							{@const inputConfig = getInputConfig(key, value)}
							<div class="mb-4" in:fade={{ delay: 200 * i, duration: 200 }}>
								{#if inputConfig.type === 'boolean'}
									<BooleanField
										id={key}
										label={mapKey(key)}
										bind:value={editedProps[key as keyof typeof editedProps]}
										on:change={handleChange}
									/>
								{:else if inputConfig.type === 'select'}
									<SelectField
										id={key}
										label={mapKey(key)}
										options={inputConfig.options}
										value={(editedProps[key as keyof typeof editedProps] as { value: string })
											.value}
										on:change={handleChange}
									/>
								{:else if inputConfig.type === 'number'}
									<NumberField
										id={key}
										label={mapKey(key)}
										bind:value={editedProps[key as keyof typeof editedProps]}
										on:change={handleChange}
									/>
								{:else if inputConfig.type === 'color'}
									<ColorField
										id={key}
										label={mapKey(key)}
										bind:value={editedProps[key as keyof typeof editedProps]}
										on:change={handleChange}
									/>
								{:else if key !== 'file'}
									<TextField
										id={key}
										label={mapKey(key)}
										bind:value={editedProps[key as keyof typeof editedProps]}
										on:change={handleChange}
									/>
								{/if}
							</div>
						{/each}
					</div>
					<Sheet.Footer>
						<button
							type="button"
							onclick={handleSave}
							disabled={isUploading}
							class="whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm text-background transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
						>
							Save Changes
						</button>

						<Sheet.Close>Close</Sheet.Close>
					</Sheet.Footer>
				</Sheet.Content>
			</div>
		</div>
	</Sheet.Root>
{/if}
