import { json } from '@sveltejs/kit';
import { connectDB } from "$lib/mongo";
import { Profile } from "$src/models/Profile/Profile.model";
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  await connectDB();
  
  try {
    const { url } = await request.json();
    
    if (!url) {
      return json({ error: 'URL is required' }, { status: 400 });
    }

    // Clean and validate URL like in the PUT handler
    const cleanUrl = url.toLowerCase().trim();
    
    // Basic URL validation
    const urlPattern = /^[a-zA-Z0-9._-]+$/;
    if (!urlPattern.test(cleanUrl)) {
      return json({ 
        error: 'URL can only contain letters, numbers, dots, underscores, and hyphens',
        isAvailable: false 
      }, { status: 400 });
    }

    // Check if URL already exists in any profile
    const existingProfile = await Profile.findOne({ url: cleanUrl });
    
    const isAvailable = !existingProfile;
    
    return json({
      isAvailable,
      url: cleanUrl
    });
    
  } catch (error) {
    console.error('Error checking URL availability:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}; 