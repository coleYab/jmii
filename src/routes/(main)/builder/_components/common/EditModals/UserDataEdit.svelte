<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Button } from '$lib/components/ui/button';
	import { innerWidth } from 'svelte/reactivity/window';
	import type { Profile } from '$lib/types/profile';

	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';

	let {
		profileData,
		showDialog = $bindable(),
		refresh
	}: { profileData: Profile | null; showDialog: boolean; refresh: () => void } = $props();

	let isMobile = $derived(innerWidth.current && innerWidth.current < 768);

	let displayName = $state(profileData?.displayName || '');
	let bio = $state(profileData?.bio || '');

	let displayNameError = $state<string | null>(null);
	let bioError = $state<string | null>(null);

	let profileSaving = $state(false);
	let profileSaved = $state(false);

	function validateProfileForm() {
		displayNameError = null;
		bioError = null;

		let isValid = true;

		if (!displayName?.trim()) {
			displayNameError = 'Display name cannot be empty.';
			isValid = false;
		}
		if (!bio?.trim()) {
			bioError = 'Bio cannot be empty.';
			isValid = false;
		}

		return isValid;
	}

	// Update profile data
	async function updateProfile() {
		if (!validateProfileForm()) {
			return;
		}

		profileSaving = true;
		try {
			const updateData = {
				displayName: displayName.trim(),
				bio: bio.trim()
			};

			const response = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updateData)
			});

			if (response.ok) {
				const data = await response.json();
				profileData = data.profile;
				profileSaved = true;
				showDialog = false;

				// Show success feedback
				setTimeout(() => {
					profileSaved = false;
				}, 3000);
			} else {
				const errorData = await response.json();
				console.error('Failed to update profile:', errorData.error);
			}
		} catch (error) {
			console.error('Error updating profile:', error);
		} finally {
			profileSaving = false;
			refresh();
		}
	}
</script>

{#if isMobile}
	<Drawer.Root bind:open={showDialog}>
		<Drawer.Content>
			<Drawer.Header class="text-left">
				<Drawer.Title>Edit Profile</Drawer.Title>
				<Drawer.Description>Update your display name and bio.</Drawer.Description>
			</Drawer.Header>
			<div class="flex flex-1 flex-col items-start gap-4 overflow-y-auto p-4">
				<div class="grid w-full gap-2">
					<Label for="displayName-mobile">Display Name</Label>
					<Input
						id="displayName-mobile"
						bind:value={displayName}
						placeholder="Your display name"
						class="{displayNameError ? 'border-destructive' : ''} w-full"
					/>
					{#if displayNameError}
						<p class="text-sm text-destructive">{displayNameError}</p>
					{/if}
				</div>

				<div class="grid w-full gap-2">
					<Label for="bio-mobile">Bio</Label>
					<Textarea
						id="bio-mobile"
						bind:value={bio}
						placeholder="Tell us about yourself..."
						class="min-h-[80px] {bioError ? 'border-destructive' : ''} w-full"
					/>
					{#if bioError}
						<p class="text-sm text-destructive">{bioError}</p>
					{/if}
				</div>
			</div>
			<Drawer.Footer class="pt-2">
				<Button onclick={updateProfile} disabled={profileSaving} class="w-full">
					{profileSaving ? 'Saving...' : 'Save Changes'}
				</Button>
				<Drawer.Close>
					<Button variant="outline" class="w-full">Cancel</Button>
				</Drawer.Close>
			</Drawer.Footer>
			{#if profileSaved}
				<p class="px-4 pb-2 text-sm text-green-600">Profile updated successfully!</p>
			{/if}
		</Drawer.Content>
	</Drawer.Root>
{:else}
	<Sheet.Root bind:open={showDialog}>
		<Sheet.Content side="right">
			<Sheet.Header>
				<Sheet.Title>Edit Profile</Sheet.Title>
				<Sheet.Description>Update your display name and bio.</Sheet.Description>
			</Sheet.Header>

			<div class="flex-1 overflow-y-auto p-6">
				<div class="grid gap-4">
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="displayName" class="text-right">Name</Label>
						<Input
							id="displayName"
							bind:value={displayName}
							placeholder="Your display name"
							class="col-span-3 {displayNameError ? 'border-destructive' : ''}"
						/>
					</div>
					{#if displayNameError}
						<p class="col-span-4 text-sm text-destructive">{displayNameError}</p>
					{/if}

					<div class="grid grid-cols-4 items-start gap-4">
						<Label for="bio" class="pt-2 text-right">Bio</Label>
						<Textarea
							id="bio"
							bind:value={bio}
							placeholder="Tell us about yourself..."
							class="col-span-3 min-h-[80px] {bioError ? 'border-destructive' : ''}"
						/>
					</div>
					{#if bioError}
						<p class="col-span-4 text-sm text-destructive">{bioError}</p>
					{/if}
				</div>
			</div>
			
			<Sheet.Footer>
				<Button variant="outline" onclick={() => (showDialog = false)}>Cancel</Button>
				<Button onclick={updateProfile} disabled={profileSaving}>
					{profileSaving ? 'Saving...' : 'Save Changes'}
				</Button>
			</Sheet.Footer>
			{#if profileSaved}
				<p class="mt-2 text-sm text-green-600">Profile updated successfully!</p>
			{/if}
		</Sheet.Content>
	</Sheet.Root>
{/if}
