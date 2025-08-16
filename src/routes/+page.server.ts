import { User } from '$src/models/User.model';
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    try {

        return {
            user: locals.user,
            session: locals.session
        };

    } catch (err: any) {
        console.error('Error in user page:', err);

        throw error(500, 'Error loading URL');
    }
};