<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		size: { width: number; height: number };
		contributionData: any;
	}

	let { size, contributionData }: Props = $props();

	let hoveringOnDay: { contributionCount: number; date: string } | null = $state(null);

	const contCal =
		contributionData.total_contributions.user.contributionsCollection.contributionCalendar;

	const contCalLatest = contCal.weeks.slice(-10);
</script>

<div
	class="flex grow flex-col w-{size.width}/2 h-{size.height}/2 items-center justify-center gap-2 px-3 py-1"
>
	<div class=" flex  items-start justify-center gap-1">
		{#each contCalLatest as week}
			<div class="flex flex-col gap-1">
				{#each week.contributionDays as day}
					{@const color = day.color}
					<span
						tabindex="0"
						role="button"
						class="group flex h-3 w-3 items-center justify-center rounded-sm transition-all hover:scale-150 dark:hue-rotate-[180deg] dark:invert"
						style="background-color: {color};"
						onfocus={() => (hoveringOnDay = day)}
						onmouseover={() => (hoveringOnDay = day)}
						onmouseleave={() => (hoveringOnDay = null)}
					>
					</span>
				{/each}
			</div>
		{/each}
	</div>
	{#if hoveringOnDay}
		<span>{hoveringOnDay.contributionCount} contributions on {hoveringOnDay.date}</span>
	{:else}
		<span>{contCal.totalContributions} contributions this year</span>
	{/if}
</div>
