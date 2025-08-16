import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { Tip } from '$src/models/Tip.model';
import mongoose from 'mongoose';

export default async function deleteHandler(request: Request, locals: App.Locals) {
    await connectDB();
    const user = locals.user;
    if (!user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        console.log('🔄 Deleting tip for user:', user.id);
        const data = await request.json();

        if (!data.tipId) {
            return new Response('Tip ID is required', { status: 400 });
        }

        // Find the tip
        const tip = await Tip.findOne({
            _id: data.tipId
        });

        if (!tip) {
            return new Response('Tip not found', { status: 404 });
        }

        const isAdmin = user.role === 'admin';
        const isOwner = tip.userId.toString() === user.id;

        // Check authorization
        if (!isAdmin && !isOwner) {
            return new Response('Unauthorized', { status: 401 });
        }

        // Only allow deletion if the tip is not verified (to prevent deletion of processed tips)
        if (tip.verified && !isAdmin) {
            return new Response('Cannot delete verified tip', { status: 400 });
        }

        // Actually delete the tip
        await Tip.findByIdAndDelete(data.tipId);

        console.log('✅ Deleted tip:', data.tipId);

        return json({
            message: 'Tip deleted successfully',
            tipId: data.tipId
        });
    } catch (error) {
        console.error('❌ Error deleting tip:', error);
        if (error instanceof mongoose.Error.CastError) {
            return new Response('Invalid tip ID', { status: 400 });
        }
        return new Response('Internal Server Error', { status: 500 });
    }
} 