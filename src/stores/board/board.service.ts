import { connectDB } from '../../lib/mongo';
import { CreativeProfile } from '../../models/CreativeProfile/CreativeProfile.model';
import type { WidgetProps } from '$src/types/widgets';
import { getDefaultBoardState, validateBoardDimensions, BOARD_CONFIG } from '$src/stores/board/board.config';

export async function saveBoardState(
	profileId: string,
	widgets: WidgetProps[],
	rows: number,
	columns: number,
	userProfile?: {
		name: string;
		picture: string;
		description: string;
	}
) {
	await connectDB();
	console.log('SAVING BOARD STATE for profileId:', profileId);
	console.log('Widgets count:', widgets.length);

	// Validate and normalize board dimensions
	const {
		rows: validatedRows,
		columns: validatedColumns,
		wasModified
	} = validateBoardDimensions(rows, columns);

	if (wasModified) {
		console.warn(
			`Board dimensions were adjusted: ${rows}x${columns} -> ${validatedRows}x${validatedColumns}`
		);
	}

	const board = await CreativeProfile.findOneAndUpdate(
		{ profileId },
		{
			widgets,
			rows: validatedRows,
			columns: validatedColumns,
			userProfile,
			updatedAt: new Date()
		},
		{ upsert: true, new: true }
	);

	console.log('Board saved successfully:', board ? 'yes' : 'no');
	return sanitizeBoardData(board);
}

export async function getBoardState(profileId: string) {
	await connectDB();
	console.log('GETTING BOARD STATE for profileId:', profileId);
	const board = await CreativeProfile.findOne({ profileId });
	console.log('BOARD found:', board);
	return board ? sanitizeBoardData(board) : getDefaultBoardState();
}

function sanitizeBoardData(board: any) {
	if (!board) return null;
	
	console.log('Sanitizing board data:', board);

	const sanitized = {
		widgets: board.widgets.map((widget: any) => {
			console.log('Sanitizing widget:', widget);
			
			// Ensure layouts structure exists
			const layouts = widget.layouts || {
				desktop: {
					anchorRow: widget.anchorRow || 0,
					anchorCol: widget.anchorCol || 0,
					size: widget.size || { width: 1, height: 1 }
				},
				mobile: {
					anchorRow: widget.anchorRow || 0,
					anchorCol: widget.anchorCol || 0,
					size: widget.size || { width: 1, height: 1 }
				}
			};
			
			return {
				id: widget.id,
				type: widget.type,
				layouts: {
					desktop: {
						anchorRow: layouts.desktop.anchorRow,
						anchorCol: layouts.desktop.anchorCol,
						size: {
							width: layouts.desktop.size.width,
							height: layouts.desktop.size.height
						}
					},
					mobile: {
						anchorRow: layouts.mobile.anchorRow,
						anchorCol: layouts.mobile.anchorCol,
						size: {
							width: layouts.mobile.size.width,
							height: layouts.mobile.size.height
						}
					}
				},
				specificProps: widget.specificProps
			};
		}),
		rows: board.rows || BOARD_CONFIG.DEFAULT_ROWS,
		columns: board.columns || BOARD_CONFIG.DEFAULT_COLUMNS_DESKTOP,
		userProfile: board.userProfile
	};

	console.log('Sanitized board data:', sanitized);
	return sanitized;
}

export async function updateWidget(
	profileId: string,
	widgetId: string,
	updates: Partial<WidgetProps>
) {
	await connectDB();

	const board = await CreativeProfile.findOneAndUpdate(
		{
			profileId,
			'widgets.id': widgetId
		},
		{
			$set: {
				'widgets.$.specificProps': updates.specificProps,
				'widgets.$.layouts': updates.layouts,
				updatedAt: new Date()
			}
		},
		{ new: true }
	);

	return sanitizeBoardData(board);
}
