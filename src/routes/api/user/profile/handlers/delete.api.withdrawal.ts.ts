import { json } from '@sveltejs/kit';
import { connectDB } from "$lib/mongo";

import { Profile } from "$src/models/Profile/Profile.model";


export default async function deleteHandler(locals: App.Locals, url: URL) {
  await connectDB();
	const user = locals.user;
	if (!user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const profileId = url.searchParams.get('id');

		let profile;

		if (profileId) {
			// Delete specific profile by ID (check ownership)
			profile = await Profile.findById(profileId);
			if (!profile) {
				return json({ error: 'Profile not found' }, { status: 404 });
			}

			// Check if user owns this profile
			if (profile.user.toString() !== user.id) {
				return json({ error: 'Forbidden - Not your profile' }, { status: 403 });
			}

			await Profile.findByIdAndDelete(profileId);
		} else {
			// Delete user's profile
			const result = await Profile.findOneAndDelete({ user: user.id });
			if (!result) {
				return json({ error: 'Profile not found' }, { status: 404 });
			}
		}

		return json({
			message: 'Profile deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting profile:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
} 