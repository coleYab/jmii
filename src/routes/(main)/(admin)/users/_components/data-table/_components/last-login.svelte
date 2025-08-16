<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import prettyMs from 'pretty-ms';
	import { onMount } from 'svelte';

	import type { UserRow } from '../columns';

	let { row }: { row: UserRow } = $props();

	let lastLoginDelta = $state('');
	let lastLoginDeltaColor = $state('');

	function getTimeDeltaColor(delta: number): string {
		const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
		const oneWeek = 7 * oneDay;
		const oneMonth = 30 * oneDay;

		if (delta < oneDay) { // Less than 1 day
			return 'bg-green-100 text-green-800';
		} else if (delta < oneWeek) { // Less than 1 week
			return 'bg-blue-100 text-blue-800';
		} else if (delta < oneMonth) { // Less than 1 month
			return 'bg-amber-100 text-amber-800';
		} else {
			return 'bg-red-100 text-red-800';
		}
	}

	function updateTimeDeltas() {
		if (!row.lastLogin) {
			lastLoginDelta = 'Never';
			lastLoginDeltaColor = 'bg-gray-100 text-gray-800';
			return;
		}

		const now = new Date();
		const lastLogin = new Date(row.lastLogin);
		
		const lastLoginDeltaMs = now.getTime() - lastLogin.getTime();

		// Format the time delta
		lastLoginDelta = prettyMs(lastLoginDeltaMs, { compact: true });

		// Set color based on time delta
		lastLoginDeltaColor = getTimeDeltaColor(lastLoginDeltaMs);
	}

	onMount(() => {
		updateTimeDeltas();
		// Update every minute
		const interval = setInterval(updateTimeDeltas, 60000);
		return () => clearInterval(interval);
	});
</script>

<div class="flex flex-col">
	{#if row.lastLogin}
		<div class="text-sm">
			{new Date(row.lastLogin).toLocaleDateString()}
		</div>
		<div class="flex items-center gap-2">
			<div class="text-xs opacity-50">
				{new Date(row.lastLogin).toLocaleTimeString()}
			</div>
			<span class="rounded-full px-1 py-0.5 text-xs font-medium {lastLoginDeltaColor}">
				{lastLoginDelta} ago
			</span>
		</div>
	{:else}
		<div class="text-sm text-muted-foreground">Never logged in</div>
		<span class="rounded-full px-1 py-0.5 text-xs font-medium {lastLoginDeltaColor}">
			{lastLoginDelta}
		</span>
	{/if}
</div> 