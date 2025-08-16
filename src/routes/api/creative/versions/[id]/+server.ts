import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { CreativeProfileVersion } from '$src/models/CreativeProfile/CreativeProfileVersion.model';
import { CreativeProfile } from '$src/models/CreativeProfile/CreativeProfile.model';
import { Profile } from '$src/models/Profile/Profile.model';

export async function POST({ locals, params }: { locals: App.Locals; params: { id: string } }) {
	await connectDB();
	const user = locals.user;
	if (!user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const profile = await Profile.findOne({ user: user.id });
		if (!profile) {
			return new Response('Profile not found', { status: 404 });
		}

		const snapshot = await CreativeProfileVersion.findOne({ 
			_id: params.id,
			profileId: profile._id.toString()
		});
		
		if (!snapshot) {
			return new Response('Snapshot not found', { status: 404 });
		}

		// Restore the snapshot to the creative profile
		await CreativeProfile.findOneAndUpdate(
			{ profileId: profile._id.toString() },
			{
				widgets: snapshot.snapshot.widgets,
				rows: snapshot.snapshot.rows,
				columns: snapshot.snapshot.columns,
				userProfile: snapshot.snapshot.userProfile,
				updatedAt: new Date()
			},
			{ upsert: true }
		);

		return json({ ok: true, message: 'Version restored successfully' });
	} catch (error) {
		console.error('Error restoring creative version:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
}
