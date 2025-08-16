import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { Kyc } from '$src/models/Profile/Kyc.model';
import { KycDocumentTypes } from '$src/models/Profile/Kyc.types';

export default async function putHandler(request: Request, locals: App.Locals) {
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

		// Find existing KYC submission
		const kyc = await Kyc.findOne({ user: user.id });
		if (!kyc) {
			return json({ error: 'No KYC submission found. Use POST to create one.' }, { status: 404 });
		}

		// Only allow updates if status is rejected or pending
		if (kyc.status === 'approved') {
			return json({ error: 'Cannot update approved KYC submission' }, { status: 400 });
		}

		// Update KYC submission
		kyc.documentType = documentType;
		kyc.documentUrl = documentUrl;
		kyc.status = 'pending'; // Reset status to pending
		kyc.adminNotes = undefined; // Clear previous admin notes
		kyc.reviewedBy = undefined; // Clear previous reviewer
		kyc.reviewedAt = undefined; // Clear previous review date

		await kyc.save();

		return json({
			message: 'KYC updated successfully',
			kyc
		});
	} catch (error) {
		console.error('Error updating KYC:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
} 