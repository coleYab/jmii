<script lang="ts" module>
	export const defaultProps = {
		category: 'all',
		refreshInterval: 3600000, // 1 hour
		showAuthor: true,
		minLength: 50,
		maxLength: 150
	};

	type QuotesProps = typeof defaultProps;

	interface QuoteData {
		text: string;
		author: string;
		tags: string[];
		loading: boolean;
		error: string | null;
	}

	// Cache store
	import { writable } from 'svelte/store';
	
	interface CacheData {
		timestamp: number;
		data: QuoteData;
		params: string;
	}

	export const quoteCache = writable<CacheData | null>(null);
</script>

<script lang="ts">
	import { Notebook } from 'phosphor-svelte';
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

	// Quote state
	let quoteData = $state<QuoteData>({
		text: '',
		author: '',
		tags: [],
		loading: true,
		error: null
	});

	async function fetchQuote() {
		const params = new URLSearchParams({
			category: p.category,
			minLength: p.minLength.toString(),
			maxLength: p.maxLength.toString()
		});

		const paramsString = params.toString();
		const now = Date.now();
		
		// Check cache
		const cached = $quoteCache;
		if (cached && 
			cached.params === paramsString && 
			now - cached.timestamp < p.refreshInterval) {
			quoteData = cached.data;
			return;
		}

		try {
			quoteData.loading = true;
			const response = await fetch(`/api/quotes?${params}`);
			if (!response.ok) {
				throw new Error('Failed to fetch quote');
			}
			
			const data = await response.json();
			
			if (data.error) {
				throw new Error(data.error);
			}

			const newQuoteData = {
				text: data.quote,
				author: data.author,
				tags: data.tags,
				loading: false,
				error: null
			};

			// Update cache
			quoteCache.set({
				timestamp: now,
				data: newQuoteData,
				params: paramsString
			});
			
			quoteData = newQuoteData;
		} catch (error) {
			console.error('Error fetching quote:', error);
			quoteData.error = 'Failed to fetch quote';
		} finally {
			quoteData.loading = false;
		}
	}

	$effect(() => {
		fetchQuote();
	});

	// Compute text sizes based on widget dimensions and quote length
	let textSize = $derived(() => {
		const quoteLength = quoteData.text.length;
		
		// Base size based on widget dimensions
		let baseSize;
		if (size.width === 1 && size.height === 1) baseSize = 'sm';
		else if (size.width === 2 && size.height === 1) baseSize = 'base';
		else if (size.width === 1 && size.height === 2) baseSize = 'base';
		else if (size.width === 2 && size.height === 2) baseSize = 'lg';
		else baseSize = 'sm';

		// Adjust size based on quote length
		if (quoteLength < 80) {
			// Short quotes get bigger
			switch (baseSize) {
				case 'sm': return 'text-base';
				case 'base': return 'text-lg';
				case 'lg': return 'text-xl';
				default: return 'text-base';
			}
		} else if (quoteLength > 120) {
			// Long quotes get smaller
			switch (baseSize) {
				case 'lg': return 'text-base';
				case 'base': return 'text-sm';
				case 'sm': return 'text-xs';
				default: return 'text-sm';
			}
		}

		// Medium length quotes use the base size
		return `text-${baseSize}`;
	});

	let authorSize = $derived(() => {
		const quoteLength = quoteData.text.length;
		
		// Base size based on widget dimensions
		if (size.width === 2 && size.height === 2) {
			return quoteLength < 80 ? 'text-base' : 'text-sm';
		}
		if ((size.width === 2 && size.height === 1) || (size.width === 1 && size.height === 2)) {
			return quoteLength < 80 ? 'text-sm' : 'text-xs';
		}
		return 'text-xs';
	});

	let iconSize = $derived(() => {
		if (size.width === 2 && size.height === 2) return 32;
		if ((size.width === 2 && size.height === 1) || (size.width === 1 && size.height === 2)) return 28;
		return 24;
	});
</script>

<BaseWidget {size} type="Quotes">
	<div class="flex h-full flex-col items-center justify-center p-4 text-center">
		<div class="mb-4">
			<Notebook size={iconSize()} weight="duotone" />
		</div>
		{#if quoteData.loading}
			<div class="animate-pulse">Loading...</div>
		{:else if quoteData.error}
			<div class="text-red-500">{quoteData.error}</div>
		{:else}
			<p class="{textSize} font-medium italic leading-relaxed">{quoteData.text}</p>
			{#if p.showAuthor && quoteData.author}
				<p class="mt-2 {authorSize} text-gray-500">— {quoteData.author}</p>
			{/if}
		{/if}
	</div>
</BaseWidget> 