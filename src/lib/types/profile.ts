import type { IProfile } from '$src/models/Profile/Profile.types';
import type { IKyc, KycDocumentType, KycStatusType } from '$src/models/Profile/Kyc.types';

export interface User {
	_id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image?: string;
	cover?: string;
	url?: string;
	role: 'user' | 'admin';
	profileId?: string;
	tipBoxId?: string;
	analyticsId?: string;
	pageId?: string;
	createdAt: string;
	updatedAt: string;
}

export type Profile = IProfile;
export type Kyc = IKyc;
export type { KycDocumentType, KycStatusType };

export interface ProfileUpdateData {
	displayName?: string;
	bio?: string;
	category?: string;
	tipMeText?: string;
	image?: string;
	coverimage?: string;
	showEmail?: boolean;
	tipsEnabled?: boolean;
	defaultLayout?: string;
	mode?: string;
	links?: {
		platform: string;
		url: string;
		username: string;
		icon: string;
		highlighted?: boolean;
	}[];
	withdrawalAddress?: {
		value: string;
		type: string;
	};
} 