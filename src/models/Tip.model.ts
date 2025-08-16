import mongoose from 'mongoose';
import { TimestampOptions } from '../lib/schemas/common';

// Mongoose schema for database
// Router: file://./../routes/api/tip/+server.ts
// Checkout: file://./../routes/api/arifpay/checkout/+server.ts

// Enums to match Prisma schema
export const Currency = ['ETB', 'USD', 'EUR'] as const;
export const TipType = ['Default', 'Goal', 'Anonymous'] as const;

export interface ITipSchema extends mongoose.Document {
	id: string;
	senderFullName?: string;
	senderEmail?: string;
	senderPhone?: string;
	note?: string;
	verified: boolean;
	userId: mongoose.Types.ObjectId;
	trxRef: string;
	sessionId?: string;
	anonymous: boolean;
	amount: number;
	currency: (typeof Currency)[number];
	type: (typeof TipType)[number];
	goalId?: number;
	createdAt?: Date;
	updatedAt?: Date;
}

const TipSchema = new mongoose.Schema(
	{
		senderFullName: { type: String, maxlength: 255 },
		senderEmail: { type: String, maxlength: 255 },
		senderPhone: { type: String, maxlength: 255 },
		note: { type: String },
		verified: { type: Boolean, default: false },
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		trxRef: { type: String, required: true, unique: true, index: true },
		sessionId: { type: String, unique: true },
		anonymous: { type: Boolean, default: false },
		amount: { type: Number, required: true },
		currency: {
			type: String,
			enum: Currency,
			default: 'ETB'
		},
		type: {
			type: String,
			enum: TipType,
			default: 'Default'
		},
		goalId: { type: Number, index: true }
	},
	{
		...TimestampOptions,
		timestamps: true
	}
);

// Create the model
const Tip = mongoose.models.Tip || mongoose.model('Tip', TipSchema);

export { Tip };
