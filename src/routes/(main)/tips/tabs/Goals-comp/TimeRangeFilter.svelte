<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { RangeCalendar } from '$lib/components/ui/range-calendar/index.js';

	import {
		CalendarDateTime,
		getLocalTimeZone,
		today,
		type DateValue,
		DateFormatter
	} from '@internationalized/date';
	import { Clock, Calendar } from 'phosphor-svelte';
	
	import { onDestroy, onMount } from 'svelte';

	interface ITimeRangeFilterProps {
		setTimeRange: (range: [DateValue, DateValue]) => boolean;
		filterOptions: {
			timeRangeFilter: [DateValue, DateValue];
			selectedTimeRange: string;
		};
	}

	let { setTimeRange, filterOptions = $bindable() }: ITimeRangeFilterProps = $props();

	const yearFormatter = new DateFormatter('en-US', {
		year: 'numeric'
	});
	const monthFormatter = new DateFormatter('en-US', {
		month: 'short'
	});

	const unixZero = new CalendarDateTime(1970, 1, 1, 0, 0, 0, 0);
	const todayDateNormal = new Date();
	const todayDate = new CalendarDateTime(
		todayDateNormal.getFullYear(),
		todayDateNormal.getMonth() + 1, // Months are 0-indexed in JavaScript but 1-indexed in CalendarDateTime
		todayDateNormal.getDate(),
		todayDateNormal.getHours(),
		todayDateNormal.getMinutes(),
		todayDateNormal.getSeconds(),
		todayDateNormal.getMilliseconds()
	);

	// Just Today - from now till end of day
	const todayDateStart = todayDate;
	const todayDateEnd = todayDate.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });

	// Next 7 days - from now
	const next7DaysEnd = todayDate
		.add({ days: 7 })
		.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });

	// Next 30 days - from now
	const next30DaysEnd = todayDate
		.add({ days: 30 })
		.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });

	// Rest of This Month - from now till end of month
	const endOfMonthDate = todayDate.set({
		day: 31,
		hour: 23,
		minute: 59,
		second: 59,
		millisecond: 999
	}); // Constrained so will be 28 on FEB

	// Next Month - full month
	const nextMonthStartdate = todayDate
		.add({ months: 1 })
		.set({ day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 });
	const nextMonthEnddate = todayDate
		.add({ months: 1 })
		.set({ day: 31, hour: 23, minute: 59, second: 59, millisecond: 999 });

	// Rest of This Year - from now till end of year
	const thisYearEnddate = todayDate.set({
		month: 12,
		day: 31,
		hour: 23,
		minute: 59,
		second: 59,
		millisecond: 999
	});

	// Next Year - full year
	const nextYearStartdate = todayDate
		.add({ years: 1 })
		.set({ month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 });
	const nextYearEnddate = todayDate
		.add({ years: 1 })
		.set({ month: 12, day: 31, hour: 23, minute: 59, second: 59, millisecond: 999 });

	let popoverOpen = $state(false);

	// Initialize calendar range values
	let calendarValue = $state({
		start: filterOptions.timeRangeFilter[0],
		end: filterOptions.timeRangeFilter[1]
	});

	// Define time range options
	const timeRanges = [
		{ value: 'today', label: 'Today (from now)', startDate: todayDateStart, endDate: todayDateEnd },
		{
			value: 'next7days',
			label: 'Next 7 Days',
			startDate: todayDate,
			endDate: next7DaysEnd
		},
		{
			value: 'next30days',
			label: 'Next 30 Days',
			startDate: todayDate,
			endDate: next30DaysEnd
		},
		{
			value: 'restOfMonth',
			label: `Rest of ${monthFormatter.format(new Date(todayDate.year, todayDate.month - 1, 1))}`,
			startDate: todayDate,
			endDate: endOfMonthDate
		},
		{
			value: 'nextMonth',
			label: `Next Month [${monthFormatter.format(new Date(nextMonthStartdate.year, nextMonthStartdate.month - 1, 1))}]`,
			startDate: nextMonthStartdate,
			endDate: nextMonthEnddate
		},
		{
			value: 'restOfYear',
			label: `Rest of ${yearFormatter.format(new Date(todayDate.year, 0, 1))}`,
			startDate: todayDate,
			endDate: thisYearEnddate
		},
		{
			value: 'nextYear',
			label: `Next Year [${yearFormatter.format(new Date(nextYearStartdate.year, 0, 1))}]`,
			startDate: nextYearStartdate,
			endDate: nextYearEnddate
		},
		{
			value: 'custom',
			label: 'Custom Range',
			startDate: filterOptions.timeRangeFilter[0],
			endDate: filterOptions.timeRangeFilter[1]
		}
	];

	let loading = $state(false);
	function handleRangeChange(value: string) {
		loading = true;
		filterOptions.selectedTimeRange = value as
			| 'today'
			| 'next7days'
			| 'next30days'
			| 'restOfMonth'
			| 'nextMonth'
			| 'restOfYear'
			| 'nextYear'
			| 'custom';
		try {
			const range = timeRanges.find((range) => range.value === value);

			if (range && filterOptions.selectedTimeRange !== 'custom') {
				setTimeRange([range.startDate, range.endDate]);
			} else {
				setTimeRange([filterOptions.timeRangeFilter[0], filterOptions.timeRangeFilter[1]]);
				popoverOpen = true;
			}
		} catch (error) {
			setTimeRange([filterOptions.timeRangeFilter[0], filterOptions.timeRangeFilter[1]]);
		} finally {
			loading = false;
		}
	}

	// Handle calendar range change
	function handleCalendarChange() {
		if (calendarValue.start && calendarValue.end) {
			const startDateTime = calendarValue.start.set({
				hour: 0,
				minute: 0,
				second: 0,
				millisecond: 0
			});
			const endDateTime = calendarValue.end.set({
				hour: 23,
				minute: 59,
				second: 59,
				millisecond: 999
			});

			loading = setTimeRange([startDateTime, endDateTime]) != true;
			filterOptions.selectedTimeRange = 'custom';
			popoverOpen = false;
		}
	}

	onMount(() => {
		console.log('mounted');
	});
	onDestroy(() => {
		console.log('destroyed');
	});
