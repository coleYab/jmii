<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Plus, X, Star, Pencil, Trash } from 'phosphor-svelte';

	interface Props {
		onNext: () => void;
		onPrev: () => void;
		onSkip: () => void;
		onRefresh: () => void;
		isFirst: boolean;
		isLast: boolean;
		data: any;
		profileData: any;
	}

	let { onNext, onPrev, onSkip, onRefresh, isFirst, isLast, data, profileData }: Props = $props();

	interface SocialLink {
		platform: string;
		url: string;
		username: string;
		icon: string;
		highlighted?: boolean;
	}

	const availablePlatforms = [
		{ name: 'Instagram', url: 'instagram.com/', icon: '📷', placeholder: 'Username' },
		{ name: 'TikTok', url: 'tiktok.com/@', icon: '🎵', placeholder: 'Username' },
		{ name: 'YouTube', url: 'youtube.com/', icon: '🎬', placeholder: 'Channel' },
		{ name: 'Twitch', url: 'twitch.tv/', icon: '🎮', placeholder: 'Username' },
		{ name: 'Twitter/X', url: 'x.com/', icon: '🐦', placeholder: 'Username' },
		{ name: 'LinkedIn', url: 'linkedin.com/in/', icon: '💼', placeholder: 'Username' },
		{ name: 'GitHub', url: 'github.com/', icon: '👨‍💻', placeholder: 'Username' },
		{ name: 'Discord', url: 'discord.gg/', icon: '🎯', placeholder: 'Server' },
		{ name: 'Spotify', url: 'spotify.com/', icon: '🎵', placeholder: 'Profile' },
		{ name: 'Custom', url: '', icon: '🔗', placeholder: 'Full URL' }
	];

	// Initialize links if not present
	if (!profileData.links) {
		profileData.links = [];
	}

	let links = $state<SocialLink[]>(profileData.links || []);
	let editingLink: SocialLink | null = $state(null);
	let showAddForm = $state(false);
	let selectedPlatform = $state('');
	let linkInput = $state('');
	let saving = $state(false);

	// Count highlighted links
	const highlightedCount = $derived(
		links.filter(link => link.highlighted).length
	);

	// Save links to API
	async function saveLinks() {
		if (saving) return;

		saving = true;
		try {
			const updateData = { links };

			const response = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updateData)
			});

			if (response.ok) {
				console.log('Links updated successfully');
				profileData.links = links;
				onRefresh();
			} else {
				const errorData = await response.json();
				console.error('Failed to update links:', errorData.error);
			}
		} catch (error) {
			console.error('Error updating links:', error);
		} finally {
			saving = false;
		}
	}

	// Add or edit link
	function saveCurrentLink() {
		if (!selectedPlatform || !linkInput.trim()) return;

		const platformConfig = availablePlatforms.find(p => p.name === selectedPlatform);
		if (!platformConfig) return;

		const newLink: SocialLink = {
			platform: selectedPlatform,
			url: selectedPlatform === 'Custom' ? linkInput.trim() : platformConfig.url + linkInput.trim(),
			username: linkInput.trim(),
			icon: platformConfig.icon,
			highlighted: false
		};

		if (editingLink) {
			// Update existing link
			const index = links.findIndex(l => l === editingLink);
			if (index !== -1) {
				newLink.highlighted = editingLink.highlighted; // Preserve highlight status
				links[index] = newLink;
			}
			editingLink = null;
		} else {
			// Add new link
			links.push(newLink);
		}

		// Reset form
		selectedPlatform = '';
		linkInput = '';
		showAddForm = false;

		saveLinks();
	}

	// Start editing a link
	function startEditing(link: SocialLink) {
		editingLink = link;
		selectedPlatform = link.platform;
		linkInput = link.username;
		showAddForm = true;
	}

	// Delete a link
	function deleteLink(link: SocialLink) {
		links = links.filter(l => l !== link);
		saveLinks();
	}

	// Toggle highlight
	function toggleHighlight(link: SocialLink) {
		if (!link.highlighted && highlightedCount >= 4) {
			return; // Cannot highlight more than 4
		}
		link.highlighted = !link.highlighted;
		saveLinks();
	}

	// Cancel editing
	function cancelEdit() {
		editingLink = null;
		selectedPlatform = '';
		linkInput = '';
		showAddForm = false;
	}

	// Start adding new link
	function startAddingLink() {
		editingLink = null;
		selectedPlatform = '';
		linkInput = '';
		showAddForm = true;
	}
