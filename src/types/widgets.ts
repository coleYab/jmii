import type { IWidget } from '$src/models/CreativeProfile/CreativeProfile.model';

type WidgetSize = { width: number; height: number };

// Base properties common to all widgets
// type BaseWidgetProps = { # DEPRECATED 
//   id: string;
//   type: string;
//   size: WidgetSize;
//   anchorRow: number;
//   anchorCol: number;
//   draggable: boolean;
// };

// IWidget is defined at file://./../models/CreativeProfile/CreativeProfile.model.ts
type BaseWidgetProps = IWidget;

// Additional properties specific to each widget type
type WidgetSpecificProps = Record<string, any>;

// Complete widget properties, combining base and specific props
type WidgetProps = BaseWidgetProps & {
	specificProps: WidgetSpecificProps;
};

// Represents the state of the entire board
type IBoardState = (WidgetProps | null)[][];

// WidgetRegistry Configuration
export interface WidgetConfig {
	type: string;
	sizes: WidgetSize[];
	tags: string[];
	defaultProps: WidgetSpecificProps;
	previewIcon?: any; // Phosphor-svelte icon component
}

export interface TagTree {
	name: string;
	children: Record<string, TagTree>;
	widgets?: string[];
}

export type { WidgetProps, IBoardState, BaseWidgetProps, WidgetSpecificProps, WidgetSize };
