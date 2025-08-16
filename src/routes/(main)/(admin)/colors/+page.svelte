<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Palette } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import type { ITheme } from '$src/models/Theme.model';
	import { Plus } from 'phosphor-svelte';
	import ThemePreviewCard from './ThemePreviewCard.svelte';
	import ThemeFormModal from './ThemeFormModal.svelte';

	let { data } = $props();
	console.log(data);

	// State using Svelte 5 $state
	let themes = $state<ITheme[]>(data?.themes || []);
	let loading = $state(false);
	let showCreateForm = $state(false);
	let editingTheme = $state<ITheme | null>(null);

	// Category options
	const categories = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'colorful', label: 'Colorful' },
		{ value: 'minimal', label: 'Minimal' },
		{ value: 'nature', label: 'Nature' },
		{ value: 'professional', label: 'Professional' },
		{ value: 'creative', label: 'Creative' }
	];

	// Mode options
	const modeOptions = [
		{ value: 'both', label: 'Both Creative & Classic' },
		{ value: 'creative', label: 'Creative Only' },
		{ value: 'classic', label: 'Classic Only' }
	];

	async function loadThemes() {
		loading = true;
		try {
			const response = await fetch('/api/theme');
			if (response.ok) {
				const data = await response.json();
				themes = data.data || [];
			} else {
				toast.error('Failed to load themes');
			}
		} catch (e) {
			toast.error('Network error while loading themes');
		}
		loading = false;
	}

	async function handleCreateTheme(themeData: any) {
		if (!validateFormData(themeData)) return;

		loading = true;
		try {
			const response = await fetch('/api/theme', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(themeData)
			});

			if (response.ok) {
				toast.success('Theme created successfully');
				showCreateForm = false;
				await loadThemes();
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to create theme');
			}
		} catch (e) {
			toast.error('Network error while creating theme');
		}
		loading = false;
	}

	async function handleUpdateTheme(theme: ITheme, updatedData: any) {
		if (!validateFormData(updatedData)) return;

		loading = true;
		try {
			const response = await fetch('/api/theme', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...updatedData, _id: theme._id })
			});

			if (response.ok) {
				toast.success('Theme updated successfully');
				editingTheme = null;
				await loadThemes();
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to update theme');
			}
		} catch (e) {
			toast.error('Network error while updating theme');
		}
		loading = false;
	}

	async function handleDeleteTheme(themeId: string) {
		if (!confirm('Are you sure you want to delete this theme?')) return;

		loading = true;
		try {
			const response = await fetch(`/api/theme?id=${themeId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				toast.success('Theme deleted successfully');
				await loadThemes();
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to delete theme');
			}
		} catch (e) {
			toast.error('Network error while deleting theme');
		}
		loading = false;
	}

	function validateFormData(data: any) {
		if (!data.name.trim()) {
			toast.error('Theme name is required');
			return false;
		}
		if (!data.description.trim()) {
			toast.error('Theme description is required');
			return false;
		}
		if (!data.id.trim()) {
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
			const colorValue = data[field];
			if (typeof colorValue !== 'string' || !hexColorRegex.test(colorValue)) {
				toast.error(`${name} must be a valid hex color code`);
				return false;
			}
		}

		return true;
	}

	function handleStartEdit(theme: ITheme) {
		editingTheme = theme;
	}

	function handleCancelEdit() {
		editingTheme = null;
	}
</script>

<header
	class="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
>
	<div class="flex items-center gap-2 px-4">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mr-2 h-4" />
	</div>
	<h2 class="text-lg">Admin | Themes</h2>
</header>

{#if data?.user?.role !== 'admin'}
	<div class="flex flex-col items-center justify-center">
		<p>Loading...</p>
	</div>
{:else if data?.user}
	<div class="container mx-auto p-6">
		<div class="mb-6">
			<Button onclick={() => (showCreateForm = true)} disabled={loading}>
				<Plus class="mr-2 h-4 w-4" />
				Create New Theme
			</Button>
		</div>

		<!-- Create Form Modal -->
		<ThemeFormModal 
			show={showCreateForm}
			onClose={() => (showCreateForm = false)}
			onCreate={handleCreateTheme}
			{loading}
			{categories}
			{modeOptions}
		/>

		<!-- Themes List -->
		<div class="space-y-4">
			{#if loading && themes.length === 0}
				{#each Array(3) as _}
					<Card>
						<CardContent class="p-6">
							<Skeleton class="h-4 w-3/4" />
							<Skeleton class="mt-2 h-4 w-1/2" />
							<div class="mt-4 flex space-x-2">
								{#each Array(5) as _}
									<Skeleton class="h-8 w-8 rounded" />
								{/each}
							</div>
						</CardContent>
					</Card>
				{/each}
			{:else if themes.length === 0}
				<Card>
					<CardContent class="flex flex-col items-center justify-center py-12">
						<Palette class="mb-4 h-12 w-12 text-muted-foreground" />
						<h3 class="mb-2 text-lg font-semibold">No themes found</h3>
						<p class="text-muted-foreground">Create your first theme to get started</p>
					</CardContent>
				</Card>
			{:else}
				{#each themes as theme (theme._id)}
					<ThemePreviewCard
						{data}
						{theme}
						updateTheme={handleUpdateTheme}
						deleteTheme={handleDeleteTheme}
						startEdit={handleStartEdit}
						cancelEdit={handleCancelEdit}
						{categories}
						{modeOptions}
						{editingTheme}
						{loading}
					/>
				{/each}
			{/if}
		</div>
	</div>
{/if}
