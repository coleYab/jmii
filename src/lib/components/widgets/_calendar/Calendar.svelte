<script lang="ts" module>
	export const defaultProps = {
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
	};

</script>

<script lang="ts">
	import { Calendar } from 'phosphor-svelte';
	import BaseWidget from '$lib/components/base/BaseWidget.svelte';

	interface Props {
		size: { width: number; height: number };
		specificProps: Record<string, any>;
	}

	let { size, specificProps }: Props = $props();

	let p = $derived({
		...defaultProps,
		...specificProps
	});

	// Calendar state
	let calendarData = $state({
		currentDate: new Date(),
		timezone: 'Africa/Addis_Ababa',
		error: null
	});

	// Get formatted date information using timezone
	const dateFormatter = $derived(
		new Intl.DateTimeFormat('default', {
			timeZone: calendarData.timezone,
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);

	const parts = $derived(dateFormatter.formatToParts(calendarData.currentDate));

	const dayNumber = $derived(parts.find(part => part.type === 'day')?.value);
	const dayName = $derived(parts.find(part => part.type === 'weekday')?.value);
	const month = $derived(parts.find(part => part.type === 'month')?.value);
	const year = $derived(parts.find(part => part.type === 'year')?.value);
</script>

<BaseWidget {size} type="Calendar">
	<div class="flex h-full flex-col p-4">
		<div class="flex items-center justify-between mb-2">
			<div class="flex items-center gap-2">
				<Calendar size={20} weight="duotone" />
				<span class="text-sm text-gray-600">Today</span>
			</div>
			<span class="text-xs text-gray-500">{calendarData.timezone}</span>
		</div>

		<div
			class="flex flex-grow px-2 {size.height == 2 || (size.height == 1 && size.width == 1)
				? 'flex-col items-start justify-between'
				: 'items-center justify-between'}"
		>
			{#if size.width == 2 || size.height == 2}
				<span class="text-5xl font-bold leading-none min-w-[60px]">{dayNumber}</span>
				<div class="flex flex-col">
					<span class="text-lg font-medium leading-tight">{dayName}</span>
					<span class="text-md text-gray-600 leading-tight">{month} {year}</span>
				</div>
			{:else}
				<span class="text-3xl font-bold leading-none min-w-[40px]">{dayNumber}</span>
				<div class="flex flex-col">
					<span class="text-md font-medium leading-tight">{dayName}</span>
					<span class="text-sm text-gray-600 leading-tight">{month} {year}</span>
				</div>
			{/if}
		</div>
	</div>
</BaseWidget>
