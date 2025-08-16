import type { RequestHandler } from './$types';

import getHandler from './handlers/get.api.user.profile';
import postHandler from './handlers/post.api.user.profile';
import putHandler from './handlers/put.api.user.profile';
import deleteHandler from './handlers/delete.api.withdrawal.ts';

// Model : file://./../../../../models/Profile/Profile.model.ts
// Model : file://./../../../../models/ClassicProfile/ClassicProfile.model.ts

// GET - Retrieve profile(s)
// /api/user/profile
// 						 GET /:id - Retrieve profile by ID
// 						GET / - Retrieve logged in user's profile
export const GET: RequestHandler = async ({ locals, url }) => {
	return getHandler(locals, url);
};

// POST - Create new profile
export const POST: RequestHandler = async ({ request, locals }) => {
	return postHandler(request, locals);
};

// PUT - Update existing profile
export const PUT: RequestHandler = async ({ request, locals, url }) => {
	return putHandler(request, locals, url);
};

// DELETE - Delete profile
export const DELETE: RequestHandler = async ({ locals, url }) => {
	return deleteHandler(locals, url);
};
