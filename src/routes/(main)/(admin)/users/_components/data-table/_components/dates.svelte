<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import prettyMs from 'pretty-ms';
	import { onMount } from 'svelte';

	import type { UserRow } from '../columns';

	let { row }: { row: UserRow } = $props();

	let createdDelta = $state('');
	let updatedDelta = $state('');
	let createdDeltaColor = $state('');
	let updatedDeltaColor = $state('');

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
			return 'bg-gray-100 text-gray-800';
		}
	}

	function updateTimeDeltas() {
		const now = new Date();
		const created = new Date(row.createdAt);
		const updated = new Date(row.updatedAt);
		
		const createdDeltaMs = now.getTime() - created.getTime();
		const updatedDeltaMs = now.getTime() - updated.getTime();

		// Format the time deltas
		createdDelta = prettyMs(createdDeltaMs, { compact: true });
		updatedDelta = prettyMs(updatedDeltaMs, { compact: true });

		// Set colors based on time deltas
		createdDeltaColor = getTimeDeltaColor(createdDeltaMs);
		updatedDeltaColor = getTimeDeltaColor(updatedDeltaMs);
	}

	onMount(() => {
		updateTimeDeltas();
		// Update every minute
		const interval = setInterval(updateTimeDeltas, 60000);
		return () => clearInterval(interval);
	});
</script>

<div class="flex flex-row gap-2">
	<div class="flex flex-col border-l pl-2">
		<div class="text-sm">
			{new Date(row.createdAt).toLocaleDateString()}
		</div>
		<div class="flex items-center gap-2">
			<div class="text-xs opacity-50">
				{new Date(row.createdAt).toLocaleTimeString()}
			</div>
			<span class="rounded-full px-1 py-0.5 text-xs font-medium {createdDeltaColor}">
				{createdDelta} ago
			</span>
		</div>
	</div>
	<div class="flex flex-col border-l pl-2">
		<div class="text-sm">
			${new Date(row.updatedAt).toLocaleDateString()}
		</div>
		<div class="flex items-center gap-2">
			<div class="text-xs opacity-50">
				{new Date(row.updatedAt).toLocaleTimeString()}
			</div>
			<span class="rounded-full px-1 py-0.5 text-xs font-medium {updatedDeltaColor}">
				{updatedDelta} ago
			</span>
		</div>
	</div>
</div>
