import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { User } from '$src/models/User.model';
import Profile from '$src/models/Profile/Profile.model';
import { ClassicProfile } from '$src/models/ClassicProfile/ClassicProfile.model';
import { Link } from '$src/models/ClassicProfile/Link.model';
import { LinkGroup } from '$src/models/ClassicProfile/LinkGroup.model';
import { CreativeProfile } from '$src/models/CreativeProfile/CreativeProfile.model';
import type { IProfile } from '$src/models/Profile/Profile.types';

// Type for populated profile with user data
interface PopulatedProfile extends Omit<IProfile, 'user'> {
	_id: any;
	user: {
		_id: any;
		name: string;
		email: string;
		image: string;
		url: string;
	};
}

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		await connectDB();

		const { url } = params;

		// Find user's profile
		const profile = (await Profile.findOne({ url: url })
			.populate('user')
			.lean()) as PopulatedProfile | null;

		if (!profile) {
			throw error(404, 'Profile not found');
		}

		// Fetch available themes
		let themes = [];
		let selectedTheme = null;
		try {
			const themeResponse = await fetch('/api/theme');
			if (themeResponse.ok) {
				const themeData = await themeResponse.json();
				themes = themeData.data || [];
				
				// Get user's selected theme or default theme
				const userTheme = profile.theme;
				selectedTheme = themes.find((t: any) => t.id === userTheme) || 
								themes.find((t: any) => t.isDefault) || 
								themes[0] || null;
			}
		} catch (error) {
			console.warn('Failed to fetch themes for public page:', error);
		}

		// Determine mode and fetch appropriate data
		let profileData = null;
		let rawProfileData = JSON.parse(JSON.stringify(profile)) as unknown as IProfile;

		if (profile.mode === 'classic') {
			// Fetch classic profile data
			const classicProfile = (await ClassicProfile.findOne({
				profileId: profile._id.toString()
			}).lean()) as any;

			if (classicProfile) {
				// Get all link groups
				const linkGroups = (await LinkGroup.find({
					_id: { $in: classicProfile.linkGroups }
				}).lean()) as any[];

				// Get all links (both standalone and in groups)
				const allLinks = (await Link.find({
					$or: [
						{ _id: { $in: classicProfile.links } }, // Standalone links
						{ linkGroupId: { $in: linkGroups.map((lg: any) => lg._id.toString()) } } // Links in groups
					]
				}).lean()) as any[];

				// Organize links by group
				const linkGroupsWithLinks = linkGroups
					.map((group: any) => ({
						_id: group._id.toString(),
						title: group.title,
						sortOrder: group.sortOrder || 0,
						isActive: group.isActive,
						createdAt: group.createdAt,
						updatedAt: group.updatedAt,
						links: allLinks
							.filter((link: any) => link.linkGroupId === group._id.toString())
							.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
							.map((link: any) => ({
								_id: link._id.toString(),
								title: link.title,
								url: link.url,
								description: link.description,
								image: link.image,
								sortOrder: link.sortOrder || 0,
								isActive: link.isActive,
								linkGroupId: link.linkGroupId,
								clickCount: link.clickCount || 0,
								lastClicked: link.lastClicked,
								createdAt: link.createdAt,
								updatedAt: link.updatedAt
							}))
					}))
					.sort((a: any, b: any) => a.sortOrder - b.sortOrder);

				// Get standalone links (no linkGroupId)
				const standaloneLinks = allLinks
					.filter((link: any) => !link.linkGroupId)
					.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
					.map((link: any) => ({
						_id: link._id.toString(),
						title: link.title,
						url: link.url,
						description: link.description,
						image: link.image,
						sortOrder: link.sortOrder || 0,
						isActive: link.isActive,
						linkGroupId: link.linkGroupId,
						clickCount: link.clickCount || 0,
						lastClicked: link.lastClicked,
						createdAt: link.createdAt,
						updatedAt: link.updatedAt
					}));

				profileData = {
					type: 'classic',
					linkGroups: linkGroupsWithLinks,
					standaloneLinks
				};
			}
		} else if (profile.mode === 'creative') {
			// Fetch creative board data
			const board = (await CreativeProfile.findOne({
				profileId: profile._id.toString()
			}).lean()) as any;

			if (board) {
				console.log('Found creative board:', board);
				// Serialize the board data properly - preserve the layouts structure
				profileData = {
					type: 'creative',
					widgets: (board.widgets || []).map((widget: any) => {
						console.log('Processing widget:', widget);
						
						return {
							id: widget.id,
							type: widget.type,
							layouts: {
								desktop: {
									anchorRow: widget.layouts?.desktop?.anchorRow || 0,
									anchorCol: widget.layouts?.desktop?.anchorCol || 0,
									size: {
										width: widget.layouts?.desktop?.size?.width || 1,
										height: widget.layouts?.desktop?.size?.height || 1
									}
								},
								mobile: {
									anchorRow: widget.layouts?.mobile?.anchorRow || 0,
									anchorCol: widget.layouts?.mobile?.anchorCol || 0,
									size: {
										width: widget.layouts?.mobile?.size?.width || 1,
										height: widget.layouts?.mobile?.size?.height || 1
									}
								}
							},
							specificProps: widget.specificProps || {},
							draggable: widget.draggable !== false
						};
					}),
					rows: board.rows || 10,
					columns: board.columns || 4,
					userProfile: board.userProfile
						? {
								name: board.userProfile.name || '',
								picture: board.userProfile.picture || '',
								description: board.userProfile.description || ''
							}
						: null
				};
				console.log('Processed profileData:', profileData);
			} else {
				console.log('No creative board found for profileId:', profile._id.toString());
			}
		}

		return {
			user: {
				_id: profile.user._id.toString(),
				name: profile.user.name || '',
				email: profile.user.email || '',
				image: profile.user.image || '',
				url: profile.user.url || '',
				bio: '' // Add bio field for Builder component
			},
			profile: {
				_id: profile._id.toString(),
				displayName: profile.displayName || '',
				bio: profile.bio || '',
				category: profile.category || '',
				image: profile.image || '',
				coverimage: profile.coverimage || '',
				mode: profile.mode || 'classic',
				tipsEnabled: profile.tipsEnabled !== false,
				tipMeText: profile.tipMeText || 'Tip me',
				tipThanksText: profile.tipThanksText || 'Thank you for your tip!',
				showEmail: profile.showEmail === true
			},
			profileData,
			rawProfileData,
			themes: themes,
			selectedTheme: selectedTheme
		};
	} catch (err) {
		const { url } = params;
		console.error(`Error in PUB user page: ${url}`, err);
		throw error(404, 'User not found');
	}
};
