<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Check, X } from 'lucide-svelte';
	import type { ITheme } from '$src/models/Theme.model';
	import ThemePreviewComponents from './ThemePreviewComponents.svelte';

	interface ThemeFormModalProps {
		show: boolean;
		onClose: () => void;
		onCreate: (themeData: any) => Promise<void>;
		loading: boolean;
		categories: any[];
		modeOptions: any[];
	}

	let { show, onClose, onCreate, loading, categories, modeOptions }: ThemeFormModalProps = $props();

	// Form data for creating themes
	let formData = $state({
		name: '',
		description: '',
		id: '',
		background: '#ffffff',
		foreground: '#000000',
		stroke: '#e5e7eb',
		buttonColor: '#ffffff',
		buttonBackground: '#3b82f6',
		shadow: {
			default: '4px 4px 0px 0px #000000',
			active: '2px 2px 0px 0px #000000',
			hovered: '2px 2px 0px 0px #000000',
			disabled: '1px 1px 0px 0px #cccccc',
			highlighted: '6px 6px 0px 0px #000000'
		},
		buttonRounding: 12,
		category: 'colorful' as ITheme['category'],
		isActive: true,
		isDefault: false,
		metadata: {
			supportedModes: ['both'] as ('both' | 'creative' | 'classic')[],
			previewImage: '',
			tags: [] as string[]
		}
	});

	// Create preview theme for live updates
	const previewTheme = $derived({
		...formData,
		_id: 'preview',
		createdBy: 'preview',
		usageCount: 0,
		createdAt: new Date(),
		updatedAt: new Date()
	} as ITheme);

	// Derived values for select displays
	const categoryLabel = $derived(
		categories.find((c) => c.value === formData.category)?.label ?? 'Select category'
	);

	const modeLabel = $derived(
		modeOptions.find((m) => m.value === formData.metadata.supportedModes[0])?.label ?? 'Select mode'
	);

	function generateThemeId() {
		formData.id = formData.name
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, '')
			.replace(/\s+/g, '-')
			.substring(0, 20);
	}

	function resetForm() {
		formData = {
			name: '',
			description: '',
			id: '',
			background: '#ffffff',
			foreground: '#000000',
			stroke: '#e5e7eb',
			buttonColor: '#ffffff',
			buttonBackground: '#3b82f6',
			shadow: {
				default: '4px 4px 0px 0px #000000',
				active: '2px 2px 0px 0px #000000',
				hovered: '2px 2px 0px 0px #000000',
				disabled: '1px 1px 0px 0px #cccccc',
				highlighted: '6px 6px 0px 0px #000000'
			},
			buttonRounding: 12,
			category: 'colorful',
			isActive: true,
			isDefault: false,
			metadata: {
				supportedModes: ['both'] as ('both' | 'creative' | 'classic')[],
				previewImage: '',
				tags: []
			}
		};
	}

	async function handleCreate() {
		await onCreate(formData);
		resetForm();
	}

	function handleClose() {
		resetForm();
		onClose();
	}
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<Card class="w-full max-w-6xl max-h-[90vh] overflow-auto">
			<CardHeader>
				<CardTitle>Create New Theme</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<!-- Left Side: Form -->
					<div class="space-y-4">
						<!-- Basic Info -->
						<div class="space-y-3">
							<h4 class="font-semibold text-sm">Basic Info</h4>
							<div class="space-y-2">
								<div>
									<Label for="create-name" class="text-xs">Theme Name</Label>
									<Input 
										id="create-name" 
										bind:value={formData.name} 
										class="h-8 text-sm" 
										onblur={generateThemeId}
									/>
								</div>
								<div>
									<Label for="create-id" class="text-xs">Theme ID</Label>
									<Input id="create-id" bind:value={formData.id} class="h-8 text-sm" />
								</div>
								<div>
									<Label for="create-description" class="text-xs">Description</Label>
									<Textarea id="create-description" bind:value={formData.description} rows={2} class="text-sm" />
								</div>
							</div>
						</div>

						<!-- Categories & Settings -->
						<div class="space-y-3">
							<h4 class="font-semibold text-sm">Settings</h4>
							<div class="space-y-2">
								<div>
									<Label for="create-category" class="text-xs">Category</Label>
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
									<Label for="create-modes" class="text-xs">Supported Modes</Label>
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
									<label class="flex items-center text-xs">
										<input type="checkbox" bind:checked={formData.isDefault} class="mr-1" />
										Default
									</label>
								</div>
							</div>
						</div>

						<!-- Colors & Style -->
						<div class="space-y-3">
							<h4 class="text-sm font-semibold">Colors & Style</h4>
							<div class="grid grid-cols-2 gap-2">
								{#each [
									{ key: 'background', label: 'Background' },
									{ key: 'foreground', label: 'Foreground' },
									{ key: 'stroke', label: 'Stroke' },
									{ key: 'buttonColor', label: 'Button Text' },
									{ key: 'buttonBackground', label: 'Button BG' }
								] as color}
									<div>
										<Label for="create-{color.key}" class="text-xs">{color.label}</Label>
										<div class="flex items-center gap-1">
											<div
												class="h-6 w-6 flex-shrink-0 rounded border"
												style="background-color: {formData[color.key as keyof typeof formData]}"
											></div>
											<input
												id="create-{color.key}"
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
											<Label for="create-shadow-default" class="text-xs">Default</Label>
											<Input
												id="create-shadow-default"
												bind:value={formData.shadow.default}
												placeholder="4px 4px 0px 0px #000000"
												class="h-6 text-xs font-mono"
											/>
										</div>
										<div>
											<Label for="create-shadow-hovered" class="text-xs">Hovered</Label>
											<Input
												id="create-shadow-hovered"
												bind:value={formData.shadow.hovered}
												placeholder="2px 2px 0px 0px #000000"
												class="h-6 text-xs font-mono"
											/>
										</div>
										<div>
											<Label for="create-shadow-active" class="text-xs">Active</Label>
											<Input
												id="create-shadow-active"
												bind:value={formData.shadow.active}
												placeholder="2px 2px 0px 0px #000000"
												class="h-6 text-xs font-mono"
											/>
										</div>
										<div>
											<Label for="create-shadow-disabled" class="text-xs">Disabled</Label>
											<Input
												id="create-shadow-disabled"
												bind:value={formData.shadow.disabled}
												placeholder="1px 1px 0px 0px #cccccc"
												class="h-6 text-xs font-mono"
											/>
										</div>
										<div class="col-span-2">
											<Label for="create-shadow-highlighted" class="text-xs">Highlighted</Label>
											<Input
												id="create-shadow-highlighted"
												bind:value={formData.shadow.highlighted}
												placeholder="6px 6px 0px 0px #000000"
												class="h-6 text-xs font-mono"
											/>
										</div>
									</div>
								</div>
								<div>
									<Label for="create-buttonRounding" class="text-xs">Rounding (px)</Label>
									<Input
										id="create-buttonRounding"
										type="number"
										bind:value={formData.buttonRounding}
										min="0"
										max="50"
										class="h-6 text-xs"
									/>
								</div>
							</div>
						</div>

						<!-- Action Buttons -->
						<div class="flex space-x-2">
							<Button onclick={handleCreate} disabled={loading}>
								<Check class="mr-2 h-4 w-4" />
								Create Theme
							</Button>
							<Button variant="outline" onclick={handleClose}>
								<X class="mr-2 h-4 w-4" />
								Cancel
							</Button>
						</div>
					</div>

					<!-- Right Side: Live Preview -->
					<div class="space-y-4">
						<h4 class="font-semibold text-sm">Live Preview</h4>
						<div 
							class="rounded-xl border p-4"
							style="background-color: {previewTheme.background}; color: {previewTheme.foreground}"
						>
							<ThemePreviewComponents theme={previewTheme} />
						</div>
						
						<!-- Theme Details -->
						<div class="rounded-lg border bg-sidebar p-3 text-sm">
							<div class="grid grid-cols-2 gap-2">
								<div>
									<strong>Name:</strong> {formData.name || 'Untitled Theme'}
								</div>
								<div>
									<strong>ID:</strong> {formData.id || 'auto-generated'}
								</div>
								<div>
									<strong>Category:</strong> {formData.category}
								</div>
								<div>
									<strong>Rounding:</strong> {formData.buttonRounding}px
								</div>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
{/if} 