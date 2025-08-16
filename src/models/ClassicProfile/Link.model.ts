import mongoose from 'mongoose';

// TypeScript interfaces for type safety
export interface ILink {
	id: string;
	title: string;
	url: string;
	description: string | null;
	image: string | null;
	sortOrder: number;
	isActive: boolean;
	linkGroupId?: string; // Optional - if null/undefined, it's a standalone link (L0)
	clickCount: number;
	clickRefs: mongoose.Types.ObjectId[];
	lastClicked: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

// Helper types for API operations
export interface CreateLinkData {
	title: string;
	url: string;
	description?: string | null;
	image?: string | null;
	sortOrder?: number;
	isActive?: boolean;
	linkGroupId?: string; // Optional - for standalone links
}

export interface UpdateLinkData {
	title?: string;
	url?: string;
	description?: string | null;
	image?: string | null;
	sortOrder?: number;
	isActive?: boolean;
	linkGroupId?: string; // Can be updated to move between standalone and grouped
}

// Link Schema
// Router: file://./../../routes/api/classic/links/+server.ts
const linkSchema = new mongoose.Schema(
	{
		// Title of the link
		title: {
			type: String,
			required: true
		},
		// Href that it goes to
		url: {
			type: String,
			required: true
		},
		// Optional description
		description: {
			type: String,
			default: null
		},
		// Customizable preview image - or Opengraph preview thumbnail
		image: {
			type: String,
			default: null
		},
		// Sorting order within the classic profile (L0) or within the link group (L1)
		sortOrder: {
			type: Number,
			default: 0
		},
		// If its enabled or not
		isActive: {
			type: Boolean,
			default: true
		},
		// Optional - if present, this link belongs to a link group (L1), if null/undefined it's standalone (L0)
		linkGroupId: {
			type: String,
			required: false,
			index: true
		},
		// Analytics
		clickCount: {
			type: Number,
			default: 0
		},
		clickRefs: {
			type: [mongoose.Schema.Types.ObjectId],
			default: []
		},
		lastClicked: {
			type: Date,
			default: null
		}
	},
	{
		timestamps: true
	}
);

export const Link = mongoose.models.Link || mongoose.model('Link', linkSchema);
