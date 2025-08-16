import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/mongo';
import { Analytics } from '$src/models/Analytics.model';
import { User } from '$src/models/User.model';
import { Click } from '$lib/schemas/analytics/clicks.js';
import { View } from '$lib/schemas/analytics/views.js';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		await connectDB();

		const { pageUrl, clickedUrl, userId } = await request.json();

		if (!pageUrl || !clickedUrl || !userId) {
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

		// Find the most recent view for this page/user to link the click to
		const recentView = await View.findOne({
			userId,
			pageUrl
		}).sort({ createdAt: -1 }).limit(1);

		// Record the click in the detailed clicks collection
		const click = new Click({
			viewId: recentView?._id,
			userId,
			pageUrl,
			url: clickedUrl,
			ipAddress,
			userAgent
		});
		await click.save();

		// Update analytics aggregation
		await (Analytics as any).incrementClicks(userId.toString());

		return json({
			success: true,
			message: 'Click tracked successfully'
		});
	} catch (error) {
		console.error('Track click error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}; 