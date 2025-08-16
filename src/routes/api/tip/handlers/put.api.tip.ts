import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { Tip, type ITipSchema } from '$src/models/Tip.model';
import mongoose from 'mongoose';

export default async function putHandler(request: Request, locals: App.Locals) {
	await connectDB();
	const user = locals.user;
	if (!user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		console.log('🔄 Updating tip for user:', user.id);
		const data = await request.json();

		if (!data.tipId) {
			return new Response('Tip ID is required', { status: 400 });
		}

		// Find the tip
		const tip: ITipSchema | null = await Tip.findOne({
			_id: data.tipId
		});

		if (!tip) {
			return new Response('Tip not found', { status: 404 });
		}
		
		const isAdmin = user.role === 'admin';
		const isOwner = tip.userId.toString() === user.id;

		// Check authorization
		if (!isAdmin && !isOwner) {
			return new Response('Unauthorized', { status: 401 });
		}

		// Admin operations
		if (isAdmin) {
			console.log('👑 Admin updating tip:', tip._id.toString());

			// Admins can update verification status and other administrative fields
			if (data.verified !== undefined) {
				tip.verified = data.verified;
			}
			
			if (data.type !== undefined) {
				tip.type = data.type;
			}
			
			if (data.goalId !== undefined) {
				tip.goalId = data.goalId;
			}
		}

		// Both admin and owner can update these fields
		const allowedUpdates = ['senderFullName', 'senderEmail', 'senderPhone', 'note', 'anonymous'];
		for (const field of allowedUpdates) {
			if (data[field] !== undefined) {
				tip[field] = data[field];
			}
		}

		// Amount and currency can only be updated if not verified (safety check)
		if (!tip.verified) {
			if (data.amount !== undefined) {
				tip.amount = data.amount;
			}
			if (data.currency !== undefined) {
				tip.currency = data.currency;
			}
		}

		await tip.save();

		console.log('✅ Updated tip:', tip._id.toString());

		return json({
			message: 'Tip updated successfully',
			tip: {
				...tip.toObject(),
				id: tip._id.toString()
			}
		});
	} catch (error) {
		console.error('❌ Error updating tip:', error);
		if (error instanceof mongoose.Error.ValidationError) {
			return new Response('Invalid tip data', { status: 400 });
		}
		return new Response('Internal Server Error', { status: 500 });
	}
}
