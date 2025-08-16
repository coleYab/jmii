import type { TagTree, WidgetConfig } from '$src/types/widgets';

import Debug, {
	defaultProps as debugDefaultProps
} from '$lib/components/widgets/_debug/Debug.svelte';

import Calendar, {
	defaultProps as calendarDefaultProps
} from '$lib/components/widgets/_calendar/Calendar.svelte';

import Media, {
	defaultProps as mediaDefaultProps
} from '$lib/components/widgets/_media/Media.svelte';

import Button, {
	defaultProps as buttonDefaultProps
} from '$lib/components/widgets/_button/Button.svelte';

import Color, {
	defaultProps as colorDefaultProps
} from '$lib/components/widgets/_color/Color.svelte';

import { Calendar as CalendarIcon,
	Image as ImageIcon,
	Bug,
	Plus,
	Link,
	PaintBrushBroad } from 'phosphor-svelte';

// Registry of available widget components
export const widgetRegistry: Record<string, any> = {
	Debug,
	Calendar,
	Media,
	Button,
	Color
};

// Viewport breakpoints
export const VIEWPORT_BREAKPOINTS = {
	mobile: 768,
	tablet: 1024,
	desktop: 1200
} as const;

/**
 * Determines if the current viewport is mobile based on width
 * @param viewportWidth - Current viewport width in pixels
 * @returns boolean indicating if viewport is mobile
 */
export function isMobileViewport(viewportWidth: number): boolean {
	return viewportWidth < VIEWPORT_BREAKPOINTS.mobile;
}

/**
 * Determines device type based on viewport width
 * @param viewportWidth - Current viewport width in pixels
 * @returns string indicating device type
 */
export function getDeviceType(viewportWidth: number): 'mobile' | 'tablet' | 'desktop' {
	if (viewportWidth < VIEWPORT_BREAKPOINTS.mobile) return 'mobile';
	if (viewportWidth < VIEWPORT_BREAKPOINTS.tablet) return 'tablet';
	return 'desktop';
}

/**
 * Calculates responsive widget dimensions based on viewport width
 * @param viewportWidth - Current viewport width in pixels
 * @returns Object containing widget dimensions for different grid sizes
 */
export function getResponsiveWidgetSizes(viewportWidth: number) {
	// Determine device type based on viewport
	const isMobile = viewportWidth < VIEWPORT_BREAKPOINTS.mobile;
	const isTablet = viewportWidth >= VIEWPORT_BREAKPOINTS.mobile && viewportWidth < VIEWPORT_BREAKPOINTS.tablet;
	
	// Calculate base size with responsive scaling
	let baseSize: number;
	let radius: number;
	
	if (isMobile) {
		// For mobile: ensure 2-wide widgets fit on iPhone SE (320px) and scale up for larger screens
		// iPhone SE (320px): base = 135px, 2x1 = 270px + 10px gap = 280px (fits in 320px)
		// Larger phones (400px+): scale up to max 160px
		baseSize = Math.max(135, Math.min(160, viewportWidth * 0.35));
		radius = 10;
	} else if (isTablet) {
		// For tablet: medium base size
		baseSize = Math.max(140, Math.min(180, viewportWidth * 0.15));
		radius = 12;
	} else {
		// For desktop: larger base size, less responsive scaling
		baseSize = Math.max(180, Math.min(220, viewportWidth * 0.12));
		radius = 14;
	}
	
	// Calculate gap proportionally
	const gap = Math.max(8, Math.min(16, baseSize * 0.08));
	
	return {
		'1x1': { width: baseSize, height: baseSize, radius },
		'1x2': { width: baseSize, height: baseSize * 2 + gap, radius },
		'2x1': { width: baseSize * 2 + gap, height: baseSize, radius },
		'2x2': { width: baseSize * 2 + gap, height: baseSize * 2 + gap, radius: radius + 2 }
	};
}

// Legacy static lookup for backwards compatibility
export const WidgetSizingLookup = {
	desktop: {
		'1x1': { width: 200, height: 200, radius: 12 },
		'1x2': { width: 200, height: 412, radius: 12 },
		'2x1': { width: 412, height: 200, radius: 12 },
		'2x2': { width: 412, height: 412, radius: 14 }
	},
	mobile: {
		'1x1': { width: 135, height: 135, radius: 10 },
		'1x2': { width: 135, height: 280, radius: 10 },
		'2x1': { width: 280, height: 135, radius: 10 },
		'2x2': { width: 280, height: 280, radius: 12 }
	}
};

