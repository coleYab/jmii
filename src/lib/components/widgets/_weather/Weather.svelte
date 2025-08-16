<script lang="ts" module>
	export const defaultProps = {
		location: '',
		refreshInterval: 300000 // 5 minutes
	};

	type WeatherProps = typeof defaultProps;
</script>

<script lang="ts">
	import { CloudSun } from 'phosphor-svelte';
	import { browser } from '$app/environment';
	import BaseWidget from '$lib/components/base/BaseWidget.svelte';

	interface Props {
		size: { width: number; height: number };
		specificProps: Record<string, any>;
		weatherData: any;
	}

	let { size, specificProps, weatherData = $bindable() }: Props = $props();

	let loading = $state(false);
	let locationError = $state<string | null>(null);

	let p = $derived({
		...defaultProps,
		...specificProps
	});

	async function getUserLocation(): Promise<string | null> {
		if (!browser) {
			return null;
		}

		try {
			// Get the browser's language/locale
			const locale = navigator.language || navigator.languages[0];
			// Extract the country code from the locale (e.g., 'en-US' -> 'US')
			const countryCode = locale.split('-')[1] || locale.split('_')[1];
			
			if (!countryCode) {
				throw new Error('Could not determine country from locale');
			}

			// Use the country code as the location
			return countryCode;
		} catch (error) {
			console.error('Locale error:', error);
			locationError = 'Could not determine location. Using default location.';
			return null;
		}
	}

	async function fetchWeather() {
		loading = true;
		try {
			let url = '/api/weather/London'; // Fallback location
			
			if (!p.location) {
				const countryCode = await getUserLocation();
				if (countryCode) {
					url = `/api/weather/${countryCode}`;
					locationError = null;
				}
			} else {
				url = `/api/weather/${p.location}`;
			}

			const response = await fetch(url);
			if (!response.ok) {
				throw new Error('Failed to fetch weather data');
			}
			const data = await response.json();
			weatherData = data;
		} catch (error) {
			console.error(error);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		fetchWeather();
		const interval = setInterval(fetchWeather, p.refreshInterval);
		return () => clearInterval(interval);
	});
</script>

<BaseWidget {size} type="Weather">
	<div class="flex h-full flex-col items-center justify-center gap-2 p-4">
		{#if loading && !weatherData}
			<div class="animate-pulse">Loading...</div>
		{:else if weatherData?.error}
			<div class="text-red-500">{weatherData.error}</div>
		{:else if weatherData}
			<div class="flex flex-col items-center gap-2">
				<CloudSun size={36} weight="duotone" />
				<span class="text-2xl font-bold">{Math.round(weatherData.main.temp)}°</span>
			</div>
			<div class="text-center text-sm capitalize">{weatherData.weather[0].description}</div>
			<div class="text-xs text-gray-500">
				{weatherData.location.name}, {weatherData.location.country}
			</div>
			{#if locationError}
				<div class="text-xs text-amber-500">{locationError}</div>
			{/if}
		{/if}
	</div>
</BaseWidget> 