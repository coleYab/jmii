import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { Kyc } from '$src/models/Profile/Kyc.model';
import { KycDocumentTypes } from '$src/models/Profile/Kyc.types';

export default async function postHandler(request: Request, locals: App.Locals) {
	await connectDB();
	
	const user = locals.user;
	if (!user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const data = await request.json();
		const { documentType, documentUrl } = data;

		// Validation
		if (!documentType || !documentUrl) {
			return json({ error: 'Document type and document URL are required' }, { status: 400 });
		}

		if (!KycDocumentTypes.includes(documentType)) {
			return json({ error: 'Invalid document type' }, { status: 400 });
		}

		// Check if user already has a KYC submission
		const existingKyc = await Kyc.findOne({ user: user.id });
		if (existingKyc) {
			return json({ error: 'KYC already submitted. Use PUT to update.' }, { status: 409 });
		}

		// Create new KYC submission
		const kyc = new Kyc({
			user: user.id,
			documentType,
			documentUrl,
			status: 'pending'
		});

		await kyc.save();

		return json({
			message: 'KYC submitted successfully',
			kyc
		}, { status: 201 });
	} catch (error) {
		console.error('Error submitting KYC:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
} 