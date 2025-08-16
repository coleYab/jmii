import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { Tip } from '$src/models/Tip.model';
import mongoose from 'mongoose';

export default async function postHandler(request: Request, locals: App.Locals) {
    await connectDB();
    const user = locals.user;
    if (!user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        console.log('🔄 Creating new tip for user:', user.id);
        const data = await request.json();

        // Validate required fields
        if (!data.amount) {
            return new Response('Amount is required', { status: 400 });
        }

        // Create new tip
        const tip = new Tip({
            userId: user.id,
            senderFullName: data.senderFullName,
            senderEmail: data.senderEmail,
            senderPhone: data.senderPhone,
            note: data.note,
            verified: data.verified || false,
            trxRef: `TIP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            sessionId: data.sessionId || new mongoose.Types.ObjectId().toString(),
            anonymous: data.anonymous || false,
            amount: data.amount,
            currency: data.currency || 'ETB',
            type: data.type || 'Default',
            goalId: data.goalId
        });

        await tip.save();

        console.log('✅ Created new tip with ID:', tip._id.toString());

        return json({
            message: 'Tip created successfully',
            tip: {
                ...tip.toObject(),
                id: tip._id.toString()
            }
        });
    } catch (error) {
        console.error('❌ Error creating tip:', error);
        if (error instanceof mongoose.Error.ValidationError) {
            return new Response('Invalid tip data', { status: 400 });
        }
        return new Response('Internal Server Error', { status: 500 });
    }
} 