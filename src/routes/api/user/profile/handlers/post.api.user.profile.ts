import { json } from '@sveltejs/kit';
import { connectDB } from "$lib/mongo";

import { Profile } from "$src/models/Profile/Profile.model";
import { User } from '$src/models/User.model';

import type { IProfile } from "$src/models/Profile/Profile.types";

export default async function postHandler(request: Request,locals: App.Locals ) {
  await connectDB();
  const user = locals.user;
  if (!user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const data = await request.json();

    // Check if user already has a profile
    const existingProfile = await Profile.findOne({ user: user.id });
    if (existingProfile) {
      return json({ error: 'Profile already exists for this user' }, { status: 409 });
    }

    // Create new profile
    const profileData = {
      ...data,
      user: user.id
    };

    try {
      const profile = new Profile(profileData);
      await profile.save();

      // Update the user's profileId to establish bidirectional relationship
      await User.findByIdAndUpdate(user.id, { profileId: profile._id });

      // Populate related fields before returning
      await profile.populate('user');

      return json(
        {
          message: 'Profile created successfully',
          profile
        },
        { status: 201 }
      );
    } catch (saveError: any) {
      // Handle duplicate key error (E11000)
      if (saveError.code === 11000) {
        return json({ error: 'Profile already exists for this user' }, { status: 409 });
      }
      throw saveError;
    }
  } catch (error) {
    console.error('Error creating profile:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 