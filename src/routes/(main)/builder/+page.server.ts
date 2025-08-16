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
		const [profileResponse, creativeResponse, classicResponse, themeResponse] = await Promise.all([
			fetch('/api/user/profile'),
			fetch('/api/creative').catch(() => null), // Don't fail if creative data isn't available
			fetch('/api/classic/profile').catch(() => null), // Don't fail if classic data isn't available
			fetch('/api/theme').catch(() => null) // Fetch available themes
		]);

		const profileData = await profileResponse.json();
		
		let creativeData = null;
		if (creativeResponse?.ok) {
			creativeData = await creativeResponse.json();
		}

		let classicData = null;
		if (classicResponse?.ok) {
			classicData = await classicResponse.json();
		}

		let themes = [];
		if (themeResponse?.ok) {
			const themeData = await themeResponse.json();
			themes = themeData.data || [];
		}

		// Get user's selected theme or default theme
		const userTheme = profileData.profile?.theme;
		const selectedTheme = themes.find((t: any) => t.id === userTheme) || themes.find((t: any) => t.isDefault) || themes[0] || null;

		return {
			user: locals.user,
			profile: profileData.profile,
			boardData: creativeData, // Include board data for server-side rendering
			classicData: classicData, // Include classic data for server-side rendering
			themes: themes, // Available themes
			selectedTheme: selectedTheme // User's current theme
		};
	} catch (err: unknown) {
		console.error('Error in builder page load:', err);
		throw error(500, 'Error loading builder page');
	}
};
