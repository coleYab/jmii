import mongoose from 'mongoose';

const CreativeProfileSnapshotSchema = new mongoose.Schema(
	{
		profileId: { type: String, required: true, index: true },
		sourceCreativeProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'CreativeProfile' },
		snapshot: {
			widgets: { type: [mongoose.Schema.Types.Mixed], default: [] },
			rows: { type: Number },
			columns: { type: Number },
			userProfile: { type: mongoose.Schema.Types.Mixed }
		}
	},
	{ timestamps: true }
);

export const CreativeProfileVersion =
	mongoose.models.CreativeProfileVersion ||
	mongoose.model('CreativeProfileVersion', CreativeProfileSnapshotSchema);


