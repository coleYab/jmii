import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/mongo';
import { Analytics } from '$src/models/Analytics.model';
import { User } from '$src/models/User.model';
import { View } from '$lib/schemas/analytics/views.js';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		await connectDB();

		const { url: pageUrl, userId } = await request.json();

		if (!pageUrl || !userId) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Verify user exists
		const user = await User.findById(userId);
		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Get client information
		const ipAddress = getClientAddress();
		const userAgent = request.headers.get('user-agent') || '';

		// Record the view in the detailed views collection
		const view = new View({
			userId,
			pageUrl,
			ipAddress,
			userAgent
		});
		await view.save();

		// Update analytics aggregation
		await (Analytics as any).incrementViews(userId.toString());

		return json({
			success: true,
			message: 'View tracked successfully'
		});
	} catch (error) {
		console.error('Track view error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}; 