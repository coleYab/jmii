import mongoose from 'mongoose';

const ClassicProfileSnapshotSchema = new mongoose.Schema(
	{
		profileId: { type: String, required: true, index: true },
		sourceClassicProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassicProfile' },
		// Standalone links only for classic mode snapshot (L0)
		links: [
			{
				title: String,
				url: String,
				description: { type: String, default: null },
				image: { type: String, default: null },
				sortOrder: { type: Number, default: 0 },
				isActive: { type: Boolean, default: true }
			}
		]
	},
	{ timestamps: true }
);

export const ClassicProfileVersion =
	mongoose.models.ClassicProfileVersion ||
	mongoose.model('ClassicProfileVersion', ClassicProfileSnapshotSchema);


