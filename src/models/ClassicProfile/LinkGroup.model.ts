import mongoose from 'mongoose';

export interface ILinkGroup {
	id: string;
	title: string;
	sortOrder: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateLinkGroupData {
	title: string;
	sortOrder?: number;
	isActive?: boolean;
}

export interface UpdateLinkGroupData {
	title?: string;
	sortOrder?: number;
	isActive?: boolean;
}

// LinkGroup Schema
export const linkGroupSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true
		},
		// Sort order within the classic profile
		sortOrder: {
			type: Number,
			default: 0
		},
		// If the group is active/enabled
		isActive: {
			type: Boolean,
			default: true
		}
		// Note: Links are not embedded here - they reference this group via linkGroupId
	},
	{
		timestamps: true
	}
);

// Export the LinkGroup model for standalone use
export const LinkGroup = mongoose.models.LinkGroup || mongoose.model('LinkGroup', linkGroupSchema);
