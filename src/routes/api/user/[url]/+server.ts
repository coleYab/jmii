import { error, json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { connectDB } from '$lib/mongo';
import { User } from '$src/models/User.model';


export const GET = async (event: RequestEvent) => {
    const { url } = event.params;
    try {
        await connectDB();
        const userUrl = await User.findOne({ url: url });
        return json({ url: userUrl?.url || null });
    } catch (err) {
        console.error('Error fetching custom URL:', err);
        return json({ message: 'Internal Server Error' }, { status: 500 });
    }
};
