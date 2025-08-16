import type { LayoutServerLoad } from './$types';

import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
    try {
        return {
            user: locals.user,
            session: locals.session
        };

    } catch (err) {
        console.error('Error in layout:', err);
        throw error(500, 'Error loading URL');
    }
}; 