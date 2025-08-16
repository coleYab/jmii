import mongoose from 'mongoose';
import { TimestampOptions } from '../lib/schemas/common';

// Mongoose schema for database
// Router: file://./../routes/api/withdrawal/+server.ts

export const IWithdrawalStatus = [
	'pending',
	'approved',
	'rejected',
	'processing',
	'completed'
] as const;

export interface IWithdrawalSchema extends mongoose.Document {
	userId: mongoose.Types.ObjectId;
	paymentMethod: string;
	phoneNumber: string;
	sessionId: string;
	trxRef: string;
	amount: number;
	status: (typeof IWithdrawalStatus)[number];
	adminNotes: string;
}

const WithdrawalSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		paymentMethod: { type: String, maxlength: 255 },
		phoneNumber: { type: String, maxlength: 255 },
		sessionId: {
			type: String,
			unique: true,
			default: () => new mongoose.Types.ObjectId().toString()
		},
		trxRef: { type: String, required: true, unique: true, index: true },
		amount: { type: Number, required: true },
		status: {
			type: String,
			enum: IWithdrawalStatus,
			default: 'pending'
		},
		adminNotes: {
			type: String,
			default: 'Jami team is reviewing your withdraw you should see a staus update within 24 hours'
		}
	},
	TimestampOptions
);

// Create the model
const Withdrawal =
	mongoose.models.Withdrawal || mongoose.model('Withdrawal', WithdrawalSchema, 'withdrawal');

export { Withdrawal };
