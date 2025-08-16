import type { Types, Document } from 'mongoose';

export interface IProfile extends Document {
	// Basic info
	displayName: string;
	category: string;
	bio?: string;
	tipMeText: string;
	tipThanksText: string;
	url?: string;

	// Images
	image?: string;
	coverimage?: string;

	// Links
	links?: {
		platform: string;
		url: string;
		username: string;
		icon: string;
		highlighted?: boolean;
	}[];

	// Toggles
	showEmail: boolean;
	tipsEnabled: boolean;
	firstTime: boolean;
	defaultLayout: string;
	mode: string;

	// Theme
	theme?: string;

	// Withdrawal
	withdrawalAddress?: {
		value: string;
		type: string;
	};

	// Profile Snapshots for the classic and creative Profiles and now we need some way of switching to older versions
	classicProfileVersions: Types.ObjectId[]
	creativeProfileVersions: Types.ObjectId[]

	// Relations
	classicProfile?: Types.ObjectId;
	creativeProfile?: Types.ObjectId;
	kyc?: Types.ObjectId;

	// User relation
	user: Types.ObjectId;

	// Metadata
	createdAt: Date;
	updatedAt: Date;
}
