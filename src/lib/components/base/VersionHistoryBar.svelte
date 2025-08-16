<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		GitBranch, 
		Clock, 
		FloppyDisk, 
		ArrowClockwise, 
	} from 'phosphor-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { AlertCircle } from 'lucide-svelte';

	interface Version {
		id: string;
		createdAt: string;
		title?: string;
		widgetCount?: number;
		linkCount?: number;
	}

	interface Props {
		mode: 'classic' | 'creative';
		onRestore?: (versionId: string) => Promise<void>;
		onSaveSnapshot?: () => Promise<void>;
		hasUnsavedChanges?: boolean;
	}

	let { 
		mode, 
		onRestore, 
		onSaveSnapshot, 
		hasUnsavedChanges = false 
	}: Props = $props();

	let versions = $state<Version[]>([]);
	let loading = $state(false);
	let savingSnapshot = $state(false);
	let restoringVersion = $state<string | null>(null);
	let selectedVersion = $state<string | null>(null);

	onMount(() => {
		loadVersions();
	});

	async function loadVersions() {
		loading = true;
		try {
			const endpoint = mode === 'creative' ? '/api/creative/versions' : '/api/classic/versions';
			const response = await fetch(endpoint);
			
			if (response.ok) {
				const data = await response.json();
				versions = data.versions || [];
			} else {
				console.error('Failed to load versions');
			}
		} catch (error) {
			console.error('Error loading versions:', error);
		} finally {
			loading = false;
		}
	}

	async function handleSaveSnapshot() {
		if (!onSaveSnapshot) return;
		
		savingSnapshot = true;
		try {
			await onSaveSnapshot();
			await loadVersions();
			toast.success('Snapshot saved successfully');
		} catch (error) {
			console.error('Error saving snapshot:', error);
			toast.error('Failed to save snapshot');
		} finally {
			savingSnapshot = false;
		}
	}

	async function handleRestoreVersion(versionId: string) {
		if (!onRestore) return;
		
		restoringVersion = versionId;
		try {
			await onRestore(versionId);
			toast.success('Version restored successfully');
		} catch (error) {
			console.error('Error restoring version:', error);
			toast.error('Failed to restore version');
		} finally {
			restoringVersion = null;
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
		
		if (diffInHours < 1) return 'Just now';
		if (diffInHours < 24) return `${diffInHours}h ago`;
		if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
		return date.toLocaleDateString();
	}
</script>

<div class="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border">
	<div class="container mx-auto px-4 py-3">
		<div class="flex items-center justify-between gap-4">
			<div class="flex items-center gap-3 flex-1 min-w-0">
				<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
					<GitBranch size={16} />
					<span class="hidden sm:inline">Version History</span>
				</div>

				{#if loading}
					<div class="flex items-center gap-2">
						<div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
						<span class="text-xs text-muted-foreground">Loading...</span>
					</div>
				{:else if versions.length === 0}
					<span class="text-xs text-muted-foreground">No versions yet</span>
				{:else}
					<div class="flex items-center gap-2 overflow-x-auto max-w-md">
						{#each versions.slice(0, 5) as version (version.id)}
							<button
								class="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1.5 text-xs transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
								class:border-primary={selectedVersion === version.id}
								class:bg-primary={selectedVersion === version.id}
								onclick={() => selectedVersion = selectedVersion === version.id ? null : version.id}
								disabled={restoringVersion === version.id}
								title={version.title || `Version ${formatDate(version.createdAt)}`}
							>
								<Clock size={12} />
								<span>{formatDate(version.createdAt)}</span>
								{#if mode === 'creative' && version.widgetCount}
									<Badge variant="secondary" class="text-xs px-1 py-0">
										{version.widgetCount}
									</Badge>
								{:else if mode === 'classic' && version.linkCount}
									<Badge variant="secondary" class="text-xs px-1 py-0">
										{version.linkCount}
									</Badge>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				{#if selectedVersion && onRestore}
					<Button
						size="sm"
						variant="outline"
						onclick={() => handleRestoreVersion(selectedVersion)}
						disabled={restoringVersion !== null}
						class="text-xs"
					>
						{#if restoringVersion === selectedVersion}
							<div class="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent mr-1"></div>
						{:else}
							<ArrowClockwise size={12} class="mr-1" />
						{/if}
						Restore
					</Button>
				{/if}

				{#if hasUnsavedChanges}
					<div class="flex items-center gap-1 text-xs text-amber-600">
						<AlertCircle size={12} />
						<span class="hidden sm:inline">Unsaved changes</span>
					</div>
				{/if}

				<Button
					size="sm"
					onclick={handleSaveSnapshot}
					disabled={savingSnapshot || !onSaveSnapshot}
					class="text-xs"
				>
					{#if savingSnapshot}
						<div class="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent mr-1"></div>
					{:else}
						<FloppyDisk size={12} class="mr-1" />
					{/if}
					{savingSnapshot ? 'Saving...' : 'Save Snapshot'}
				</Button>
			</div>
		</div>
	</div>
</div>
