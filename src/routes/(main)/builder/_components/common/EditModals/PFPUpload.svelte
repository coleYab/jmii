<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Button } from '$lib/components/ui/button';
	import { innerWidth } from 'svelte/reactivity/window';
	import type { Profile } from '$lib/types/profile';
	import ProfileImageUpload from '$lib/components/common/ProfileImageUpload.svelte';

	let {
		profileData = $bindable(),
		showDialog = $bindable(),
		refresh
	}: { profileData: Profile | null; showDialog: boolean; refresh: () => void } = $props();

	let isMobile = $derived(innerWidth.current && innerWidth.current < 768);

	// Handle image upload
	async function handleImageUpload(event: CustomEvent<{ url: string }>) {
		if (!profileData) return;

		try {
			const updateData = { image: event.detail.url };
			const response = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updateData)
			});

			if (response.ok) {
				const data = await response.json();
				profileData = data.profile;
				showDialog = false;
				refresh();
			}
		} catch (error) {
			console.error('Error updating profile image:', error);
		}
	}
</script>

{#if isMobile}
	<Drawer.Root bind:open={showDialog}>
		<Drawer.Content>
			<Drawer.Header class="text-left">
				<Drawer.Title>Upload Profile Image</Drawer.Title>
				<Drawer.Description
					>Choose and crop a new profile picture for your account.</Drawer.Description
				>
			</Drawer.Header>
			<div class="flex-1 overflow-y-auto px-4 py-4">
				<ProfileImageUpload
					currentImage={profileData?.image}
					on:upload={handleImageUpload}
					on:start={() => console.log('Profile upload started')}
					on:error={(e) => console.error('Profile upload error:', e.detail.error)}
				/>
			</div>
			<Drawer.Footer class="pt-2">
				<Drawer.Close>
					<Button variant="outline" class="w-full">Close</Button>
				</Drawer.Close>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{:else}
	<Sheet.Root bind:open={showDialog}>
		<Sheet.Content side="right">
			<Sheet.Header>
				<Sheet.Title>Upload Profile Image</Sheet.Title>
				<Sheet.Description>Choose and crop a new profile picture for your account.</Sheet.Description>
			</Sheet.Header>

			<div class="flex-1 overflow-y-auto p-6">
				<ProfileImageUpload
					currentImage={profileData?.image}
					on:upload={handleImageUpload}
					on:start={() => console.log('Profile upload started')}
					on:error={(e) => console.error('Profile upload error:', e.detail.error)}
				/>
			</div>
			
			<Sheet.Footer>
				<Sheet.Close>
					<Button variant="outline">Close</Button>
				</Sheet.Close>
			</Sheet.Footer>
		</Sheet.Content>
	</Sheet.Root>
{/if}
