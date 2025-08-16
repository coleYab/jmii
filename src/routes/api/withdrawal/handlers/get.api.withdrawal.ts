import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import {  Withdrawal, type IWithdrawalSchema } from '$src/models/Withdrawal.model';

export default async function getHandler(locals: App.Locals) {
    await connectDB();
    const user = locals.user;
    if (!user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        console.log('🔄 Loading withdrawals for user:', user.id);

        const withdrawals  = await Withdrawal.find({ userId: user.id })
            .sort({ createdAt: -1 }) // Most recent first
            .lean();

        console.log('✅ Found', withdrawals.length, 'withdrawals for user');

        const safeWithdrawals  = withdrawals.map(withdrawal  => ({
                ...withdrawal,
                id: withdrawal._id.toString() as string,
                createdAt: withdrawal.createdAt,
                updatedAt: withdrawal.updatedAt
            }))


        return json({
            withdrawals: safeWithdrawals
        });
    } catch (error) {
        console.error('❌ Error getting withdrawals:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
} 