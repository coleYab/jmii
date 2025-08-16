
import { Tip } from '$src/models/Tip.model';

import getHandler from './handlers/get.api.tip';
import postHandler from './handlers/post.api.tip';
import putHandler from './handlers/put.api.tip';
import deleteHandler from './handlers/delete.api.tip';

// Ensure model is registered
Tip;

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
