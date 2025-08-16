import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { Tip, type ITipSchema } from '$src/models/Tip.model';

export default async function getHandler(locals: App.Locals) {
    await connectDB();
    const user = locals.user;
    if (!user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        console.log('🔄 Loading tips for user:', user.id);

        const tips = await Tip.find({ userId: user.id })
            .sort({ createdAt: -1 }) // Most recent first
            .lean();

        console.log('✅ Found', tips.length, 'tips for user');

        return json({
            tips: tips.map((tip: any) => ({
                ...tip,
                id: tip._id.toString() as string,
                createdAt: tip.createdAt,
                updatedAt: tip.updatedAt
            }))
        });
    } catch (error) {
        console.error('❌ Error getting tips:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
} 