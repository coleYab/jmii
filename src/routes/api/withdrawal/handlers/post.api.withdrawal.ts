import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { Withdrawal } from '$src/models/Withdrawal.model';
import mongoose from 'mongoose';

export default async function postHandler(request: Request, locals: App.Locals) {
    await connectDB();
    const user = locals.user;
    if (!user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        console.log('🔄 Creating new withdrawal for user:', user.id);
        const data = await request.json();

        // Validate required fields
        if (!data.amount || !data.paymentMethod) {
            return new Response('Missing required fields', { status: 400 });
        }

        // Create new withdrawal
        const withdrawal = new Withdrawal({
            userId: user.id,
            paymentMethod: data.paymentMethod,
            phoneNumber: data.phoneNumber,
            sessionId: new mongoose.Types.ObjectId().toString(),
            trxRef: `WD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            amount: data.amount,
            status: 'pending'
        });

        await withdrawal.save();

        console.log('✅ Created new withdrawal with ID:', withdrawal._id.toString());

        return json({
            message: 'Withdrawal request created successfully',
            withdrawal: {
                ...withdrawal.toObject(),
                id: withdrawal._id.toString()
            }
        });
    } catch (error) {
        console.error('❌ Error creating withdrawal:', error);
        if (error instanceof mongoose.Error.ValidationError) {
            return new Response('Invalid withdrawal data', { status: 400 });
        }
        return new Response('Internal Server Error', { status: 500 });
    }
} 