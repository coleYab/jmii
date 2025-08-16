import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { Withdrawal } from '$src/models/Withdrawal.model';
import mongoose from 'mongoose';

export default async function deleteHandler(request: Request, locals: App.Locals) {
    await connectDB();
    const user = locals.user;
    if (!user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        console.log('🔄 Canceling withdrawal for user:', user.id);
        const data = await request.json();

        if (!data.withdrawalId) {
            return new Response('Withdrawal ID is required', { status: 400 });
        }

        // Find the withdrawal and ensure it belongs to the user
        const withdrawal = await Withdrawal.findOne({
            _id: data.withdrawalId,
            userId: user.id
        });

        if (!withdrawal) {
            return new Response('Withdrawal not found', { status: 404 });
        }

        // Only allow cancellation if the withdrawal is in 'pending' status
        if (withdrawal.status !== 'pending') {
            return new Response('Cannot cancel withdrawal in current status', { status: 400 });
        }

        // Instead of actually deleting, we'll mark it as rejected
        withdrawal.status = 'rejected';
        withdrawal.adminNotes = 'Cancelled by user';
        await withdrawal.save();

        console.log('✅ Cancelled withdrawal:', withdrawal._id.toString());

        return json({
            message: 'Withdrawal cancelled successfully',
            withdrawal: {
                ...withdrawal.toObject(),
                id: withdrawal._id.toString()
            }
        });
    } catch (error) {
        console.error('❌ Error cancelling withdrawal:', error);
        if (error instanceof mongoose.Error.CastError) {
            return new Response('Invalid withdrawal ID', { status: 400 });
        }
        return new Response('Internal Server Error', { status: 500 });
    }
} 