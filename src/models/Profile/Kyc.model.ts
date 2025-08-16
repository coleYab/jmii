import mongoose, { Schema, Types } from 'mongoose';
import type { IKyc } from './Kyc.types';
import { KycDocumentTypes, KycStatus } from './Kyc.types';

// KYC Schema
const KycSchema = new Schema<IKyc>(
	{
		// Document info
		documentType: {
			type: String,
			required: true,
			enum: KycDocumentTypes,
			trim: true
		},
		documentUrl: {
			type: String,
			required: true,
			trim: true
		},
		
		// Status
		status: {
			type: String,
			enum: KycStatus,
			default: 'pending',
			required: true
		},
		
		// Admin notes
		adminNotes: {
			type: String,
			trim: true
		},
		reviewedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User'
		},
		reviewedAt: {
			type: Date
		},
		
		// User relation
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true
		}
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true }
	}
);

// Indexes for better query performance
KycSchema.index({ user: 1 }, { unique: true }); // One KYC per user
KycSchema.index({ status: 1 });
KycSchema.index({ createdAt: -1 });
KycSchema.index({ reviewedAt: -1 });

// Pre-save middleware to set reviewedAt when status changes to approved/rejected
KycSchema.pre('save', function (next) {
	if (this.isModified('status') && (this.status === 'approved' || this.status === 'rejected')) {
		if (!this.reviewedAt) {
			this.reviewedAt = new Date();
		}
	}
	next();
});

export const Kyc = mongoose.models.Kyc || mongoose.model<IKyc>('Kyc', KycSchema);
export default Kyc; 