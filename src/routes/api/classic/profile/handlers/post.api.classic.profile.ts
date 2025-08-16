import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { ClassicProfile } from '$src/models/ClassicProfile/ClassicProfile.model';
import { Profile } from '$src/models/Profile/Profile.model';

export default async function postHandler(locals: App.Locals) {
	await connectDB();
	const user = locals.user;
	if (!user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		console.log('🆕 Creating classic profile for user:', user.id);

		// First, get the user's profile
		const profile = await Profile.findOne({ user: user.id });
		if (!profile) {
			console.log('❌ Profile not found for user:', user.id);
			return new Response('Profile not found', { status: 404 });
		}

		console.log('✅ Found profile:', profile._id.toString());
		const profileId = profile._id.toString();

		// Check if classic profile already exists for this profile
		const existingProfile = await ClassicProfile.findOne({ profileId });
		if (existingProfile) {
			console.log('✅ Classic profile already exists, returning existing:', existingProfile._id);

			// Ensure the profile reference is set correctly (in case it was missing)
			if (!profile.classicProfile) {
				profile.classicProfile = existingProfile._id;
				await profile.save();
				console.log('✅ Updated profile with missing classic profile reference');
			}

			return json({
				id: existingProfile._id.toString(),
				profileId: existingProfile.profileId,
				linkGroups: [], // Empty for new profile
				createdAt: existingProfile.createdAt,
				updatedAt: existingProfile.updatedAt
			});
		}

		console.log('🆕 Creating new classic profile for profileId:', profileId);

		// Create classic profile with empty arrays
		const classicProfile = new ClassicProfile({
			profileId,
			links: [],
			linkGroups: []
		});
		await classicProfile.save();

		console.log('✅ Classic profile created:', classicProfile._id);

		// Update the profile to reference the classic profile
		profile.classicProfile = classicProfile._id;
		await profile.save();

		console.log('✅ Profile updated with classic profile reference');

		return json(
			{
				id: classicProfile._id.toString(),
				profileId: classicProfile.profileId,
				linkGroups: [], // Empty for new profile
				createdAt: classicProfile.createdAt,
				updatedAt: classicProfile.updatedAt
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('❌ Error creating classic profile:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
} 