import { json } from '@sveltejs/kit';
import { saveBoardState, getBoardState } from '$src/stores/board/board.service';
import { CreativeProfile } from '$src/models/CreativeProfile/CreativeProfile.model';
import { CreativeProfileVersion } from '$src/models/CreativeProfile/CreativeProfileVersion.model';
import { connectDB } from '$lib/mongo';
import { getDefaultBoardState } from '$src/stores/board/board.config';

export async function GET({ locals }) {
  await connectDB();
  const user = locals.user;
  if (!user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Find the user's profile to get the profileId
    const Profile = (await import('$src/models/Profile/Profile.model')).default;
    const profile = await Profile.findOne({ user: user.id }).lean() as any;
    
    if (!profile) {
      return new Response('Profile not found', { status: 404 });
    }
    
    const board = await getBoardState(profile._id.toString());
    return json(board || getDefaultBoardState());
  } catch (error) {
    console.error('Error getting board state:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST({ request, locals }) {
  await connectDB();
  const user = locals.user;
  console.log('User:', user);
  if (!user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { widgets, rows, columns, userProfile, action } = await request.json();
    
    // Find the user's profile to get the profileId
    const Profile = (await import('$src/models/Profile/Profile.model')).default;
    const profile = await Profile.findOne({ user: user.id }).lean() as any;
    
    if (!profile) {
      return new Response('Profile not found', { status: 404 });
    }
    
    console.log('User Profile:', userProfile);
    // When action === 'snapshot', clone current creative profile state into a version doc
    if (action === 'snapshot') {
      // Ensure we have the latest saved board before snapshotting
      const saved = await saveBoardState(profile._id.toString(), widgets, rows, columns, userProfile);

      // Find the current creative profile document to link as source
      const currentCreative = await CreativeProfile.findOne({ profileId: profile._id.toString() });

      const version = await CreativeProfileVersion.create({
        profileId: profile._id.toString(),
        sourceCreativeProfileId: currentCreative?._id,
        snapshot: saved
      });

      return json({ ok: true, versionId: version._id.toString(), snapshot: saved });
    }

    const board = await saveBoardState(profile._id.toString(), widgets, rows, columns, userProfile);
    return json(board);
  } catch (error) {
    console.error('Error saving board state:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 