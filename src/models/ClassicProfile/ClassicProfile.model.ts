import mongoose from 'mongoose';

export interface IClassicProfile {
	id: string;
	profileId: string;
	links: mongoose.Types.ObjectId[]; // References to standalone Link documents
	linkGroups: mongoose.Types.ObjectId[]; // References to LinkGroup documents
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateClassicProfileData {
	profileId: string;
}

// ClassicProfile Schema - simplified with references
const classicProfileSchema = new mongoose.Schema(
	{
		profileId: {
			type: String,
			required: true,
			unique: true,
			index: true
		},
		// Array of ObjectId references to standalone Link documents
		links: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Link'
			}
		],
		// Array of ObjectId references to LinkGroup documents
		linkGroups: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'LinkGroup'
			}
		]
	},
	{
		timestamps: true
	}
);

// Export models
export const ClassicProfile =
	mongoose.models.ClassicProfile || mongoose.model('ClassicProfile', classicProfileSchema);
