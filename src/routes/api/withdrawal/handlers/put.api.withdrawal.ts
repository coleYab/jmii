import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { Withdrawal, type IWithdrawalSchema } from '$src/models/Withdrawal.model';
import mongoose from 'mongoose';

export default async function putHandler(request: Request, locals: App.Locals) {
	await connectDB();
	const user = locals.user;
	if (!user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		console.log('🔄 Updating withdrawal for user:', user.id);
		const data = await request.json();

		if (!data.withdrawalId) {
			return new Response('Withdrawal ID is required', { status: 400 });
		}

		// Find the withdrawal
		const withdrawal: IWithdrawalSchema | null = await Withdrawal.findOne({
			_id: data.withdrawalId
		});

		if (!withdrawal) {
			return new Response('Withdrawal not found', { status: 404 });
		}
		const isAdmin = user.role === 'admin';
		const isOwner = withdrawal.userId.toString() === user.id;

		// Regular users can only update their own pending withdrawals
		if (!isAdmin && !isOwner) {
			return new Response('Unauthorized', { status: 401 });
		}

		// Admin operations
		if (isAdmin) {
			console.log('👑 Admin updating withdrawal:', withdrawal._id.toString());

			// Validate status transitions
			if (data.status) {
				const validStatusTransitions = {
					pending: ['approved', 'rejected'],
					approved: ['processing', 'completed'],
					processing: ['completed']
				};

				const allowedNextStatuses =
					validStatusTransitions[withdrawal.status as keyof typeof validStatusTransitions];
				if (!allowedNextStatuses?.includes(data.status)) {
					return new Response(
						`Invalid status transition from ${withdrawal.status} to ${data.status}`,
						{ status: 400 }
					);
				}

				withdrawal.status = data.status;
				if (data.adminNotes) {
					withdrawal.adminNotes = data.adminNotes;
				}
			}
		}
		// Regular user operations
		else {
			// Only allow updates if the withdrawal is in 'pending' status
			if (withdrawal.status !== 'pending') {
				return new Response('Cannot update withdrawal in current status', { status: 400 });
			}

			// Update allowed fields for regular users
			const allowedUpdates = ['paymentMethod', 'phoneNumber'];
			for (const field of allowedUpdates) {
				if (data[field] !== undefined) {
					withdrawal[field] = data[field];
				}
			}
		}

		await withdrawal.save();

		console.log('✅ Updated withdrawal:', withdrawal._id.toString());

		return json({
			message: 'Withdrawal updated successfully',
			withdrawal: {
				...withdrawal.toObject(),
				id: withdrawal._id.toString()
			}
		});
	} catch (error) {
		console.error('❌ Error updating withdrawal:', error);
		if (error instanceof mongoose.Error.ValidationError) {
			return new Response('Invalid withdrawal data', { status: 400 });
		}
		return new Response('Internal Server Error', { status: 500 });
	}
}
