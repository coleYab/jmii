import { connectDB } from '$lib/mongo';
import Profile from '$src/models/Profile/Profile.model';

/**
 * Clean up shell profiles with null userId values and recreate sparse index
 * This should be run once to fix the database state
 */
export async function cleanupShellProfiles() {
	try {
		await connectDB();
		
		console.log('🧹 Starting profile cleanup...');
		
		// Find and count shell profiles (profiles with null or undefined user field)
		const shellProfiles = await Profile.find({
			$or: [
				{ user: null },
				{ user: { $exists: false } }
			]
		});
		
		console.log(`📊 Found ${shellProfiles.length} shell profiles to clean up`);
		
		if (shellProfiles.length > 0) {
			// Delete shell profiles
			const deleteResult = await Profile.deleteMany({
				$or: [
					{ user: null },
					{ user: { $exists: false } }
				]
			});
			
			console.log(`🗑️ Deleted ${deleteResult.deletedCount} shell profiles`);
		}
		
		// Drop the existing index if it exists
		try {
			await Profile.collection.dropIndex('user_1');
			console.log('📉 Dropped existing user index');
		} catch (error: any) {
			if (error.code === 27) {
				console.log('📝 Index user_1 does not exist, skipping drop');
			} else {
				console.warn('⚠️ Warning dropping index:', error.message);
			}
		}
		
		// Recreate the sparse unique index
		await Profile.collection.createIndex(
			{ user: 1 }, 
			{ unique: true, sparse: true, name: 'user_1' }
		);
		console.log('📈 Created new sparse unique index on user field');
		
		// Verify the cleanup
		const remainingShellProfiles = await Profile.countDocuments({
			$or: [
				{ user: null },
				{ user: { $exists: false } }
			]
		});
		
		const totalProfiles = await Profile.countDocuments();
		
		console.log(`✅ Cleanup complete!`);
		console.log(`📊 Total profiles: ${totalProfiles}`);
		console.log(`🚫 Remaining shell profiles: ${remainingShellProfiles}`);
		
		return {
			success: true,
			deletedCount: shellProfiles.length,
			totalProfiles,
			remainingShellProfiles
		};
		
	} catch (error) {
		console.error('❌ Error during profile cleanup:', error);
		throw error;
	}
}

/**
 * Check the current state of profiles in the database
 */
export async function checkProfileState() {
	try {
		await connectDB();
		
		const totalProfiles = await Profile.countDocuments();
		const shellProfiles = await Profile.countDocuments({
			$or: [
				{ user: null },
				{ user: { $exists: false } }
			]
		});
		const validProfiles = await Profile.countDocuments({
			user: { $exists: true, $ne: null }
		});
		
		console.log('📊 Profile Database State:');
		console.log(`   Total profiles: ${totalProfiles}`);
		console.log(`   Valid profiles: ${validProfiles}`);
		console.log(`   Shell profiles: ${shellProfiles}`);
		
		// Check index information
		const indexes = await Profile.collection.indexes();
		const userIndex = indexes.find(idx => idx.name === 'user_1');
		
		console.log('📈 Index Information:');
		if (userIndex) {
			console.log(`   User index exists: ${userIndex.sparse ? 'sparse' : 'not sparse'}`);
			console.log(`   Unique: ${userIndex.unique ? 'yes' : 'no'}`);
		} else {
			console.log('   User index: not found');
		}
		
		return {
			totalProfiles,
			validProfiles,
			shellProfiles,
			userIndex
		};
		
	} catch (error) {
		console.error('❌ Error checking profile state:', error);
		throw error;
	}
} 