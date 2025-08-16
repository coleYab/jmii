// Router: file://./../routes/api/profile/+server.ts
import mongoose, { Schema, Types } from 'mongoose';
import type { IProfile } from './Profile.types';

// Router: file://./../../routes/api/user/profile/+server.ts
// Types : file://./Profile.type.ts
const ProfileSchema = new Schema<IProfile>(
	{
		// Basic info
		displayName: {
			type: String,
			required: true,
			trim: true
		},
		category: {
			type: String,
			required: true,
			trim: true
		},
		bio: {
			type: String,
			trim: true
		},

		tipMeText: {
			type: String,
			default: 'Leave Tip',
			trim: true
		},
		tipThanksText: {
			type: String,
			default: 'Thank you for your tip!',
			trim: true
		},
		url: {
			type: String,
			trim: true,
			default: () => Math.random().toString(36).substring(2, 15),
			unique: true
		},

		// Images
		image: {
			type: String,
			trim: true
		},
		coverimage: {
			type: String,
			trim: true
		},

		// Links
		links: [
			{
				platform: {
					type: String,
					trim: true
				},
				url: {
					type: String,
					trim: true
				},
				username: {
					type: String,
					trim: true
				},
				icon: {
					type: String,
					trim: true
				},
				clicks: {
					type: Number,
					default: 0
				},
				highlighted: {
					type: Boolean,
					default: false
				}
			}
		],

		// Toggles
		showEmail: {
			type: Boolean,
			default: false
		},
		tipsEnabled: {
			type: Boolean,
			default: true
		},
		firstTime: {
			type: Boolean,
			default: true
		},
		mode: {
			type: String,
			enum: ['tips', 'classic', 'creative'],
			default: 'classic',
			trim: true
		},

		// Theme
		theme: {
			type: String,
			trim: true
		},

		// Withdrawal
		withdrawalAddress: {
			value: {
				type: String,
				trim: true
			},
			type: {
				type: String,
				trim: true
			}
		},

		// Relations
		classicProfile: {
			type: Schema.Types.ObjectId,
			ref: 'ClassicProfile'
		},
		creativeProfile: {
			type: Schema.Types.ObjectId,
			ref: 'CreativeProfile'
		},

		kyc: {
			type: Schema.Types.ObjectId,
			ref: 'Kyc'
		},
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
// Use sparse index to ignore documents with null user values (shell profiles)
ProfileSchema.index({ user: 1 }, { unique: true, sparse: true });
ProfileSchema.index({ category: 1 });
ProfileSchema.index({ createdAt: -1 });

ProfileSchema.pre('save', async function (next) {
	if (!this.url) {
		this.url = Math.random().toString(36).substring(2, 15);
	}

	// Validate maximum 4 highlighted links
	if (this.links) {
		const highlightedCount = this.links.filter((link) => link.highlighted).length;
		if (highlightedCount > 4) {
			const error = new Error('Maximum 4 links can be highlighted');
			return next(error);
		}
	}

	next();
});

export const Profile =
	mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);
export default Profile;
