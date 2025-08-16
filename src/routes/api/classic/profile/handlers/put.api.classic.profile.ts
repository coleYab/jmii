import { json } from '@sveltejs/kit';
import { connectDB } from '$lib/mongo';
import { ClassicProfile } from '$src/models/ClassicProfile/ClassicProfile.model';
import { Link } from '$src/models/ClassicProfile/Link.model';
import { LinkGroup } from '$src/models/ClassicProfile/LinkGroup.model';
import { Profile } from '$src/models/Profile/Profile.model';
import type { ClassicItem, IStandaloneLink } from '$lib/types';
import chalk from 'chalk';

// Ensure models are registered
Link;
LinkGroup;

// Request body interface for PUT endpoint - simplified for Classic mode
interface UpdateClassicProfileRequest {
	items: ClassicItem[];
}

/* PUT - Update classic profile (Classic mode - links only)
		/api/classic/profile
												/:profileId - Update a profile by profileId 
												/           - Update the current user's profile 
*/
export default async function putHandler(request: Request, locals: App.Locals) {
	await connectDB();

	const user = locals.user;
	console.log('🔄 PUT /api/classic/profile - User ID:', user?.id);

	if (!user?.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const { items }: UpdateClassicProfileRequest = await request.json();
		console.log('📥 Received items to save:', JSON.stringify(items, null, 2));

		// Get the user's profile, since classicprofile is dependent on profile existing
		const profile = await Profile.findOne({ user: user.id });

		if (!profile) {
			console.error('❌ Profile not found for user:', user.id);
			return new Response('Profile not found', { status: 404 });
		}

		const profileId: string = profile._id.toString();
		console.log('✅ Found user profile:', profileId);

		if (!Array.isArray(items)) {
			return new Response('Items must be an array', { status: 400 });
		}

		// Filter to only process standalone links (Classic mode doesn't support collections)
		const standaloneLinks = items.filter(item => item.itemType === 'link') as IStandaloneLink[];
		console.log(`🔗 Processing ${standaloneLinks.length} standalone links (${items.length - standaloneLinks.length} non-link items ignored)`);

		// Get or create classic profile
		let classicProfile = await ClassicProfile.findOne({ profileId });
		if (!classicProfile) {
			console.log('🆕 Creating new classic profile during PUT');
			classicProfile = new ClassicProfile({
				profileId,
				links: [],
				linkGroups: [] // Will remain empty for Classic mode
			});
			await classicProfile.save();
		}

		console.log('🔄 Smart update - analyzing changes...');

		// Fetch existing standalone links only
		const existingStandaloneLinks = await Link.find({ 
			_id: { $in: classicProfile.links || [] } 
		});

		// Create map for efficient lookups (using the prefixed IDs from UI)
		const existingLinksMap = new Map();

		// Map existing standalone links by their UI ID format
		existingStandaloneLinks.forEach(link => {
			existingLinksMap.set(`link-${link._id.toString()}`, link);
		});

		// Process incoming standalone links and determine what to create/update/delete
		const newLinkIds = [];
		const processedEntityIds = new Set(); // Track which entities we've processed

		for (let i = 0; i < standaloneLinks.length; i++) {
			const standaloneLink = standaloneLinks[i];
			const uiId = standaloneLink.id;
			processedEntityIds.add(uiId);

			if (existingLinksMap.has(uiId)) {
				// Update existing link
				const existingLink = existingLinksMap.get(uiId);
				
				// Only update if something changed
				const hasChanges = 
					existingLink.title !== standaloneLink.title ||
					existingLink.url !== standaloneLink.url ||
					existingLink.isActive !== (standaloneLink.isActive !== false) ||
					existingLink.sortOrder !== (standaloneLink.sortOrder || i);

				if (hasChanges) {
					await Link.findByIdAndUpdate(
						existingLink._id,
						{
							title: standaloneLink.title,
							url: standaloneLink.url,
							description: standaloneLink.description || null,
							image: standaloneLink.image || null,
							sortOrder: standaloneLink.sortOrder || i,
							isActive: standaloneLink.isActive !== false,
							clickCount: standaloneLink.clickCount || existingLink.clickCount || 0,
							// Ensure linkGroupId is null for standalone links
							linkGroupId: null
						}
					);
					console.log('🔄 Updated standalone link:', standaloneLink.title);
				} else {
					console.log('⏭️ No changes for standalone link:', standaloneLink.title);
				}
				
				newLinkIds.push(existingLink._id);
			} else {
				// Create new standalone link
				const link = new Link({
					title: standaloneLink.title,
					url: standaloneLink.url,
					description: standaloneLink.description || null,
					image: standaloneLink.image || null,
					sortOrder: standaloneLink.sortOrder || i,
					isActive: standaloneLink.isActive !== false,
					clickCount: standaloneLink.clickCount || 0,
					clickRefs: [],
					lastClicked: null,
					linkGroupId: null // Ensure standalone
				});
				await link.save();
				newLinkIds.push(link._id);
				console.log('✅ Created new standalone link:', link.title);
			}
		}

		// Clean up entities that are no longer referenced
		console.log('🧹 Cleaning up orphaned entities...');

		// Find standalone links to delete (those not in processedEntityIds)
		const standaloneLinksToDelete = existingStandaloneLinks.filter(link => {
			const uiId = `link-${link._id.toString()}`;
			return !processedEntityIds.has(uiId);
		});

		if (standaloneLinksToDelete.length > 0) {
			await Link.deleteMany({ 
				_id: { $in: standaloneLinksToDelete.map(l => l._id) } 
			});
			console.log(`🗑️ Deleted ${standaloneLinksToDelete.length} orphaned standalone links`);
		}

		// For Classic mode, also clean up any existing link groups and their links
		// This handles migration from collection-based to links-only mode
		if (classicProfile.linkGroups && classicProfile.linkGroups.length > 0) {
			console.log('🧹 Classic mode: Cleaning up existing link groups...');
			
			// Delete links in groups first
			await Link.deleteMany({ 
				linkGroupId: { $in: classicProfile.linkGroups.map((id: any) => id.toString()) } 
			});
			
			// Then delete the groups
			await LinkGroup.deleteMany({ 
				_id: { $in: classicProfile.linkGroups } 
			});
			
			console.log(`🗑️ Cleaned up ${classicProfile.linkGroups.length} link groups (Classic mode migration)`);
		}

		// Update classic profile with new references (no link groups in Classic mode)
		await ClassicProfile.findByIdAndUpdate(
			classicProfile._id,
			{
				links: newLinkIds,
				linkGroups: [] // Always empty for Classic mode
			},
			{ new: true }
		);

		console.log(
			'✅ Classic profile updated with',
			newLinkIds.length,
			'standalone links (Classic mode - no collections)'
		);

		// Fetch the updated profile for response
		const updatedProfile = await ClassicProfile.findById(classicProfile._id);

		// Transform back to UI format (standalone links only)
		const responseItems = [];

		// Manually fetch standalone links
		if (updatedProfile && updatedProfile.links && updatedProfile.links.length > 0) {
			const standaloneLinks = await Link.find({ 
				_id: { $in: updatedProfile.links } 
			}).sort({
				sortOrder: 1
			});

			responseItems.push(
				...standaloneLinks.map((link) => ({
					id: link._id.toString(),
					itemType: 'link' as const,
					type: 'link' as const,
					title: link.title,
					url: link.url,
					description: link.description,
					image: link.image,
					isActive: link.isActive,
					clickCount: link.clickCount,
					sortOrder: link.sortOrder,
					// UI compatibility fields
					clicks: link.clickCount,
					active: link.isActive
				}))
			);
		}

		console.log('✅ PUT /api/classic/profile completed successfully');
		return json({ 
			message: 'Classic profile updated successfully',
			linkGroups: responseItems // Keep same response format for compatibility
		});

	} catch (error) {
		console.error('❌ Error in PUT /api/classic/profile:', error);
		return new Response(
			JSON.stringify({ 
				error: 'Failed to update Classic profile', 
				details: error instanceof Error ? error.message : 'Unknown error' 
			}),
			{ 
				status: 500, 
				headers: { 'Content-Type': 'application/json' } 
			}
		);
	}
}
