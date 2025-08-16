import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { Withdrawal } from '$src/models/Withdrawal.model';

import getHandler from './handlers/get.api.withdrawal';
import postHandler from './handlers/post.api.withdrawal';
import putHandler from './handlers/put.api.withdrawal';
import deleteHandler from './handlers/delete.api.withdrawal';

// Ensure model is registered
Withdrawal;

export async function GET({ locals }) {
	return getHandler(locals);
}

export async function POST({ request, locals }) {
	return postHandler(request, locals);
}

export async function PUT({ request, locals }) {
	return putHandler(request, locals);
}

export async function DELETE({ request, locals }) {
	return deleteHandler(request, locals);
}
