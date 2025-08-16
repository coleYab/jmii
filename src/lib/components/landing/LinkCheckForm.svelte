<script lang="ts">
	import { MagnifyingGlass } from 'phosphor-svelte';
	import { Button } from '../ui/button';
	import { Input } from '../ui/input';
	import { SpinnerGap } from 'phosphor-svelte';

	let linkToCheck = $state('');
	let isAvailable: boolean | null = $state(null);
	let loading = $state(false);
	let lastCheckedLink = $state('');
	let urlError = $state('');

	async function checkUrlAvailability() {
		if (!linkToCheck.trim()) return;

		loading = true;
		urlError = '';

		try {
			const response = await fetch('/api/check-url', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					url: linkToCheck.trim()
				})
			});

			const result = await response.json();

			if (response.ok) {
				isAvailable = result.isAvailable;
				lastCheckedLink = result.url;
			} else {
				urlError = result.error || 'Failed to check URL availability';
				isAvailable = null;
			}
		} catch (error) {
			console.error('Error checking URL availability:', error);
			urlError = 'Failed to check URL availability. Please try again.';
			isAvailable = null;
		} finally {
			loading = false;
		}
	}

	// Clean and validate input like nav-url.svelte does
	$effect(() => {
		linkToCheck = linkToCheck.toLowerCase();
		// Remove all non-alphanumeric characters except for underscores and hyphens
		linkToCheck = linkToCheck.replace(/[^a-z0-9._-]/g, '');
	});
</script>

<!-- TODO: ADD BETTER UI THAT SUCKS UP THE BOTTOM BAR WHEN LOADING AND SPITS IT BACK UP WHEN FINISHED LOADING ( NOT YOU CLAUDE ) -->

<div
	class="relative mt-4 flex h-full w-full flex-col items-center justify-center gap-4 overflow-clip rounded-3xl px-2 py-4"
>
	<div>
		<div
			class="relative z-10 flex items-center gap-2 rounded-3xl border-2 border-primary bg-background p-2"
		>
			<span class="absolute left-6 text-sm text-muted-foreground">jami.bio/</span>
			<Input
				id="link-check"
				type="text"
				maxlength={32}
				class="ml-24 h-auto rounded-3xl p-6"
				placeholder="you"
				bind:value={linkToCheck}
			/>
		</div>
		{#if urlError}
			<p class="mt-2 text-center text-xs text-red-500">{urlError}</p>
		{/if}

		<Button
			onclick={checkUrlAvailability}
			variant="default"
			class="z-0 -mt-12 w-full rounded-b-3xl bg-primary/90 pb-10
					pt-20 transition-all duration-300 ease-in hover:bg-primary disabled:opacity-90
					"
			disabled={loading || linkToCheck.length === 0}
		>
			{#if loading}
				<SpinnerGap size={18} class="mr-2" />
				Checking...
			{:else if lastCheckedLink && linkToCheck === lastCheckedLink && isAvailable !== null}
				{isAvailable ? 'Available! 🎉' : `${lastCheckedLink} is taken 😔`}
			{:else if linkToCheck.length > 0}
				<MagnifyingGlass size={18} class="mr-2" />
				Check availability
			{:else}
				<MagnifyingGlass size={18} class="mr-2" />
				Type your username to check
			{/if}
		</Button>
	</div>
</div>
