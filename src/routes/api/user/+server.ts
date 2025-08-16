import type { RequestEvent } from './$types';

import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { User } from '$src/models/User.model';

// Router: file://./../../../models/User.model.ts

export const PUT = async (event: RequestEvent) => {
	const { request, locals } = event;
	const user = await locals.user;
	if (!user?.id) {
		return json({ message: 'Unauthorized: no user id' }, { status: 401 });
	}

	try {
		const { customUrl } = await request.json();

		if (!customUrl) {
			return json({ message: 'Custom URL is required' }, { status: 400 });
		}

		if (customUrl.length < 3) {
			return json({ message: 'Custom URL must be at least 3 characters long' }, { status: 400 });
		}

		if (customUrl.length > 30) {
			return json({ message: 'Custom URL must be less than 30 characters' }, { status: 400 });
		}

		// Validate URL format (only allow alphanumeric and hyphens)
		if (!/^[a-zA-Z0-9-]+$/.test(customUrl)) {
			return json(
				{
					message: 'Custom URL can only contain letters, numbers, and hyphens'
				},
				{ status: 400 }
			);
		}

		await connectDB();

		// Check if URL is already taken by another user
		const existingUrl = await User.findOne({
			url: customUrl.toLowerCase(),
			userId: { $ne: user.id }
		});

		if (existingUrl) {
			return json(
				{
					message: 'This URL is already taken. Please choose another one.',
					conflict: true
				},
				{ status: 400 }
			);
		}

		// Update or create URL for user
		await User.findOneAndUpdate(
			{ userId: user.id },
			{
				userId: user.id,
				url: customUrl.toLowerCase(),
				updatedAt: new Date()
			},
			{ upsert: true }
		);

		return json({ success: true, customUrl: customUrl.toLowerCase() });
	} catch (err) {
		console.error('Error updating custom URL:', err);
		return json({ message: 'Internal Server Error' }, { status: 500 });
	}
};
