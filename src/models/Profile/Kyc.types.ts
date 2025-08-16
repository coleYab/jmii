import type { Types } from 'mongoose';

export const KycDocumentTypes = [
	'national_id',
	'passport',
	'drivers_license'
] as const;

export type KycDocumentType = (typeof KycDocumentTypes)[number];

export const KycStatus = [
	'pending',
	'approved',
	'rejected',
	'under_review'
] as const;

export type KycStatusType = (typeof KycStatus)[number];

export interface IKyc extends Document {
	// Document info
	documentType: KycDocumentType;
	documentUrl: string;
	
	// Status
	status: KycStatusType;
	
	// Admin notes
	adminNotes?: string;
	reviewedBy?: Types.ObjectId;
	reviewedAt?: Date;
	
	// User relation
	user: Types.ObjectId;
	
	// Metadata
	createdAt: Date;
	updatedAt: Date;
} 