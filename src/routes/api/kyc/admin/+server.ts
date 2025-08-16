import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { Kyc } from '$src/models/Profile/Kyc.model';
import { User } from '$src/models/User.model';
import { connectDB } from '$lib/mongo';

// GET - Retrieve all KYC requests for admin review
export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check if user is authenticated and is admin
		if (!locals.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// TODO: Add admin role check here
		// For now, assuming all authenticated users can access (you should add proper admin role checking)
        await connectDB();

		// Fetch all KYC requests with user information
		const kycRequests = await Kyc.find({})
			.populate('user', 'username email displayName')
			.populate('reviewedBy', 'username email displayName')
			.sort({ createdAt: -1 })
			.lean();

		return json({
			success: true,
			kycRequests: kycRequests.map(kyc => ({
				...kyc,
				id: (kyc._id as any).toString(),
				user: kyc.user ? {
					...kyc.user,
					id: (kyc.user._id as any)?.toString()
				} : null,
				reviewedBy: kyc.reviewedBy ? {
					...kyc.reviewedBy,
					id: (kyc.reviewedBy._id as any)?.toString()
				} : null
			}))
		});
	} catch (error) {
		console.error('Error fetching KYC requests:', error);
		return json({ error: 'Failed to fetch KYC requests' }, { status: 500 });
	}
};

// PUT - Update KYC status (approve/reject)
export const PUT: RequestHandler = async ({ request, locals }) => {
	try {
		// Check if user is authenticated and is admin
		if (!locals.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// TODO: Add admin role check here

		const { kycId, status, adminNotes } = await request.json();

		if (!kycId || !status) {
			return json({ error: 'KYC ID and status are required' }, { status: 400 });
		}

		if (!['approved', 'rejected', 'under_review'].includes(status)) {
			return json({ error: 'Invalid status' }, { status: 400 });
		}

		await connectDB();

		// Update the KYC record
		const updatedKyc = await Kyc.findByIdAndUpdate(
			kycId,
			{
				status,
				adminNotes: adminNotes || undefined,
				reviewedBy: locals.user.id,
				reviewedAt: new Date()
			},
			{ new: true }
		).populate('user', 'username email displayName')
		.populate('reviewedBy', 'username email displayName');

		if (!updatedKyc) {
			return json({ error: 'KYC request not found' }, { status: 404 });
		}

		return json({
			success: true,
			kyc: {
				...updatedKyc.toObject(),
				id: updatedKyc._id.toString(),
				user: updatedKyc.user ? {
					...updatedKyc.user,
					id: (updatedKyc.user._id as any)?.toString()
				} : null,
				reviewedBy: updatedKyc.reviewedBy ? {
					...updatedKyc.reviewedBy,
					id: (updatedKyc.reviewedBy._id as any)?.toString()
				} : null
			}
		});
	} catch (error) {
		console.error('Error updating KYC status:', error);
		return json({ error: 'Failed to update KYC status' }, { status: 500 });
	}
}; 