</script>

<div class="space-y-4 sm:space-y-6">
	<div class="text-center">
		<h2 class="mb-2 text-lg font-bold text-foreground sm:text-xl">Add your links</h2>
		<p class="text-sm text-muted-foreground sm:text-base">Add your favorite links to your profile.</p>
		<p class="text-xs text-muted-foreground mt-1 sm:text-sm">
			Highlight up to 4 links to show them prominently ({highlightedCount}/4)
		</p>
	</div>

	<!-- Existing Links List -->
	{#if links.length > 0}
		<div class="space-y-2">
			{#each links as link}
				<div class="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
					<!-- Platform Icon & Info -->
					<div class="flex min-w-0 flex-1 items-center gap-2">
						<span class="text-lg">{link.icon}</span>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="text-sm font-medium text-foreground">{link.platform}</span>
								{#if link.highlighted}
									<span class="text-xs text-yellow-600">★</span>
								{/if}
							</div>
							<p class="truncate text-xs text-muted-foreground">{link.url}</p>
						</div>
					</div>

					<!-- Actions -->
					<div class="flex items-center gap-1">
						<!-- Highlight Button -->
						<Button
							variant="ghost"
							size="sm"
							class="h-8 w-8 p-0"
							onclick={() => toggleHighlight(link)}
							disabled={!link.highlighted && highlightedCount >= 4}
						>
													{#if link.highlighted}
							<Star size={16} weight="fill" class="text-yellow-500" />
						{:else}
							<Star size={16} class="text-muted-foreground" />
						{/if}
						</Button>

						<!-- Edit Button -->
						<Button
							variant="ghost"
							size="sm"
							class="h-8 w-8 p-0"
							onclick={() => startEditing(link)}
						>
							<Pencil size={16} class="text-muted-foreground" />
						</Button>

						<!-- Delete Button -->
						<Button
							variant="ghost"
							size="sm"
							class="h-8 w-8 p-0"
							onclick={() => deleteLink(link)}
						>
							<Trash size={16} class="text-red-500" />
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Add/Edit Link Form -->
	{#if showAddForm}
		<div class="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-medium">
					{editingLink ? 'Edit Link' : 'Add New Link'}
				</h3>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={cancelEdit}>
					<X size={14} />
				</Button>
			</div>

			<!-- Platform Selection -->
			<div class="space-y-2">
				<label class="text-xs font-medium text-foreground">Platform</label>
				<select
					bind:value={selectedPlatform}
					class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
				>
					<option value="">Select a platform</option>
					{#each availablePlatforms as platform}
						<option value={platform.name}>{platform.icon} {platform.name}</option>
					{/each}
				</select>
			</div>

			<!-- Link Input -->
			{#if selectedPlatform}
				<div class="space-y-2">
					<label class="text-xs font-medium text-foreground">
						{selectedPlatform === 'Custom' ? 'Full URL' : 'Username/Handle'}
					</label>
					<div class="flex items-center gap-2">
						{#if selectedPlatform !== 'Custom'}
							<span class="text-xs text-muted-foreground whitespace-nowrap">
								{availablePlatforms.find(p => p.name === selectedPlatform)?.url}
							</span>
						{/if}
						<Input
							bind:value={linkInput}
							placeholder={availablePlatforms.find(p => p.name === selectedPlatform)?.placeholder}
							class="text-sm"
							type={selectedPlatform === 'Custom' ? 'url' : 'text'}
						/>
					</div>
				</div>

				<!-- Save/Cancel Buttons -->
				<div class="flex gap-2">
					<Button
						size="sm"
						onclick={saveCurrentLink}
						disabled={!linkInput.trim() || saving}
						class="flex-1 text-xs"
					>
						{saving ? 'Saving...' : editingLink ? 'Update Link' : 'Add Link'}
					</Button>
					<Button variant="outline" size="sm" onclick={cancelEdit} class="text-xs">
						Cancel
					</Button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Add Link Button -->
	{#if !showAddForm}
		<div class="flex justify-center">
			<Button
				variant="outline"
				onclick={startAddingLink}
				class="w-full text-sm sm:w-auto"
			>
				<Plus size={16} class="mr-2" />
				Add Link
			</Button>
		</div>
	{/if}
</div>
