import { Link } from '$src/models/ClassicProfile/Link.model';
import { LinkGroup } from '$src/models/ClassicProfile/LinkGroup.model';
import type { ClassicItem } from '$lib/types';

import getHandler from './handlers/get.api.classic.profile';
import postHandler from './handlers/post.api.classic.profile';
import putHandler from './handlers/put.api.classic.profile';
import deleteHandler from './handlers/delete.api.classic.profile';

// Ensure models are registered
Link;
LinkGroup;

export async function GET({ locals }) {
	return getHandler(locals);
}

export async function POST({ locals }) {
	return postHandler(locals);
}

export async function PUT({ request, locals }) {
	return putHandler(request, locals);
}

export async function DELETE({ locals }) {
	return deleteHandler(locals);
}
