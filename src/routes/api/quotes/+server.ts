import { json } from '@sveltejs/kit';

const CACHE_DURATION = 60000; // 1 min in milliseconds
let cache: {
  data: any;
  timestamp: number;
  params: string;
} | null = null;

export async function GET({ url }) {
  const category = url.searchParams.get('category') || 'all';
  const minLength = url.searchParams.get('minLength') || '50';
  const maxLength = url.searchParams.get('maxLength') || '150';

  // Create a unique key for these parameters
  const params = `${category}-${minLength}-${maxLength}`;
  const now = Date.now();

  // Check cache
  if (cache &&
    cache.params === params &&
    now - cache.timestamp < CACHE_DURATION) {
    return json(cache.data);
  }

  try {
    const apiUrl = new URL('https://quoteslate.vercel.app/api/quotes/random');

    if (category !== 'all') {
      apiUrl.searchParams.append('tags', category);
    }
    apiUrl.searchParams.append('minLength', minLength);
    apiUrl.searchParams.append('maxLength', maxLength);

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch quote');
    }

    const data = await response.json();

    // Update cache
    cache = {
      timestamp: now,
      data: data,
      params: params
    };

    return json(data);
  } catch (error) {
    console.error('Quotes API Error:', error);
    return json({ error: 'Failed to fetch quote' }, { status: 500 });
  }
} 