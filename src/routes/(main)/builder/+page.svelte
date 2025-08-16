<script lang="ts">
	import ClassicMode from './_components/Classic/ClassicMode.svelte';
	import CreativeMode from './_components/Creative/CreativeMode.svelte';

	import BuilderNavBar from './BuilderNavBar.svelte';
	import TipsMode from './_components/Tips/TipsMode.svelte';
	import { themeStore } from '$src/stores/themeStore';
	import { browser } from '$app/environment';
	import { fade, scale, slide } from 'svelte/transition';
	import { quintInOut, quintOut } from 'svelte/easing';

	let { session, data }: { session: any; data: any } = $props();

	// Initialize mode from profile data, fallback to 'classic'
	let mode = $state<'classic' | 'creative' | 'tips'>(data.profile?.mode || 'classic');

	let loading = $state(false);
	let saving = $state(false);

	let buttonWidth = $state(48);

	// Use server-provided profile data directly
	let profileData = $state(data.profile);

	// Use theme from store, fall back to server data
	let currentTheme = $derived($themeStore.currentTheme || data.selectedTheme);

	// Fetch user profile for UI personalization
	async function fetchProfile() {
		try {
			const response = await fetch('/api/user/profile');
			if (response.ok) {
				const result = await response.json();
				profileData = result.profile;
			}
		} catch (error) {
			console.error('Failed to fetch profile');
		}
	}
</script>

<BuilderNavBar bind:mode {loading} {buttonWidth} {data} />

{#if browser}
	{#key mode}
		<div
			class="z-0 flex h-full min-h-full flex-col items-center justify-start pt-4 "
			in:scale={{ duration: 1000, start: 0.997, easing: quintInOut }}
			style="background-color: {$themeStore?.currentTheme?.background}; "
		>

		
			{#if mode == 'classic'}
				<ClassicMode
					{profileData}
					refresh={fetchProfile}
					classicData={data.classicData}
					theme={currentTheme}
				/>
			{:else if mode == 'creative'}
				<CreativeMode
					{profileData}
					{session}
					refresh={fetchProfile}
					boardData={data.boardData}
					theme={currentTheme}
				/>
			{:else if mode == 'tips'}
				<TipsMode {profileData} refresh={fetchProfile} theme={currentTheme} />
			{:else}
				Something went wrong
			{/if}
		</div>
	{/key}
{/if}
