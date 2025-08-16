<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Rows, SquaresFour } from 'phosphor-svelte';

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

	let selectedMode: 'creative' | 'classic' = $derived(profileData?.mode);
	let saving = $state(false);

	const modes = [
		{
			id: 'creative' as const,
			name: 'Creative Mode',
			icon: SquaresFour,
			description: 'Express yourself with dynamic layout and media driven content'
		},
		{
			id: 'classic' as const,
			name: 'Classic Mode',
			icon: Rows,
			description: 'Keep it simple with just a collection of your links'
		},
		{
			id: 'tips' as const,
			name: 'Tips Mode',
			icon: SquaresFour,
			description: 'Don\'t show any links just for tipping purpose only'
		}
	];

	// Save profile mode to API
	async function saveProfileMode(mode: 'creative' | 'classic' | 'tips') {
		if (saving) return;

		saving = true;
		try {
			const updateData = { mode };

			const response = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updateData)
			});

			if (response.ok) {
				console.log('Profile mode updated successfully');
				onRefresh();
			} else {
				const errorData = await response.json();
				console.error('Failed to update profile mode:', errorData.error);
			}
		} catch (error) {
			console.error('Error updating profile mode:', error);
		} finally {
			saving = false;
		}
	}
</script>

<div class="space-y-6 sm:space-y-8">
	<div class="text-center">
		<h2 class="mb-2 text-lg font-bold text-foreground sm:text-xl">Choose Your Style!</h2>
		<p class="text-sm text-muted-foreground sm:text-base">How do you want to express yourself?</p>
	</div>

	<div class="flex flex-col gap-3 px-2 sm:gap-4 sm:px-6">
		<!-- Mode Selection Cards -->
		{#each modes as mode}
			<Button
				onclick={() => saveProfileMode(mode.id)}
				variant="outline"
				disabled={saving}
				class="h-auto w-full rounded-2xl p-3 sm:rounded-3xl sm:p-4 {selectedMode === mode.id
					? 'ring-2 ring-primary'
					: ''}"
			>
				<div class="flex size-12 items-center justify-center sm:size-16">
					<mode.icon weight="duotone" class="!size-6 sm:!size-8" />
				</div>
				<div class="w-full text-left">
					<div class="flex items-center justify-between">
						<h3 class="text-sm font-semibold text-foreground sm:text-base">{mode.name}</h3>
						{#if selectedMode === mode.id}
							<span class="text-green-600 text-sm sm:text-base">✓</span>
						{/if}
					</div>
					<p class="mt-1 text-wrap text-xs text-muted-foreground sm:text-sm">{mode.description}</p>
				</div>
			</Button>
		{/each}
	</div>

	{#if saving}
		<div class="flex items-center justify-center py-2">
			<div
				class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
			></div>
			<span class="ml-2 text-xs text-muted-foreground sm:text-sm">Saving mode...</span>
		</div>
	{/if}
</div>
