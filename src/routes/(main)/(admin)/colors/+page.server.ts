import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';

export const load: PageServerLoad = async ({ locals, fetch, parent }) => {
	try {
		await connectDB();
		await parent();

		// Check if user is authenticated
		if (!locals.user) {
			throw error(401, 'Authentication required');
		}

		// Fetch all necessary data in parallel
		const [themeResponse] = await Promise.all([
			fetch('/api/theme').catch(() => null) // Fetch available themes
		]);

		let themes = [];
		if (themeResponse?.ok) {
			const themeData = await themeResponse.json();
			themes = themeData.data || [];
		}

		return {
			user: locals.user,
			themes: themes
		};
	} catch (err: unknown) {
		console.error('Error in builder page load:', err);
		throw error(500, 'Error loading builder page');
	}
};
