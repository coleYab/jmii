import { Tip } from '$src/models/Tip.model';
import { json, redirect } from '@sveltejs/kit';

import { v4 as uuidv4 } from 'uuid';

export async function POST({ locals, request }) {
	// Should do a proper arifpay checkout

	// BASEURL https://gateway.arifpay.org/api/checkout/session
	const body = await request.json();
	const NONCE = uuidv4();
	console.log(body);

	let checkoutBody = {
		phone: body.phone,
		nonce: NONCE,
		errorUrl: 'https://jami.bio',
		notifyUrl: 'https://jami.bio',
		cancelUrl: 'https://jami.bio',
		successUrl: 'https://jami.bio',
		paymentMethods: ['TELEBIRR'],
		expireDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
		items: [
			{
				name: 'Tip',
				quantity: 1,
				price: body.amount,
				description: 'Tip',
				image: 'https://jami.bio'
			}
		],
		beneficiaries: [
			{
				accountNumber: '01320811436100',
				bank: 'AWINETAA',
				amount: body.amount
			}
		],
		lang: 'EN'
	};

	const response = await fetch('https://gateway.arifpay.org/api/checkout/session', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-arifpay-key': `0woYi3MMDe5fu8OEydNFzzqMhksuy0bh`
		},
		body: JSON.stringify(checkoutBody)
	});

	const data = await response.json();

	console.log(data);
	if (data.error) {
		return json(
			{
				message: data.msg
			},
			{
				status: 500
			}
		);
	}

	/***
 * Success Response
 * 
 * {
    "error": false,
    "msg": "No Errors",
    "data": {
        "sessionId": "8083467EDC06",
        "paymentUrl": "https://checkout.arifpay.org/checkout/8083467EDC06",
        "cancelUrl": "https://gateway.arifpay.net/v0/checkout/session/cancel/8083467EDC06",
        "totalAmount": 0.1
    }
} */

	// Redirect to payment url

	return json({
		message: 'Arifpay checkout session created successfully',
		data: data.data
	});
}
