import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { Profile } from '$src/models/Profile/Profile.model';
import { ClassicProfile } from '$src/models/ClassicProfile/ClassicProfile.model';
import { Link } from '$src/models/ClassicProfile/Link.model';
import { ClassicProfileVersion } from '$src/models/ClassicProfile/ClassicProfileVersion.model';

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

    const snapshot = await ClassicProfileVersion.findOne({ 
      _id: params.id,
      profileId: profile._id.toString()
    });
    
    if (!snapshot) {
      return new Response('Snapshot not found', { status: 404 });
    }

    // Get or create classic profile
    let classicProfile = await ClassicProfile.findOne({ profileId: profile._id.toString() });
    if (!classicProfile) {
      classicProfile = new ClassicProfile({
        profileId: profile._id.toString(),
        links: [],
        linkGroups: []
      });
    }

    // Delete existing links
    if (classicProfile.links && classicProfile.links.length > 0) {
      await Link.deleteMany({ _id: { $in: classicProfile.links } });
    }

    // Create new links from snapshot
    const newLinks = [];
    for (const linkData of snapshot.links) {
      const link = new Link({
        title: linkData.title,
        url: linkData.url,
        description: linkData.description,
        image: linkData.image,
        sortOrder: linkData.sortOrder,
        isActive: linkData.isActive
      });
      await link.save();
      newLinks.push(link._id);
    }

    // Update classic profile with new links
    classicProfile.links = newLinks;
    classicProfile.linkGroups = []; // Classic mode doesn't use link groups
    await classicProfile.save();

    return json({ ok: true, restoredLinks: newLinks.length });
  } catch (error) {
    console.error('Error restoring classic snapshot:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
