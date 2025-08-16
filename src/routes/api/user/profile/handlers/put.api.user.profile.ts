import { json } from '@sveltejs/kit';
import { connectDB } from "$lib/mongo";

import { Profile } from "$src/models/Profile/Profile.model";
import chalk from 'chalk';
import { auth } from '$lib/auth';
import { authClient } from '$lib/auth-client';
import { User } from '$src/models/User.model';


export default async function putHandler(request: Request, locals: App.Locals, url: URL) {
  await connectDB();
  const user = locals.user;
  if (!user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const data = await request.json();
    const profileId = url.searchParams.get('id');

    let profile;

    if (profileId) {
      // Update specific profile by ID (check ownership)
      profile = await Profile.findById(profileId);
      if (!profile) {
        return json({ error: 'Profile not found' }, { status: 404 });
      }

      // Check if user owns this profile
      if (profile.user.toString() !== user.id) {
        return json({ error: 'Forbidden - Not your profile' }, { status: 403 });
      }
    } else {
      // Update user's profile
      profile = await Profile.findOne({ user: user.id });
      if (!profile) {
        return json({ error: 'Profile not found' }, { status: 404 });
      }
    }

    // Check for URL uniqueness if URL is being updated
    if (data.url) {
      const existingProfileWithUrl = await Profile.findOne({ 
        url: data.url, 
        _id: { $ne: profile._id } // Exclude current profile
      });
      
      if (existingProfileWithUrl) {
        return json({ error: 'URL already taken by another profile' }, { status: 409 });
      }

      // Basic URL validation (optional - add more sophisticated validation if needed)
      const urlPattern = /^[a-zA-Z0-9._-]+$/;
      if (!urlPattern.test(data.url)) {
        return json({ 
          error: 'URL can only contain letters, numbers, dots, underscores, and hyphens' 
        }, { status: 400 });
      }
    }

    // Update profile fields
    Object.keys(data).forEach(async (key) => {
      if (key !== 'user' && key !== '_id') {
        // Prevent updating protected fields
        profile[key] = data[key];
      }
      if (key === "image" ) {
        console.log(chalk.bgRed("Updating image with : key "), data[key]);
        await User.findOneAndUpdate({ _id: user.id }, { image: data[key] });
      }
      if (key === "displayName") {
        console.log(chalk.bgRed("Updating displayName with : key "), data[key]);
        await User.findOneAndUpdate({ _id: user.id }, { name: data[key] });
      }
    });

    try {
      await profile.save();
    } catch (saveError: any) {
      // Handle duplicate key error (E11000) - additional safety net
      if (saveError.code === 11000) {
        if (saveError.message.includes('url')) {
          return json({ error: 'URL already taken by another profile' }, { status: 409 });
        }
        return json({ error: 'Duplicate value for unique field' }, { status: 409 });
      }
      throw saveError;
    }

    // Populate related fields before returning
    await profile.populate('user');
    await profile.populate('classicProfile');

    return json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 