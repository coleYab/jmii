<script lang="ts">
	import PagePreviewCreative from './PagePreviewCreative.svelte';
	import PagePreviewClassic from './PagePreviewClassic.svelte';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { quintInOut } from 'svelte/easing';

	interface IOnboardingPreviewProps {
		profileData: any;
		mode: 'creative' | 'classic';
		focusOn?: 'profile' | 'cover' | 'widgets';
	}

	let { profileData, mode = 'creative', focusOn = 'profile' }: IOnboardingPreviewProps = $props();
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
		console.log('PagePreview mounted');
	});
</script>

{#if mounted}
	<div
		in:fly={{ y: 4, duration: 600, easing: quintInOut, delay: 300 }}
		class="mx-auto h-full w-full max-w-md -translate-y-[70px] scale-[80%] self-start overflow-hidden overflow-y-scroll rounded-2xl bg-background"
	>
		{#if mode === 'creative'}
			<PagePreviewCreative {profileData} {focusOn} />
		{:else}
			<PagePreviewClassic {profileData} {focusOn} />
		{/if}
	</div>
{/if}
