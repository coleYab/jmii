import mongoose from 'mongoose';
import { BOARD_CONFIG } from '$src/stores/board/board.config';

export interface IWidget {
	id: string;
	type: string;
	layouts: {
		desktop: {
			anchorRow: number;
			anchorCol: number;
			size: {
				width: number;
				height: number;
			};
		};
		mobile: {
			anchorRow: number;
			anchorCol: number;
			size: {
				width: number;
				height: number;
			};
		};
	};
	specificProps: Record<string, any>;
}

const WidgetSchema = new mongoose.Schema<IWidget>({
	id: String,
	type: String,

	layouts: {
		desktop: {
			anchorRow: Number,
			anchorCol: Number,
			size: {
				width: Number,
				height: Number
			}
		},
		mobile: {
			anchorRow: Number,
			anchorCol: Number,
			size: {
				width: Number,
				height: Number
			}
		}
	},

	specificProps: mongoose.Schema.Types.Mixed
});

const CreativeProfileSchema = new mongoose.Schema(
	{
		// The profile id that this creative profile belongs to
		profileId: { type: String, required: true, index: true },
		// The widgets we will render on the creative profile
		widgets: [WidgetSchema]
	},
	{ timestamps: true }
);

export const CreativeProfile =
	mongoose.models.CreativeProfile || mongoose.model('CreativeProfile', CreativeProfileSchema);
