import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { ClassicProfile } from '$src/models/ClassicProfile/ClassicProfile.model';
import { Link } from '$src/models/ClassicProfile/Link.model';
import { LinkGroup } from '$src/models/ClassicProfile/LinkGroup.model';
import { Profile } from '$src/models/Profile/Profile.model';

// Ensure models are registered
Link;
LinkGroup;

export default async function getHandler(locals: App.Locals) {
	await connectDB();
	const user = locals.user;
	if (!user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		console.log('🔄 Loading Classic profile for user:', user.id);

		// First, get the user's profile
		const profile = await Profile.findOne({ user: user.id });
		if (!profile) {
			console.log('❌ Profile not found for user:', user.id);
			return new Response('Profile not found', { status: 404 });
		}

		console.log('✅ Found user profile:', profile._id.toString());

		// Then get the classic profile using the profile's _id
		const classicProfile = await ClassicProfile.findOne({ profileId: profile._id.toString() });

		if (!classicProfile) {
			console.log('❌ Classic profile not found for profileId:', profile._id.toString());
			return new Response('Classic profile not found', { status: 404 });
		}

		console.log(
			'✅ Found classic profile with',
			classicProfile.links?.length || 0,
			'standalone links (Classic mode - link groups ignored)'
		);

		// Transform the data to match the UI format - only standalone links for Classic mode
		const items = [];

		// Fetch only standalone links for Classic mode
		if (classicProfile.links && classicProfile.links.length > 0) {
			const standaloneLinks = await Link.find({ 
				_id: { $in: classicProfile.links },
				linkGroupId: null // Ensure only standalone links
			}).sort({
				sortOrder: 1
			});
			
			for (const link of standaloneLinks) {
				items.push({
					id: link._id.toString(),
					title: link.title,
					url: link.url,
					description: link.description,
					image: link.image,
					isActive: link.isActive,
					clickCount: link.clickCount,
					sortOrder: link.sortOrder,
					itemType: 'link'
				});
			}
		}

		// Note: Link groups are ignored in Classic mode

		console.log('📊 Returning', items.length, 'standalone links to UI (Classic mode)');

		return json({
			id: classicProfile._id.toString(),
			profileId: classicProfile.profileId,
			linkGroups: items, // Keep the same property name for UI compatibility
			createdAt: classicProfile.createdAt,
			updatedAt: classicProfile.updatedAt
		});
	} catch (error) {
		console.error('❌ Error getting classic profile:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
} 