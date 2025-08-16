import mongoose from 'mongoose';
import { TimestampOptions } from '../lib/schemas/common';

// Mongoose schema for Theme management
// Router: file://./../routes/api/theme/+server.ts

// Delete the existing model if it exists to prevent caching issues
if (mongoose.models.Theme) {
	delete mongoose.models.Theme;
}

const ThemeSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true, maxLength: 50 },
		description: { type: String, required: true, trim: true, maxLength: 200 },

		// Theme identifier (slug-like)
		id: { type: String, required: true, unique: true, lowercase: true, trim: true },

		// Specific color properties
		background: {
			type: String,
			required: true,
			validate: {
				validator: function (v: string) {
					return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
				},
				message: 'Background color must be a valid hex color code'
			}
		},
		foreground: {
			type: String,
			required: true,
			validate: {
				validator: function (v: string) {
					return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
				},
				message: 'Foreground color must be a valid hex color code'
			}
		},
		stroke: {
			type: String,
			required: true,
			validate: {
				validator: function (v: string) {
					return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
				},
				message: 'Stroke color must be a valid hex color code'
			}
		},
		buttonColor: {
			type: String,
			required: true,
			validate: {
				validator: function (v: string) {
					return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
				},
				message: 'Button color must be a valid hex color code'
			}
		},
		buttonBackground: {
			type: String,
			required: true,
			validate: {
				validator: function (v: string) {
					return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
				},
				message: 'Button background color must be a valid hex color code'
			}
		},
		shadow: {
			default: { type: String, required: true, default: '4px 4px 0px 0px #000000' },
			active: { type: String, required: true, default: '2px 2px 0px 0px #000000' },
			hovered: { type: String, required: true, default: '2px 2px 0px 0px #000000' },
			disabled: { type: String, required: true, default: '1px 1px 0px 0px #cccccc' },
			highlighted: { type: String, required: true, default: '6px 6px 0px 0px #000000' }
		},
		buttonRounding: {
			type: Number,
			required: true,
			default: 12,
			min: 0,
			max: 5000
		},

		// Theme category/tags for filtering
		category: {
			type: String,
			enum: ['light', 'dark', 'colorful', 'minimal', 'nature', 'professional', 'creative'],
			default: 'colorful'
		},

		// Whether theme is active/published
		isActive: { type: Boolean, default: true },

		// Whether it's a default/system theme
		isDefault: { type: Boolean, default: false },

		// Usage statistics
		usageCount: { type: Number, default: 0 },

		// Creator information
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

		// Additional metadata
		metadata: {
			supportedModes: [{ type: String, enum: ['creative', 'classic', 'both'], default: 'both' }],
			previewImage: { type: String, default: '' }, // URL to preview image
			tags: [{ type: String, trim: true }]
		}
	},
	TimestampOptions
);

// Indexes for better performance
ThemeSchema.index({ id: 1 });
ThemeSchema.index({ category: 1, isActive: 1 });
ThemeSchema.index({ isDefault: 1, isActive: 1 });
ThemeSchema.index({ usageCount: -1 });

// Pre-save middleware for validation
ThemeSchema.pre('save', function (next) {
	// All color fields are now required by the schema, so no additional validation needed
	// The individual color field validators will handle hex color validation
	next();
});

// Instance methods
ThemeSchema.methods.incrementUsage = function () {
	this.usageCount += 1;
	return this.save();
};

// Static methods
ThemeSchema.statics.getActiveThemes = function (category?: string) {
	const filter: any = { isActive: true };
	if (category) filter.category = category;
	return this.find(filter).sort({ usageCount: -1, createdAt: -1 });
};

ThemeSchema.statics.getDefaultThemes = function () {
	return this.find({ isDefault: true, isActive: true }).sort({ createdAt: 1 });
};

// Create the model with a fresh schema
const Theme = mongoose.model('Theme', ThemeSchema, 'theme');

export { Theme };

// TypeScript interface for type safety
export interface ITheme {
	_id?: string;
	name: string;
	description: string;
	id: string;
	background: string;
	foreground: string;
	stroke: string;
	buttonColor: string;
	buttonBackground: string;
	shadow: {
		default: string;
		active: string;
		hovered: string;
		disabled: string;
		highlighted: string;
	};
	buttonRounding: number;
	category: 'light' | 'dark' | 'colorful' | 'minimal' | 'nature' | 'professional' | 'creative';
	isActive: boolean;
	isDefault: boolean;
	usageCount: number;
	createdBy: string;
	metadata: {
		supportedModes: ('creative' | 'classic' | 'both')[];
		previewImage: string;
		tags: string[];
	};
	createdAt?: Date;
	updatedAt?: Date;
}
