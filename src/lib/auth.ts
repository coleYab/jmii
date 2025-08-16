import dotenv from 'dotenv';

import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { admin } from 'better-auth/plugins';

import { db } from './db';
import Profile from '$src/models/Profile/Profile.model';
import { Waitlist } from './schemas/waitlist';
import type { IProfile } from '$src/models/Profile/Profile.types';
import { User } from '$src/models/User.model';
import { ClassicProfile } from '$src/models/ClassicProfile/ClassicProfile.model';
import { CreativeProfile } from '$src/models/CreativeProfile/CreativeProfile.model';
import { getRequestEvent } from '$app/server';
import { sveltekitCookies } from 'better-auth/svelte-kit';

dotenv.config();

const dbInstance = await db.getInstance();

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET,
	database: mongodbAdapter(dbInstance),
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60 * 60 * 24 * 30 // 30 days
		}
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					// Check if the user is on the waitlist
					const waitlistEntry = await Waitlist.findOne({ email: user.email });
					let url: null | string = null;
					console.log('Waitlist entry', waitlistEntry);

					// If the user is on the waitlist, use the preferred url
					if (waitlistEntry) {
						url = waitlistEntry.preferredUrl;
						const updatedWaitlistEntry = await Waitlist.findOneAndUpdate(
							{ email: user.email },
							{ $set: { status: 'registered' } },
							{ new: true }
						);
						console.log('updatedWaitlistEntry', updatedWaitlistEntry);
					} else {
						console.log('User is not on the waitlist');
					}

					let profileObject: any = {
						displayName: user.name,
						category: 'Default',
						bio: "Hi there , I'm new here ",
						user: user.id,
						image: user.image,
						mode: 'classic'
					};

					if (url) profileObject.url = url;

					// Initialize a profile for the user and prefill the image from the user.image model
					const profile = await Profile.create(profileObject);

					console.log('Hooked user', user, profile);
					// Perform actions after user creation

					const updatedUser = await User.findOneAndUpdate(
						{ _id: user.id },
						{ $set: { profileId: profile.id } },
						{ new: true }
					);

					console.log('updatedUser', updatedUser);

					// Create a classic profile for the user
					const classicProfile = await ClassicProfile.create({
						profileId: profile.id.toString(),
						links: [],
						linkGroups: []
					});

					console.log('classicProfile', classicProfile);

					// Create a classic profile for the user
					const creativeProfile = await CreativeProfile.create({
						profileId: profile.id.toString(),
						widgets: []
					});

					// Update the profile to reference the classic profile
					const updatedProfile = await Profile.findOneAndUpdate(
						{ _id: profile.id },
						{ $set: { classicProfile: classicProfile.id, creativeProfile: creativeProfile.id } },
						{ new: true }
					);

					console.log('updatedProfile', updatedProfile);
				}
			}
		}
	},
	user: {
		additionalFields: {
			role: { type: 'string', defaultValue: 'user' },
			profileId: { type: 'string', defaultValue: null, required: false }
		}
	},

	emailAndPassword: {
		enabled: true
	},

	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ['google']
		}
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
			redirectURI: process.env.BETTER_AUTH_URL?.includes('jami')
				? 'https://jami.et/api/auth/callback/google'
				: 'http://localhost:5173/api/auth/callback/google'
		},
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			redirectURI: process.env.BETTER_AUTH_URL?.includes('jmii')
				? 'https://jmii.onrender.com/api/auth/callback/google'
				: 'http://localhost:5173/api/auth/callback/google'
		}
	},
	plugins: [admin(), sveltekitCookies(getRequestEvent)]
});

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = (typeof auth.$Infer.Session)['user'];
