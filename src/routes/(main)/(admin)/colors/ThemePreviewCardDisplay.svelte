<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import type { ITheme } from '$src/models/Theme.model';
	import { PencilSimpleLine, Trash, Check, X } from 'phosphor-svelte';
	import { toast } from 'svelte-sonner';
	import ThemePreviewComponents from './ThemePreviewComponents.svelte';

	interface ThemePreviewCardProps {
		data: any;
		theme: ITheme;
		editingTheme: ITheme | null;
		startEdit: () => void;
		deleteTheme: () => void;
		isPreview?: boolean;
		categories?: any[];
		modeOptions?: any[];
	}

	let {
		theme,
		data,
		startEdit,
		deleteTheme,
		isPreview = false,
		editingTheme,
		categories = [],
		modeOptions = []
	}: ThemePreviewCardProps = $props();

	let isEditing = $state(false);
	let loading = $state(false);

	// Helper function to ensure shadow compatibility
	function ensureShadowCompatibility(theme: ITheme) {
		// If theme.shadow is a string (old format), convert to new format
		if (typeof theme.shadow === 'string') {
			return {
				...theme,
				shadow: {
					default: theme.shadow,
					active: '2px 2px 0px 0px #000000',
					hovered: '2px 2px 0px 0px #000000',
					disabled: '1px 1px 0px 0px #cccccc',
					highlighted: '6px 6px 0px 0px #000000'
				}
			};
		}
		// If already in new format, ensure all properties exist
		return {
			...theme,
			shadow: {
				default: theme.shadow.default || '4px 4px 0px 0px #000000',
				active: theme.shadow.active || '2px 2px 0px 0px #000000',
				hovered: theme.shadow.hovered || '2px 2px 0px 0px #000000',
				disabled: theme.shadow.disabled || '1px 1px 0px 0px #cccccc',
				highlighted: theme.shadow.highlighted || '6px 6px 0px 0px #000000'
			}
		};
	}

	// Ensure theme compatibility
	const compatibleTheme = ensureShadowCompatibility(theme);

	// Form data for editing
	let formData = $state({
		name: compatibleTheme.name,
		description: compatibleTheme.description,
		id: compatibleTheme.id,
		background: compatibleTheme.background,
		foreground: compatibleTheme.foreground,
		stroke: compatibleTheme.stroke,
		buttonColor: compatibleTheme.buttonColor,
		buttonBackground: compatibleTheme.buttonBackground,
		shadow: {
			default: compatibleTheme.shadow.default,
			active: compatibleTheme.shadow.active,
			hovered: compatibleTheme.shadow.hovered,
			disabled: compatibleTheme.shadow.disabled,
			highlighted: compatibleTheme.shadow.highlighted
		},
		buttonRounding: compatibleTheme.buttonRounding || 12,
		category: compatibleTheme.category,
		isActive: compatibleTheme.isActive,
		isDefault: compatibleTheme.isDefault,
		metadata: {
			supportedModes: [...compatibleTheme.metadata.supportedModes] as ('both' | 'creative' | 'classic')[],
			previewImage: compatibleTheme.metadata.previewImage,
			tags: [...compatibleTheme.metadata.tags]
		}
	});

	// Create preview theme that updates live
	const previewTheme = $derived(isEditing ? {
		...compatibleTheme,
		...formData,
		_id: compatibleTheme._id,
		createdAt: compatibleTheme.createdAt,
		updatedAt: compatibleTheme.updatedAt,
		usageCount: compatibleTheme.usageCount
	} : compatibleTheme);

	// Derived values for select displays
	const categoryLabel = $derived(
		categories.find((c) => c.value === formData.category)?.label ?? 'Select category'
	);

	const modeLabel = $derived(
		modeOptions.find((m) => m.value === formData.metadata.supportedModes[0])?.label ?? 'Select mode'
	);

	function handleStartEdit() {
		isEditing = true;
		// Reset form data when starting edit
		formData = {
			name: compatibleTheme.name,
			description: compatibleTheme.description,
			id: compatibleTheme.id,
			background: compatibleTheme.background,
			foreground: compatibleTheme.foreground,
			stroke: compatibleTheme.stroke,
			buttonColor: compatibleTheme.buttonColor,
			buttonBackground: compatibleTheme.buttonBackground,
			shadow: {
				default: compatibleTheme.shadow.default,
				active: compatibleTheme.shadow.active,
				hovered: compatibleTheme.shadow.hovered,
				disabled: compatibleTheme.shadow.disabled,
				highlighted: compatibleTheme.shadow.highlighted
			},
			buttonRounding: compatibleTheme.buttonRounding || 12,
			category: compatibleTheme.category,
			isActive: compatibleTheme.isActive,
			isDefault: compatibleTheme.isDefault,
			metadata: {
				supportedModes: [...compatibleTheme.metadata.supportedModes] as ('both' | 'creative' | 'classic')[],
				previewImage: compatibleTheme.metadata.previewImage,
				tags: [...compatibleTheme.metadata.tags]
			}
		};
		startEdit();
	}

	function handleCancelEdit() {
		isEditing = false;
	}

	async function handleSaveEdit() {
		if (!validateFormData()) return;

		loading = true;
		try {
			const response = await fetch('/api/theme', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...formData, _id: theme._id })
			});

			if (response.ok) {
				toast.success('Theme updated successfully');
				isEditing = false;
				// Update the original theme object
				Object.assign(theme, formData);
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to update theme');
			}
		} catch (e) {
			toast.error('Network error while updating theme');
		}
		loading = false;
	}

	function validateFormData() {
		if (!formData.name.trim()) {
			toast.error('Theme name is required');
			return false;
		}
		if (!formData.description.trim()) {
			toast.error('Theme description is required');
			return false;
		}
		if (!formData.id.trim()) {
			toast.error('Theme ID is required');
			return false;
		}

		// Validate color fields
		const colorFields = [
			{ field: 'background', name: 'Background' },
			{ field: 'foreground', name: 'Foreground' },
			{ field: 'stroke', name: 'Stroke' },
			{ field: 'buttonColor', name: 'Button Color' },
			{ field: 'buttonBackground', name: 'Button Background' }
		];

		const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

		for (const { field, name } of colorFields) {
			const colorValue = formData[field as keyof typeof formData];
			if (typeof colorValue !== 'string' || !hexColorRegex.test(colorValue)) {
				toast.error(`${name} must be a valid hex color code`);
				return false;
			}
		}

		return true;
	}

	const formatDate = (date: string | Date) => {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};
