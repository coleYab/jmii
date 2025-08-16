import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { cleanupShellProfiles, checkProfileState } from '$lib/utils/cleanupProfiles';

// GET - Check current profile state
export const GET: RequestHandler = async ({ locals }) => {
	// Basic auth check - you might want to add proper admin authentication
	const user = locals.user;
	if (!user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const state = await checkProfileState();
		return json({
			message: 'Profile state checked successfully',
			state
		});
	} catch (error) {
		console.error('Error checking profile state:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};

// POST - Run profile cleanup
export const POST: RequestHandler = async ({ locals }) => {
	// Basic auth check - you might want to add proper admin authentication
	const user = locals.user;
	if (!user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const result = await cleanupShellProfiles();
		return json({
			message: 'Profile cleanup completed successfully',
			result
		});
	} catch (error) {
		console.error('Error during profile cleanup:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}; 