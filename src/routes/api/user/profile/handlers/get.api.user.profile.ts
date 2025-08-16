import { json } from '@sveltejs/kit';
import { connectDB } from "$lib/mongo";

import { Profile } from "$src/models/Profile/Profile.model";
import { User } from '$src/models/User.model';

import type { IProfile } from "$src/models/Profile/Profile.types";
import { ClassicProfile } from '$src/models/ClassicProfile/ClassicProfile.model';

// Register the profile for a populate 
ClassicProfile

export default async function getHandler(locals: App.Locals, url: URL) {
  await connectDB();
  const user = locals.user;
  if (!user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const profileId = url.searchParams.get('id');

    if (profileId) {
      // Get specific profile by ID
      const profile: IProfile = await Profile.findById(profileId)
        .populate('user')
        .populate('classicProfile');

      if (!profile) {
        return json({ error: 'Profile not found' }, { status: 404 });
      }

      return json({ profile });
    } else {
      // Get user's profile
      let profile = await Profile.findOne({ user: user.id })
        .populate('user')
        .populate('classicProfile');

      if (!profile) {
        // Create a new profile if one doesn't exist
        const newProfileData = {
          displayName: user.name || user.email.split('@')[0] || 'User',
          category: 'general',
          bio: '',
          tipMeText: 'Leave Tip',
          showEmail: false,
          tipsEnabled: true,
          firstTime: true,
          defaultLayout: 'tips',
          mode: 'classic',
          user: user.id
        };

        try {
          profile = new Profile(newProfileData);
          await profile.save();

          // Update the user's profileId to establish bidirectional relationship
          await User.findByIdAndUpdate(user.id, { profileId: profile._id });

          // Populate related fields after creation
          await profile.populate('user');
        } catch (saveError: any) {
          // Handle duplicate key error (E11000) - profile might have been created by another request
          if (saveError.code === 11000) {
            console.log('Profile creation race condition detected, fetching existing profile...');
            profile = await Profile.findOne({ user: user.id })
              .populate('user')
              .populate('classicProfile');

            if (!profile) {
              // If still no profile found, this is a different error
              throw saveError;
            }
          } else {
            throw saveError;
          }
        }
      }

      return json({ profile });
    }
  } catch (error) {
    console.error('Error getting profile:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 