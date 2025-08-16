<script lang="ts" module>
	type DisplayMode = 'compact' | 'detailed' | 'avatar';

	export const defaultProps = {
		displayMode: {
			options: ['compact', 'detailed', 'avatar'] as const,
			default: 'detailed',
			value: 'detailed' as DisplayMode
		},
		showProfileImage: true,
		showDisplayName: true,
		showBio: true,
		showHandle: true,
		allowEdit: false,
		fallbackImage: '/default_avatar.jpg'
	} as const;

	export type UserProps = typeof defaultProps;
</script>

<script lang="ts">
	import BaseWidget from '$lib/components/base/BaseWidget.svelte';
	import { Button } from '$lib/components/ui/button';
	import { PencilSimple, User as UserIcon } from 'phosphor-svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { onMount } from 'svelte';
	import type { IProfile } from '$src/models/Profile/Profile.types';

	interface Props {
		size: { width: number; height: number };
		specificProps: Record<string, any>;
	}

	let { size, specificProps }: Props = $props();

	let p = $derived({
		...defaultProps,
		...specificProps
	});

	// User profile state
	let profile = $state<IProfile | null>(null);
	let loading = $state(false);
	let saving = $state(false);
	let editDialogOpen = $state(false);

	// Form fields
	let displayName = $state('');
	let bio = $state('');
	let handle = $state('');

	// Fetch user profile data
	async function fetchProfile() {
		loading = true;
		try {
			const response = await fetch('/api/user/profile');
			if (response.ok) {
				const data = await response.json();
				profile = data.profile;
				
				if (profile) {
					displayName = profile.displayName || '';
					bio = profile.bio || '';
					if (profile.user && profile.url) {
						handle = profile.url;
					}
				}
			}
		} catch (error) {
			console.error('Error fetching profile:', error);
		} finally {
			loading = false;
		}
	}

	// Update profile data
	async function updateProfile() {
		saving = true;
		try {
			const updateData = {
				displayName: displayName.trim(),
				bio: bio.trim()
			};

			const response = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updateData)
			});

			if (response.ok) {
				const data = await response.json();
				profile = data.profile;
				editDialogOpen = false;
			}
		} catch (error) {
			console.error('Error updating profile:', error);
		} finally {
			saving = false;
		}
	}

	onMount(() => {
		fetchProfile();
	});

	// Derived values for display
	const userDisplayName = $derived(profile?.displayName || 'User Name');
	const userBio = $derived(profile?.bio || 'No bio available');
	const userHandle = $derived(handle || 'username');
	const userImage = $derived(profile?.image || p.fallbackImage);
</script>

<BaseWidget {size} type="User">
	<div class="flex h-full w-full flex-col p-4">
		{#if loading}
			<div class="flex items-center justify-center h-full">
				<div class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
			</div>
		{:else if p.displayMode.value === 'avatar'}
			<!-- Avatar only mode -->
			<div class="flex items-center justify-center h-full">
				{#if p.showProfileImage}
					<div class="relative">
						<img
							src={userImage}
							alt={userDisplayName}
							class="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
						/>
						{#if p.allowEdit}
							<Button
								size="icon"
								variant="secondary"
								class="absolute -bottom-1 -right-1 h-6 w-6"
								onclick={() => editDialogOpen = true}
							>
								<PencilSimple class="h-3 w-3" />
							</Button>
						{/if}
					</div>
				{:else}
					<UserIcon size={32} weight="duotone" class="text-muted-foreground" />
				{/if}
			</div>
		{:else if p.displayMode.value === 'compact'}
			<!-- Compact mode -->
			<div class="flex items-center gap-3 h-full">
				{#if p.showProfileImage}
					<img
						src={userImage}
						alt={userDisplayName}
						class="w-10 h-10 rounded-full object-cover border border-primary/20 flex-shrink-0"
					/>
				{/if}
				<div class="flex-1 min-w-0">
					{#if p.showDisplayName}
						<p class="font-medium text-sm truncate">{userDisplayName}</p>
					{/if}
					{#if p.showHandle}
						<p class="text-xs text-muted-foreground truncate">@{userHandle}</p>
					{/if}
				</div>
				{#if p.allowEdit}
					<Button
						size="icon"
						variant="ghost"
						class="h-8 w-8 flex-shrink-0"
						onclick={() => editDialogOpen = true}
					>
						<PencilSimple class="h-4 w-4" />
					</Button>
				{/if}
			</div>
		{:else}
			<!-- Detailed mode -->
			<div class="flex flex-col gap-3 h-full">
				<div class="flex items-center gap-3">
					{#if p.showProfileImage}
						<img
							src={userImage}
							alt={userDisplayName}
							class="w-12 h-12 rounded-full object-cover border border-primary/20 flex-shrink-0"
						/>
					{/if}
					<div class="flex-1 min-w-0">
						{#if p.showDisplayName}
							<p class="font-medium truncate">{userDisplayName}</p>
						{/if}
						{#if p.showHandle}
							<p class="text-sm text-muted-foreground truncate">@{userHandle}</p>
						{/if}
					</div>
					{#if p.allowEdit}
						<Button
							size="icon"
							variant="ghost"
							class="h-8 w-8 flex-shrink-0"
							onclick={() => editDialogOpen = true}
						>
							<PencilSimple class="h-4 w-4" />
						</Button>
					{/if}
				</div>
				
				{#if p.showBio && size.height >= 2}
					<div class="flex-1 min-h-0">
						<p class="text-sm text-muted-foreground line-clamp-3 overflow-hidden">
							{userBio}
						</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Edit Dialog -->
	{#if p.allowEdit}
		<Dialog.Root bind:open={editDialogOpen}>
			<Dialog.Content class="sm:max-w-[425px]">
				<Dialog.Header>
					<Dialog.Title>Edit Profile</Dialog.Title>
					<Dialog.Description>
						Update your display name and bio.
					</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4 py-4">
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="name" class="text-right">Name</Label>
						<Input
							id="name"
							bind:value={displayName}
							class="col-span-3"
							placeholder="Your display name"
						/>
					</div>
					<div class="grid grid-cols-4 items-start gap-4">
						<Label for="bio" class="text-right pt-2">Bio</Label>
						<Textarea
							id="bio"
							bind:value={bio}
							class="col-span-3"
							placeholder="Tell us about yourself..."
							rows={3}
						/>
					</div>
				</div>
				<div class="flex justify-end gap-2">
					<Button variant="outline" onclick={() => editDialogOpen = false}>
						Cancel
					</Button>
					<Button onclick={updateProfile} disabled={saving}>
						{saving ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
</BaseWidget>
