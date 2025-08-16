import type { RequestHandler } from './$types';

import getHandler from './handlers/get.api.kyc';
import postHandler from './handlers/post.api.kyc';
import putHandler from './handlers/put.api.kyc';

// Model: file://./../../../models/Profile/Kyc.model.ts

// GET - Retrieve KYC status
// /api/kyc - Get logged in user's KYC status
export const GET: RequestHandler = async ({ locals }) => {
	return getHandler(locals);
};

// POST - Submit new KYC document
export const POST: RequestHandler = async ({ request, locals }) => {
	return postHandler(request, locals);
};

// PUT - Update KYC document (resubmit)
export const PUT: RequestHandler = async ({ request, locals }) => {
	return putHandler(request, locals);
}; 