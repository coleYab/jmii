<script lang="ts">
	import ClassicBoard from './ClassicBoard.svelte';
	import UserDetailsDisplayEdit from '../common/UserDetailsDisplayEdit.svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { GitBranch, Clock, FloppyDisk, ArrowClockwise } from 'phosphor-svelte';

	import type { Profile } from '$lib/types/profile';
	import type { ITheme } from '$src/models/Theme.model';

	let { profileData, refresh, classicData, theme }: { 
		profileData: Profile; 
		refresh: () => void; 
		classicData?: any;
		theme?: ITheme;
	} = $props();

	// Version history state
	let versions = $state<any[]>([]);
	let loadingVersions = $state(false);
	let isVersionDialogOpen = $state(false);

	// Load versions
	async function loadVersions() {
		loadingVersions = true;
		try {
			const response = await fetch('/api/classic/versions');
			if (response.ok) {
				const data = await response.json();
				versions = data.versions || [];
			}
		} catch (error) {
			console.error('Error loading versions:', error);
		} finally {
			loadingVersions = false;
		}
	}

	// Save snapshot
	async function saveSnapshot() {
		try {
			const res = await fetch('/api/classic/profile/snapshot', { method: 'POST' });
			if (res.ok) {
				await loadVersions();
				toast.success('Snapshot saved');
			}
		} catch (error) {
			console.error('Error saving snapshot:', error);
			toast.error('Failed to save snapshot');
		}
	}

	// Restore version
	async function restoreVersion(versionId: string) {
		try {
			const res = await fetch(`/api/classic/profile/snapshot/${versionId}`, {
				method: 'POST'
			});
			if (res.ok) {
				// Reload the page
				window.location.reload();
			}
		} catch (error) {
			console.error('Error restoring version:', error);
			toast.error('Failed to restore version');
		}
	}

	// Load versions on mount
	onMount(() => {
		loadVersions();
	});

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

<UserDetailsDisplayEdit
	{profileData}
	isPublicView={false}
	isManualOverride={false}
	{refresh}
	mode="classic"
/>

{#if profileData}
	<ClassicBoard {classicData} {theme} />
{:else}
	<div class="flex items-center justify-center p-8">
		<div class="text-muted-foreground">No user found</div>
	</div>
{/if}

<!-- Version History Dialog -->
<Dialog bind:open={isVersionDialogOpen}>
	<DialogTrigger>
		<Button 
			variant="outline" 
			size="sm"
			class="fixed bottom-4 right-4 z-30 shadow-lg hover:shadow-xl transition-all"
		>
			<GitBranch size={16} class="mr-2" />
			<span class="hidden sm:inline">Version History</span>
		</Button>
	</DialogTrigger>
	
	<DialogContent class="max-w-md sm:max-w-lg w-[95vw] max-h-[90vh] p-0 gap-0">
		<DialogHeader class="px-4 py-3 border-b">
			<DialogTitle class="text-lg font-semibold flex items-center gap-2">
				<GitBranch size={20} />
				Version History
			</DialogTitle>
		</DialogHeader>
		
		<div class="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
			<!-- Save Snapshot Section -->
			<div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
				<div class="flex items-center gap-2">
					<FloppyDisk size={18} class="text-primary" />
					<span class="text-sm font-medium">Current State</span>
				</div>
				<Button 
					size="sm" 
					onclick={saveSnapshot}
					class="text-xs"
				>
					Save Snapshot
				</Button>
			</div>

			<!-- Versions List -->
			<div class="space-y-2">
				<h3 class="text-sm font-medium text-muted-foreground">Previous Versions</h3>
				
				{#if loadingVersions}
					<div class="flex items-center justify-center py-8">
						<div class="flex items-center gap-2">
							<div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
							<span class="text-sm text-muted-foreground">Loading versions...</span>
						</div>
					</div>
				{:else if versions.length === 0}
					<div class="text-center py-8 text-muted-foreground">
						<Clock size={32} class="mx-auto mb-2 opacity-50" />
						<p class="text-sm">No versions yet</p>
						<p class="text-xs">Save your first snapshot to get started</p>
					</div>
				{:else}
					<ScrollArea class="max-h-64">
						<div class="space-y-2 pr-2">
							{#each versions as version (version.id)}
								<div class="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-colors">
									<div class="flex items-center gap-3 flex-1 min-w-0">
										<Clock size={16} class="text-muted-foreground flex-shrink-0" />
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium truncate">
												{formatDate(version.createdAt)}
											</p>
											{#if version.linkCount}
												<Badge variant="secondary" class="text-xs mt-1">
													{version.linkCount} links
												</Badge>
											{/if}
										</div>
									</div>
									<Button
										size="sm"
										variant="outline"
										onclick={() => restoreVersion(version.id)}
										class="text-xs flex-shrink-0"
									>
										<ArrowClockwise size={14} class="mr-1" />
										Restore
									</Button>
								</div>
							{/each}
						</div>
					</ScrollArea>
				{/if}
			</div>
		</div>
	</DialogContent>
</Dialog>
