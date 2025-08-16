import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { ClassicProfile } from '$src/models/ClassicProfile/ClassicProfile.model';
import { Link } from '$src/models/ClassicProfile/Link.model';
import { LinkGroup } from '$src/models/ClassicProfile/LinkGroup.model';
import { Profile } from '$src/models/Profile/Profile.model';

export default async function deleteHandler(locals: App.Locals) {
	await connectDB();
	const user = locals.user;
	if (!user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		// Get the user's profile
		const profile = await Profile.findOne({ user: user.id });
		if (!profile) {
			return new Response('Profile not found', { status: 404 });
		}

		const profileId = profile._id.toString();

		const classicProfile = await ClassicProfile.findOne({ profileId });
		if (!classicProfile) {
			return new Response('Classic profile not found', { status: 404 });
		}

		// Delete all associated links and link groups
		if (classicProfile.links && classicProfile.links.length > 0) {
			await Link.deleteMany({ _id: { $in: classicProfile.links } });
		}

		if (classicProfile.linkGroups && classicProfile.linkGroups.length > 0) {
			for (const groupId of classicProfile.linkGroups) {
				await Link.deleteMany({ linkGroupId: groupId.toString() });
			}
			await LinkGroup.deleteMany({ _id: { $in: classicProfile.linkGroups } });
		}

		// Delete the classic profile
		await ClassicProfile.findByIdAndDelete(classicProfile._id);

		// Remove reference from profile
		profile.classicProfile = undefined;
		await profile.save();

		return json({ message: 'Classic profile deleted successfully' });
	} catch (error) {
		console.error('Error deleting classic profile:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
} 