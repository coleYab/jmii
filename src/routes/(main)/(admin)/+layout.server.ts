import type { LayoutServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

import chalk from 'chalk';

export const load: LayoutServerLoad = async ({ locals }) => {
	console.log(chalk.red.inverse('Admin Layout Server load '));

	const session = locals.session;
	const user = locals.user;

	if (!session) {
		console.log(chalk.yellow('Admin : No session'));
		throw redirect(302, '/login');
	}
	if (user?.role !== 'admin') {
		console.log(chalk.red.bold('Admin : Not admin'));
		throw error(403, 'Forbidden');
	}
};
