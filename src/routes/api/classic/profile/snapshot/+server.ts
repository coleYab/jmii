import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { Profile } from '$src/models/Profile/Profile.model';
import { ClassicProfile } from '$src/models/ClassicProfile/ClassicProfile.model';
import { Link } from '$src/models/ClassicProfile/Link.model';
import { ClassicProfileVersion } from '$src/models/ClassicProfile/ClassicProfileVersion.model';

export async function POST({ locals }) {
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

    const classic = await ClassicProfile.findOne({ profileId: profile._id.toString() });
    if (!classic) {
      return new Response('Classic profile not found', { status: 404 });
    }

    // Fetch standalone links only (L0)
    const standaloneLinks = await Link.find({
      _id: { $in: classic.links },
      linkGroupId: null
    }).sort({ sortOrder: 1 });

    const linksSnapshot = standaloneLinks.map((l) => ({
      title: l.title,
      url: l.url,
      description: l.description,
      image: l.image,
      sortOrder: l.sortOrder,
      isActive: l.isActive
    }));

    const version = await ClassicProfileVersion.create({
      profileId: profile._id.toString(),
      sourceClassicProfileId: classic._id,
      links: linksSnapshot
    });

    return json({ ok: true, versionId: version._id.toString(), count: linksSnapshot.length });
  } catch (error) {
    console.error('Error creating classic snapshot:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}


