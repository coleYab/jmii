import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { ClassicProfileVersion } from '$src/models/ClassicProfile/ClassicProfileVersion.model';
import { Profile } from '$src/models/Profile/Profile.model';

export async function GET({ locals }) {
	await connectDB();
	const user = locals.user;
	if (!user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		// Find the user's profile to get the profileId
		const profile = await Profile.findOne({ user: user.id }).lean() as any;
		
		if (!profile) {
			return new Response('Profile not found', { status: 404 });
		}

		// Get versions for this profile
		const versions = await ClassicProfileVersion.find({ 
			profileId: profile._id.toString() 
		})
		.sort({ createdAt: -1 })
		.limit(10)
		.lean();

		// Transform versions to include link count
		const transformedVersions = versions.map(version => ({
			id: version._id.toString(),
			createdAt: version.createdAt,
			linkCount: version.links?.length || 0,
			title: `Classic Version ${new Date(version.createdAt).toLocaleDateString()}`
		}));

		return json({ versions: transformedVersions });
	} catch (error) {
		console.error('Error getting classic versions:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
}
