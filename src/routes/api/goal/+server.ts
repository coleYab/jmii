import type { RequestEvent } from './$types';
import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { Goal } from '$src/models/Goal.model';
import mongoose from 'mongoose';

// Router: file://./../../../models/Goal.model.ts

// GET - Retrieve all goals for the authenticated user
export async function GET({ locals }) {
	await connectDB();
	
	const user = await locals.user;
	if (!user?.id) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		console.log('🔄 Loading goals for user:', user.id);

		const goals = await Goal.find({ userId: user.id })
			.sort({ createdAt: -1 }) // Most recent first
			.lean();

		console.log('✅ Found', goals.length, 'goals for user');

		return json({
			goals: goals.map((goal: any) => ({
				...goal,
				id: goal._id.toString(),
				createdAt: goal.createdAt,
				updatedAt: goal.updatedAt
			}))
		});
	} catch (error) {
		console.error('❌ Error getting goals:', error);
		return json({ message: 'Internal Server Error' }, { status: 500 });
	}
};

// POST - Create a new goal
export const POST = async (event: RequestEvent) => {
	const { request, locals } = event;
	await connectDB();
	
	const user = await locals.user;
	if (!user?.id) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		console.log('🔄 Creating new goal for user:', user.id);
		const data = await request.json();

		// Validate required fields
		if (!data.name) {
			return json({ message: 'Name is required' }, { status: 400 });
		}
		if (!data.amount) {
			return json({ message: 'Amount is required' }, { status: 400 });
		}
		if (!data.startDate) {
			return json({ message: 'Start date is required' }, { status: 400 });
		}
		if (!data.endDate) {
			return json({ message: 'End date is required' }, { status: 400 });
		}

		// Validate date logic
		const startDate = new Date(data.startDate);
		const endDate = new Date(data.endDate);
		if (endDate <= startDate) {
			return json({ message: 'End date must be after start date' }, { status: 400 });
		}

		// Create new goal
		const goal = new Goal({
			userId: user.id,
			name: data.name,
			amount: data.amount,
			startDate: startDate,
			endDate: endDate,
			description: data.description || ''
		});

		await goal.save();

		console.log('✅ Created new goal with ID:', goal._id.toString());

		return json({
			message: 'Goal created successfully',
			goal: {
				...goal.toObject(),
				id: goal._id.toString()
			}
		});
	} catch (error) {
		console.error('❌ Error creating goal:', error);
		if (error instanceof mongoose.Error.ValidationError) {
			return json({ message: 'Invalid goal data' }, { status: 400 });
		}
		return json({ message: 'Internal Server Error' }, { status: 500 });
	}
};

// PUT - Update an existing goal
export const PUT = async (event: RequestEvent) => {
	const { request, locals } = event;
	await connectDB();
	
	const user = await locals.user;
	if (!user?.id) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();
		const { id, ...updateData } = data;

		if (!id) {
			return json({ message: 'Goal ID is required' }, { status: 400 });
		}

		console.log('🔄 Updating goal:', id, 'for user:', user.id);

		// Validate date logic if dates are being updated
		if (updateData.startDate && updateData.endDate) {
			const startDate = new Date(updateData.startDate);
			const endDate = new Date(updateData.endDate);
			if (endDate <= startDate) {
				return json({ message: 'End date must be after start date' }, { status: 400 });
			}
		}

		// Find and update the goal (only if it belongs to the user)
		const updatedGoal = await Goal.findOneAndUpdate(
			{ _id: id, userId: user.id },
			{ ...updateData, updatedAt: new Date() },
			{ new: true, runValidators: true }
		);

		if (!updatedGoal) {
			return json({ message: 'Goal not found or unauthorized' }, { status: 404 });
		}

		console.log('✅ Updated goal:', id);

		return json({
			message: 'Goal updated successfully',
			goal: {
				...updatedGoal.toObject(),
				id: updatedGoal._id.toString()
			}
		});
	} catch (error) {
		console.error('❌ Error updating goal:', error);
		if (error instanceof mongoose.Error.ValidationError) {
			return json({ message: 'Invalid goal data' }, { status: 400 });
		}
		return json({ message: 'Internal Server Error' }, { status: 500 });
	}
};

// DELETE - Delete a goal
export const DELETE = async (event: RequestEvent) => {
	const { request, locals } = event;
	await connectDB();
	
	const user = await locals.user;
	if (!user?.id) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { id } = await request.json();

		if (!id) {
			return json({ message: 'Goal ID is required' }, { status: 400 });
		}

		console.log('🔄 Deleting goal:', id, 'for user:', user.id);

		// Find and delete the goal (only if it belongs to the user)
		const deletedGoal = await Goal.findOneAndDelete({ _id: id, userId: user.id });

		if (!deletedGoal) {
			return json({ message: 'Goal not found or unauthorized' }, { status: 404 });
		}

		console.log('✅ Deleted goal:', id);

		return json({
			message: 'Goal deleted successfully',
			goalId: id
		});
	} catch (error) {
		console.error('❌ Error deleting goal:', error);
		return json({ message: 'Internal Server Error' }, { status: 500 });
	}
};
