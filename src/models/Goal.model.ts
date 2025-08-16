import mongoose from 'mongoose';
import { TimestampOptions } from '../lib/schemas/common';

// Mongoose schema for database
// Router: file://./../routes/api/goal/+server.ts

const GoalSchema = new mongoose.Schema(
	{
		userId: { type: String, required: true, index: true },
		name: { type: String, required: true },
		amount: { type: Number, required: true },
		startDate: { type: Date, required: true },
		endDate: { type: Date, required: true },
		description: { type: String, default: '' }
	},
	TimestampOptions
);

// Create the model
const Goal = mongoose.models.Goal || mongoose.model('Goal', GoalSchema, 'goal');

export { Goal };

