import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/mongo';
import { Analytics } from '$src/models/Analytics.model';
import { User } from '$src/models/User.model';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		await connectDB();

		// Get the authenticated user
		const authUser =  locals.user;
		if (!authUser?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Find the user document
		const user = await User.findOne({ _id: authUser.id });
		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Get query parameters for date range
		const searchParams = url.searchParams;
		const daysParam = searchParams.get('days');
		const days = daysParam ? parseInt(daysParam) : 30; // Default to 30 days

		// Calculate date range
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(endDate.getDate() - days);
		startDate.setHours(0, 0, 0, 0);
		endDate.setHours(23, 59, 59, 999);

		// Fetch analytics data
		const analyticsData = await Analytics.find({
			userId: user._id,
			date: { $gte: startDate, $lte: endDate }
		})
			.sort({ date: 1 })
			.lean();

		// Calculate lifetime totals
		const lifetimeData = await Analytics.aggregate([
			{ $match: { userId: user._id } },
			{
				$group: {
					_id: null,
					totalViews: { $sum: '$views' },
					totalClicks: { $sum: '$clicks' },
					avgCtr: { $avg: '$ctr' }
				}
			}
		]);

		const lifetime = lifetimeData[0] || { totalViews: 0, totalClicks: 0, avgCtr: 0 };

		// Transform data for the chart
		const chartData = analyticsData.map((entry) => ({
			date: entry.date,
			views: entry.views,
			clicks: entry.clicks,
			ctr: entry.ctr
		}));

		// Calculate trends (comparing to previous period)
		const previousStartDate = new Date(startDate);
		previousStartDate.setDate(previousStartDate.getDate() - days);
		const previousEndDate = new Date(startDate);
		previousEndDate.setDate(previousEndDate.getDate() - 1);

		const previousData = await Analytics.aggregate([
			{
				$match: {
					userId: user._id,
					date: { $gte: previousStartDate, $lte: previousEndDate }
				}
			},
			{
				$group: {
					_id: null,
					totalViews: { $sum: '$views' },
					totalClicks: { $sum: '$clicks' },
					avgCtr: { $avg: '$ctr' }
				}
			}
		]);

		const currentData = await Analytics.aggregate([
			{
				$match: {
					userId: user._id,
					date: { $gte: startDate, $lte: endDate }
				}
			},
			{
				$group: {
					_id: null,
					totalViews: { $sum: '$views' },
					totalClicks: { $sum: '$clicks' },
					avgCtr: { $avg: '$ctr' }
				}
			}
		]);

		const previous = previousData[0] || { totalViews: 0, totalClicks: 0, avgCtr: 0 };
		const current = currentData[0] || { totalViews: 0, totalClicks: 0, avgCtr: 0 };

		// Calculate percentage changes
		const calculateTrend = (current: number, previous: number) => {
			if (previous === 0) return current > 0 ? 100 : 0;
			return ((current - previous) / previous) * 100;
		};

		const trends = {
			viewsTrend: calculateTrend(current.totalViews, previous.totalViews),
			clicksTrend: calculateTrend(current.totalClicks, previous.totalClicks),
			ctrTrend: calculateTrend(current.avgCtr, previous.avgCtr)
		};

		return json({
			success: true,
			data: {
				chartData,
				lifetime: {
					lifetimeViews: lifetime.totalViews,
					lifetimeClicks: lifetime.totalClicks,
					lifetimeCtr: lifetime.avgCtr,
					lifetimeSubs: 0 // TODO: Implement subscription tracking
				},
				trends: {
					...trends,
					subsTrend: 0 // TODO: Implement subscription trend
				},
				period: {
					days,
					startDate,
					endDate
				}
			}
		});
	} catch (error) {
		console.error('Analytics API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
