import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { Kyc } from '$src/models/Profile/Kyc.model';

export default async function getHandler(locals: App.Locals) {
	await connectDB();
	
	const user = locals.user;
	if (!user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const kyc = await Kyc.findOne({ user: user.id }).populate('reviewedBy', 'name email');

		if (!kyc) {
			return json({
				message: 'No KYC submission found',
				kyc: null
			});
		}

		return json({
			message: 'KYC retrieved successfully',
			kyc
		});
	} catch (error) {
		console.error('Error retrieving KYC:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
} 