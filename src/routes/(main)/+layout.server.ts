import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

import { auth } from '$lib/auth';
import chalk from 'chalk';
import { User } from 'lucide-svelte';

export const load: LayoutServerLoad = async ({ request, fetch }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session) {
		console.log(chalk.bgBlue('USER :  No session'));
		throw redirect(302, '/login');
	}
	const profile = await fetch('/api/user/profile');
	let profileData = await profile.json();

	profileData = JSON.parse(JSON.stringify(profileData));

	if (profileData.profile.firstTime) {
		return redirect(302, '/onboard');
	}

	return {
		profile: profileData.profile
	};
};
