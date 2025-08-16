import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/mongo';
import { Tip } from '$src/models/Tip.model';

export const POST: RequestHandler = async ({ request, fetch, url }) => {
	try {
		await connectDB();

		const body = await request.json();

		// Extract data from request body
		const {
			amount,
			userName,
			userId: recipientUserId,
			isAnonymous,
			senderName,
			senderEmail,
			senderPhone,
			note
		} = body;

		// Validate required fields
		if (!amount || amount <= 0) {
			return json({ error: 'Invalid tip amount' }, { status: 400 });
		}

		if (!recipientUserId) {
			return json({ error: 'Recipient user ID is required' }, { status: 400 });
		}

		if (!senderPhone) {
			return json({ error: 'Phone number is required for all tips' }, { status: 400 });
		}

		// Validate phone number format (must be 251XXXXXXXXX)
		const phoneRegex = /^251[97]\d{8}$/;
		if (!phoneRegex.test(senderPhone.trim())) {
			return json(
				{ error: 'Phone number must be in format 251XXXXXXXXX (e.g., 251912345678)' },
				{ status: 400 }
			);
		}

		// Step 1: Create checkout session using ArifPay API first
		const checkoutData = {
			phone: senderPhone.trim(),
			amount: amount
		};

		const checkoutUrl = new URL('/api/arifpay/checkout', url.origin);
		const checkoutResponse = await fetch(checkoutUrl.toString(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(checkoutData)
		});

		if (!checkoutResponse.ok) {
			const checkoutError = await checkoutResponse.text();
			console.error('Failed to create checkout session:', checkoutError);
			return json({ error: 'Failed to create checkout session' }, { status: 500 });
		}

		const checkoutResult = await checkoutResponse.json();

		if (!checkoutResult.data?.paymentUrl || !checkoutResult.data?.sessionId) {
			return json(
				{ error: 'Invalid checkout response - missing payment URL or session ID' },
				{ status: 500 }
			);
		}

		// Step 2: Create the tip record with the ArifPay sessionId
		const tip = await Tip.create({
			userId: recipientUserId, // The recipient of the tip (profile owner)
			senderFullName: isAnonymous ? undefined : senderName,
			senderEmail: isAnonymous ? undefined : senderEmail,
			senderPhone: isAnonymous ? undefined : senderPhone,
			note: note || undefined,
			verified: false,
			trxRef: `TIP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
			sessionId: checkoutResult.data.sessionId, // Use the sessionId from ArifPay
			anonymous: isAnonymous,
			amount: amount,
			currency: 'ETB',
			type: 'Default'
		});

		console.log('✅ Created tip with ArifPay sessionId:', {
			tipId: tip._id.toString(),
			sessionId: checkoutResult.data.sessionId
		});

		// Return the payment URL and session info
		return json({
			success: true,
			paymentUrl: checkoutResult.data.paymentUrl,
			sessionId: checkoutResult.data.sessionId,
			tipId: tip._id.toString()
		});
	} catch (err) {
		console.error('Error in checkout endpoint:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
