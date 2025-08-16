<script lang="ts">
	import { onMount } from 'svelte';
	import PagePreview from '$lib/components/PagePreview.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { IProfile } from '$src/models/Profile/Profile.types';

	let profileData = $state<IProfile | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedMode = $state<'creative' | 'classic'>('classic');
	let selectedFocus = $state<'profile' | 'cover' | 'widgets'>('profile');

	onMount(async () => {
		try {
			const response = await fetch('/api/user/profile');

			if (!response.ok) {
				throw new Error(`Failed to fetch profile: ${response.status}`);
			}

			const data = await response.json();
			profileData = data.profile;
		} catch (err) {
			console.error('Error fetching profile:', err);
			error = err instanceof Error ? err.message : 'Failed to fetch profile';
		} finally {
			loading = false;
		}
	});
</script>

<div
	class=" container flex h-screen w-full items-center justify-center border border-dashed border-primary bg-sidebar"
>
	{#if loading}
		<div class="text-center">
			<p class="mt-4 text-lg">Loading profile...</p>
		</div>
	{:else if error}
		<div class="text-center text-red-600">
			<p class="text-lg font-semibold">Error loading profile</p>
			<p class="mt-2">{error}</p>
		</div>
	{:else if profileData}
		<div class="flex flex-col items-center gap-4">
			<!-- Controls -->
			<div class="flex gap-4 items-center">
				<!-- Mode Select -->
				<div class="flex flex-col gap-2">
					<label for="mode" class="text-sm font-medium">Mode</label>
					<Select.Root type="single" onValueChange={(value) => selectedMode = value as 'creative' | 'classic'} >
						<Select.Trigger class="w-[140px]">
							{selectedMode === 'creative' ? 'Creative' : 'Classic'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="creative">Creative</Select.Item>
							<Select.Item value="classic">Classic</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<!-- Focus Select -->
				<div class="flex flex-col gap-2">
					<label for="focus" class="text-sm font-medium">Focus On</label>
					<Select.Root type="single" onValueChange={(value) => selectedFocus = value as 'profile' | 'cover' | 'widgets'}>
						<Select.Trigger class="w-[140px]">
							{selectedFocus.charAt(0).toUpperCase() + selectedFocus.slice(1)}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="profile">Profile</Select.Item>
							<Select.Item value="cover">Cover</Select.Item>
							<Select.Item value="widgets">Widgets</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<!-- Page Preview -->
			<PagePreview {profileData} mode={selectedMode} focusOn={selectedFocus} />
		</div>
	{:else}
		<div class="text-center">
			<p class="text-lg">No profile data available</p>
		</div>
	{/if}
</div>