</script>

<div class="flex flex-col items-center justify-center gap-2 sm:flex-row">
	<HoverCard.Root>
		<HoverCard.Trigger
			><Clock
				size={18}
				weight="duotone"
				class="text-primary {loading ? 'text-red-500' : ''} sm:w-5 sm:h-5"
			/></HoverCard.Trigger
		>
		<HoverCard.Content class="w-auto px-1 py-0.5">
			{#if filterOptions.timeRangeFilter[0] && filterOptions.timeRangeFilter[1]}
				<span class="flex flex-col gap-1 text-xs font-medium text-muted-foreground sm:flex-row sm:gap-2 sm:text-sm">
					<span class="flex flex-col gap-1 whitespace-nowrap sm:flex-row sm:gap-2">
						{filterOptions.timeRangeFilter[0]?.toDate(getLocalTimeZone()).toLocaleDateString()}
						<span class="hidden sm:inline"> - </span>
						{filterOptions.timeRangeFilter[0]?.toDate(getLocalTimeZone()).toLocaleTimeString()}
					</span>
					<span class="hidden sm:inline"> - </span>
					<span class="flex flex-col gap-1 whitespace-nowrap sm:flex-row sm:gap-2">
						{filterOptions.timeRangeFilter[1]?.toDate(getLocalTimeZone()).toLocaleDateString()}
						<span class="hidden sm:inline"> - </span>
						{filterOptions.timeRangeFilter[1]?.toDate(getLocalTimeZone()).toLocaleTimeString()}
					</span>
				</span>
			{/if}
		</HoverCard.Content>
	</HoverCard.Root>

	<Select.Root
		type="single"
		onValueChange={(value) => handleRangeChange(value)}
		value={filterOptions.selectedTimeRange}
	>
		<Select.Trigger id="time-range" class="w-full text-xs sm:w-[180px] sm:text-sm">
			{timeRanges.find((range) => range.value === filterOptions.selectedTimeRange)?.label ||
				'Select time range'}
		</Select.Trigger>
		<Select.Content>
			{#each timeRanges as range}
				<Select.Item value={range.value} class="text-xs sm:text-sm">{range.label}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>

	<Popover.Root open={popoverOpen} onOpenChange={(open) => (popoverOpen = open)}>
		<Popover.Trigger>
			<span
				class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:h-10 sm:w-10 sm:text-sm"
			>
				<Calendar size={16} class="sm:w-5 sm:h-5" />
			</span>
		</Popover.Trigger>
		<Popover.Content class="w-[95vw] max-w-[320px] p-0 sm:w-auto">
			<div class="p-3">
				<RangeCalendar
					preventDeselect
					minValue={today(getLocalTimeZone())}
					bind:value={calendarValue}
					class="rounded-md border"
				/>
				<div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
					<button
						type="button"
						class="inline-flex h-9 items-center justify-center rounded-md border border-input px-3 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:text-sm"
						onclick={() => (popoverOpen = false)}
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={!calendarValue.start || !calendarValue.end}
						class="inline-flex h-9 items-center justify-center bg-primary px-3 text-xs font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:text-sm"
						onclick={handleCalendarChange}
					>
						Apply
					</button>
				</div>
			</div>
		</Popover.Content>
	</Popover.Root>
</div>