// Configuration for each widget type, including sizes and default properties
export const widgetConfigs: WidgetConfig[] = [
	{
		type: 'Debug',
		sizes: [
			{ width: 1, height: 1 },
			{ width: 1, height: 2 },
			{ width: 2, height: 1 },
			{ width: 2, height: 2 }
		],
		tags: ['All', 'Development'],
		defaultProps: debugDefaultProps,
		previewIcon: Bug
	},
	{
		type: 'Button',
		sizes: [
			{ width: 1, height: 1 },
			{ width: 1, height: 2 },
			{ width: 2, height: 1 },
			{ width: 2, height: 2 }
		],
		tags: ['All', 'Development'],
		defaultProps: buttonDefaultProps,
		previewIcon: Link
	},
	{
		type: 'Calendar',
		sizes: [
			{ width: 1, height: 1 },
			{ width: 1, height: 2 },
			{ width: 2, height: 1 },
			{ width: 2, height: 2 }
		],
		tags: ['All', 'Calendar', 'Productivity'],
		defaultProps: calendarDefaultProps,
		previewIcon: CalendarIcon
	},
	{
		type: 'Media',
		sizes: [
			{ width: 1, height: 1 },
			{ width: 1, height: 2 },
			{ width: 2, height: 1 },
			{ width: 2, height: 2 }
		],
		tags: ['All', 'Media', 'Content'],
		defaultProps: mediaDefaultProps,
		previewIcon: ImageIcon
	},
	{
		type: 'Color',
		sizes: [
			{ width: 1, height: 1 },
			{ width: 1, height: 2 },
			{ width: 2, height: 1 },
			{ width: 2, height: 2 }
		],
		tags: ['All', 'Design', 'Visual'],
		defaultProps: colorDefaultProps,
		previewIcon: PaintBrushBroad
	}
];

// New function to generate tag tree
export function generateTagTree(): TagTree {
	const tree: TagTree = { name: 'Root', children: {} };
	const allTags = new Set<string>();
	widgetConfigs.forEach((widget) => {
		widget.tags.forEach((tag) => {
			allTags.add(tag);
		});
	});

	allTags.forEach((tag) => {
		widgetConfigs.forEach((widget) => {
			if (widget.tags.includes(tag)) {
				if (!tree.children[tag]) {
					tree.children[tag] = { name: tag, children: {} };
				}
				tree.children[tag].widgets = tree.children[tag].widgets || [];
				tree.children[tag].widgets.push(widget.type);
			}
		});
	});

	return tree;
}

// Function to get the component for a given widget type
export function getWidgetComponent(type: string) {
	return widgetRegistry[type];
}

/**
 * Gets the configuration for a specific widget type
 *
 * @param type - The type identifier of the widget to get config for
 * @returns The widget configuration object. If no config is found for the given type,
 * returns a default fallback config with basic properties and 'Debug' type.
 * The returned config includes:
 * - type: The widget type identifier
 * - sizes: Array of available size configurations (width/height)
 * - tags: Array of category tags the widget belongs to
 * - defaultProps: Default properties for the widget instance
 */
export function getWidgetConfig(type: string): WidgetConfig {
	const config = widgetConfigs.find((config) => config.type === type);
	if (!config) {
		return {
			type: 'Debug',
			sizes: [
				{ width: 1, height: 1 },
				{ width: 1, height: 2 },
				{ width: 2, height: 1 },
				{ width: 2, height: 2 }
			],
			tags: ['All'],
			defaultProps: {}
		};
	}
	return config;
}

/**
 * Gets the pixel dimensions for a widget based on its grid size and viewport width
 *
 * @param width - Grid width (1 or 2)
 * @param height - Grid height (1 or 2)
 * @param viewportWidth - Current viewport width in pixels (if not provided, falls back to legacy mobile/desktop logic)
 * @param isMobile - Legacy parameter for backwards compatibility
 * @returns Object containing width, height, and border radius in pixels
 */
export function getWidgetPixelSize(width: number, height: number, viewportWidthOrIsMobile?: number | boolean, isMobile?: boolean) {
	const sizeKey = `${width}x${height}` as keyof ReturnType<typeof getResponsiveWidgetSizes>;
	
	// Handle overloaded parameters for backwards compatibility
	let viewportWidth: number | undefined;
	let useLegacy = false;
	
	if (typeof viewportWidthOrIsMobile === 'number') {
		viewportWidth = viewportWidthOrIsMobile;
	} else if (typeof viewportWidthOrIsMobile === 'boolean') {
		useLegacy = true;
		isMobile = viewportWidthOrIsMobile;
	} else if (typeof isMobile === 'boolean') {
		useLegacy = true;
	}
	
	// Use responsive sizing if viewport width is provided
	if (viewportWidth && !useLegacy) {
		const responsiveSizes = getResponsiveWidgetSizes(viewportWidth);
		
		if (!responsiveSizes[sizeKey]) {
			console.warn(`Invalid widget size: ${sizeKey}`);
			return responsiveSizes['1x1']; // Fallback to smallest size
		}
		
		return responsiveSizes[sizeKey];
	}
	
	// Fallback to legacy static lookup
	const deviceType = isMobile ? 'mobile' : 'desktop';
	
	if (!WidgetSizingLookup[deviceType][sizeKey]) {
		console.warn(`Invalid widget size: ${sizeKey}`);
		return WidgetSizingLookup[deviceType]['1x1']; // Fallback to smallest size
	}

	return WidgetSizingLookup[deviceType][sizeKey];
}

/**
 * Gets all available widget types from the widget registry
 * @returns Array of widget type names
 */
export function getAllWidgets(): { type: string; previewIcon: any }[] {
	return widgetConfigs.map((config) => ({ type: config.type, previewIcon: config.previewIcon }));
}