</script>

<!-- Display Mode -->
<div class="flex items-start justify-between overflow-hidden rounded-3xl border">
	<div class="flex w-full flex-col">
		<!-- Header -->
		<div class="flex w-full items-center justify-between gap-3 border-b bg-sidebar p-4">
			<div class="flex items-center gap-2">
				<h3 class="text-lg font-semibold">{previewTheme.name}</h3>
				<Badge variant={previewTheme.isActive ? 'default' : 'secondary'}>
					{previewTheme.isActive ? 'Active' : 'Inactive'}
				</Badge>
				<Badge variant="outline">{previewTheme.category}</Badge>
				{#if previewTheme.isDefault}
					<Badge variant="outline">Default</Badge>
				{/if}
				<p class="text-sm">{previewTheme.description}</p>
			</div>
			{#if !isPreview}
				<div class="flex items-center gap-2">
					{#if !isEditing}
						<Button variant="outline" size="icon" onclick={handleStartEdit}>
							<PencilSimpleLine size={16} />
						</Button>
						<Button variant="outline" size="icon" onclick={deleteTheme}>
							<Trash size={16} />
						</Button>
					{:else}
						<Button size="sm" onclick={handleSaveEdit} disabled={loading}>
							<Check class="mr-2 h-4 w-4" />
							Save
						</Button>
						<Button variant="outline" size="sm" onclick={handleCancelEdit}>
							<X class="mr-2 h-4 w-4" />
							Cancel
						</Button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Color Palette -->
		<div
			class="flex h-80 w-full flex-col gap-2 border border-dashed border-primary"
			style="
			background-color: {previewTheme.background};
			color: {previewTheme.foreground};
			"
		>
			<div class="relative flex h-full w-full gap-2">
				<div class="absolute left-4 top-4 flex flex-col gap-2">
					<div class="flex items-center gap-2">
						<div
							class="h-8 w-8 rounded border border-dashed"
							style="background-color: {previewTheme.background}"
							title="Background: {previewTheme.background}"
						></div>
						<span class="text-xs">Background</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="h-8 w-8 rounded border border-dashed"
							style="background-color: {previewTheme.foreground}"
							title="Foreground: {previewTheme.foreground}"
						></div>
						<span class="text-xs">Foreground</span>
					</div>
				</div>

				<div class="absolute left-1/2 top-1/2 w-[60%] -translate-x-1/2 -translate-y-1/2">
					<ThemePreviewComponents theme={previewTheme} />
				</div>

				<div class="absolute right-4 top-4 flex flex-col gap-2">
					<div class="flex items-center gap-2">
						<div
							class="h-8 w-8 rounded border shadow-sm"
							style="background-color: {previewTheme.buttonColor}"
							title="Button Color: {previewTheme.buttonColor}"
						></div>
						<span class="text-xs">Button Color</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="h-8 w-8 rounded border shadow-sm"
							style="background-color: {previewTheme.buttonBackground}"
							title="Button Background: {previewTheme.buttonBackground}"
						></div>
						<span class="text-xs">Button Background</span>
					</div>
				</div>

				<div class="absolute bottom-4 left-4 flex flex-col gap-2">
					<div class="flex items-center gap-2">
						<div
							class="h-8 w-8 rounded border shadow-sm"
							style="background-color: {previewTheme.stroke}"
							title="Stroke: {previewTheme.stroke}"
						></div>
						<span class="text-xs">Stroke</span>
					</div>

					<div class="flex items-center gap-2">
						<div
							class="h-8 w-8 rounded border"
							style="box-shadow: {previewTheme.shadow.default}"
							title="Default Shadow: {previewTheme.shadow.default}"
						></div>
						<span class="text-xs">Shadow</span>
					</div>

					<div class="flex items-center gap-2">
						<div
							class="h-8 w-8 border"
							style="background-color: {previewTheme.buttonBackground}; border-radius: {previewTheme.buttonRounding}px;"
							title="Rounding: {previewTheme.buttonRounding}px"
						></div>
						<span class="text-xs">Rounding</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Theme Details / Edit Form Footer -->
		{#if isEditing}
			<!-- Edit Form in Footer -->
			<div class="border-t bg-sidebar p-4">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					<!-- Basic Info -->
					<div class="space-y-3">
						<h4 class="text-sm font-semibold">Basic Info</h4>
						<div class="space-y-2">
							<div>
								<Label for="edit-name" class="text-xs">Theme Name</Label>
								<Input id="edit-name" bind:value={formData.name} class="h-8 text-sm" />
							</div>
							<div>
								<Label for="edit-id" class="text-xs">Theme ID</Label>
								<Input id="edit-id" bind:value={formData.id} class="h-8 text-sm" />
							</div>
							<div>
								<Label for="edit-description" class="text-xs">Description</Label>
								<Textarea
									id="edit-description"
									bind:value={formData.description}
									rows={2}
									class="text-sm"
								/>
							</div>
						</div>
					</div>

					<!-- Categories & Settings -->
					<div class="space-y-3">
						<h4 class="text-sm font-semibold">Settings</h4>
						<div class="space-y-2">
							<div>
								<Label for="edit-category" class="text-xs">Category</Label>
								<Select.Root type="single" bind:value={formData.category}>
									<Select.Trigger class="h-8 text-sm">
										{categoryLabel}
									</Select.Trigger>
									<Select.Content>
										<Select.Group>
											{#each categories as category (category.value)}
												<Select.Item value={category.value} label={category.label}>
													{category.label}
												</Select.Item>
											{/each}
										</Select.Group>
									</Select.Content>
								</Select.Root>
							</div>
							<div>
								<Label for="edit-modes" class="text-xs">Supported Modes</Label>
								<Select.Root
									type="single"
									bind:value={formData.metadata.supportedModes[0]}
									onValueChange={(value) => {
										if (value) {
											formData.metadata.supportedModes = [value as any];
										}
									}}
								>
									<Select.Trigger class="h-8 text-sm">
										{modeLabel}
									</Select.Trigger>
									<Select.Content>
										<Select.Group>
											{#each modeOptions as mode (mode.value)}
												<Select.Item value={mode.value} label={mode.label}>
													{mode.label}
												</Select.Item>
											{/each}
										</Select.Group>
									</Select.Content>
								</Select.Root>
							</div>
							<div class="flex items-center space-x-4">
								<label class="flex items-center text-xs">
									<input type="checkbox" bind:checked={formData.isActive} class="mr-1" />
									Active
								</label>
								{#if data?.user?.role === 'admin'}
									<label class="flex items-center text-xs">
										<input type="checkbox" bind:checked={formData.isDefault} class="mr-1" />
										Default
									</label>
								{/if}
							</div>
						</div>
					</div>

					<!-- Colors & Style -->
					<div class="space-y-3 md:col-span-2 lg:col-span-1">
						<h4 class="text-sm font-semibold">Colors & Style</h4>
						<div class="grid grid-cols-2 gap-2">
							{#each [{ key: 'background', label: 'Background' }, { key: 'foreground', label: 'Foreground' }, { key: 'stroke', label: 'Stroke' }, { key: 'buttonColor', label: 'Button Text' }, { key: 'buttonBackground', label: 'Button BG' }] as color}
								<div>
									<Label for="edit-{color.key}" class="text-xs">{color.label}</Label>
									<div class="flex items-center gap-1">
										<div
											class="h-6 w-6 flex-shrink-0 rounded border"
											style="background-color: {formData[color.key as keyof typeof formData]}"
										></div>
										<input
											id="edit-{color.key}"
											type="color"
											bind:value={formData[color.key as keyof typeof formData]}
											class="h-6 w-12 rounded border border-input bg-background px-0 py-0 text-sm"
										/>
									</div>
								</div>
							{/each}
							<div class="col-span-2">
								<Label class="text-xs font-semibold">Box Shadows</Label>
								<div class="mt-1 grid grid-cols-2 gap-1">
									<div>
										<Label for="edit-shadow-default" class="text-xs">Default</Label>
										<Input
											id="edit-shadow-default"
											bind:value={formData.shadow.default}
											placeholder="4px 4px 0px 0px #000000"
											class="h-6 text-xs font-mono"
										/>
									</div>
									<div>
										<Label for="edit-shadow-hovered" class="text-xs">Hovered</Label>
										<Input
											id="edit-shadow-hovered"
											bind:value={formData.shadow.hovered}
											placeholder="2px 2px 0px 0px #000000"
											class="h-6 text-xs font-mono"
										/>
									</div>
									<div>
										<Label for="edit-shadow-active" class="text-xs">Active</Label>
										<Input
											id="edit-shadow-active"
											bind:value={formData.shadow.active}
											placeholder="2px 2px 0px 0px #000000"
											class="h-6 text-xs font-mono"
										/>
									</div>
									<div>
										<Label for="edit-shadow-disabled" class="text-xs">Disabled</Label>
										<Input
											id="edit-shadow-disabled"
											bind:value={formData.shadow.disabled}
											placeholder="1px 1px 0px 0px #cccccc"
											class="h-6 text-xs font-mono"
										/>
									</div>
									<div class="col-span-2">
										<Label for="edit-shadow-highlighted" class="text-xs">Highlighted</Label>
										<Input
											id="edit-shadow-highlighted"
											bind:value={formData.shadow.highlighted}
											placeholder="6px 6px 0px 0px #000000"
											class="h-6 text-xs font-mono"
										/>
									</div>
								</div>
							</div>
							<div>
								<Label for="edit-buttonRounding" class="text-xs">Rounding (px)</Label>
								<Input
									id="edit-buttonRounding"
									type="number"
									bind:value={formData.buttonRounding}
									min="0"
									max="50"
									class="h-6 text-xs"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Regular Theme Details Footer -->
			<div class="flex justify-between border-t bg-sidebar p-4 text-sm">
				<div class="flex flex-col gap-1">
					<p><strong>ID:</strong> <span class="font-mono">{theme.id}</span></p>
					<p><strong>Category:</strong> {theme.category}</p>
					<p><strong>Usage Count:</strong> {theme.usageCount}</p>
				</div>
				<div class="flex flex-col gap-1">
					<p>
						<strong>Supported Modes:</strong>
						{theme.metadata.supportedModes.join(', ')}
					</p>
					{#if theme.createdAt}
						<p><strong>Created:</strong> {formatDate(theme.createdAt)}</p>
					{/if}
					{#if theme.updatedAt && theme.updatedAt !== theme.createdAt}
						<p><strong>Updated:</strong> {formatDate(theme.updatedAt)}</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
