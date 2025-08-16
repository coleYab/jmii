import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { Profile } from '$src/models/Profile/Profile.model';
import { Theme } from '$src/models/Theme.model';

// PUT - Update user's theme preference
export const PUT: RequestHandler = async ({ request, locals }) => {
	await connectDB();
	
	const user = locals.user;
	if (!user?.id) {
		console.log('❌ Theme update failed: User not authenticated');
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const { themeId } = await request.json();
		console.log('🎨 Theme update request:', { userId: user.id, themeId });
		
		if (!themeId) {
			console.log('❌ Theme update failed: No themeId provided');
			return json({ error: 'Theme ID is required' }, { status: 400 });
		}

		// Verify theme exists and is active
		const theme = await Theme.findOne({ id: themeId, isActive: true });
		if (!theme) {
			console.log('❌ Theme update failed: Theme not found or inactive:', themeId);
			return json({ error: 'Theme not found or inactive' }, { status: 404 });
		}

		console.log('✅ Theme found:', { id: theme.id, name: theme.name });

		// Get current profile to compare
		const currentProfile = await Profile.findOne({ user: user.id });
		console.log('📋 Current profile theme:', currentProfile?.theme);

		// Update user's profile with new theme
		const profile = await Profile.findOneAndUpdate(
			{ user: user.id },
			{ theme: themeId },
			{ new: true }
		);

		if (!profile) {
			console.log('❌ Theme update failed: Profile not found for user:', user.id);
			return json({ error: 'Profile not found' }, { status: 404 });
		}

		console.log('✅ Profile updated successfully:', { 
			userId: user.id, 
			oldTheme: currentProfile?.theme, 
			newTheme: profile.theme 
		});

		// Increment theme usage count
		try {
			await theme.incrementUsage();
			console.log('📈 Theme usage count incremented');
		} catch (error) {
			console.warn('⚠️ Failed to increment theme usage count:', error);
		}

		return json({
			message: 'Theme updated successfully',
			theme: {
				id: theme.id,
				name: theme.name
			},
			profile: {
				id: profile._id,
				theme: profile.theme
			}
		});
	} catch (error) {
		console.error('💥 Error updating theme:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}; 