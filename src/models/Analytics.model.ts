import mongoose from 'mongoose';
import { TimestampOptions } from '../lib/schemas/common';

// Analytics model for aggregated data
export interface IAnalytics extends mongoose.Document {
	userId: mongoose.Types.ObjectId;
	date: Date;
	views: number;
	clicks: number;
	ctr: number; // Click-through rate
	updatedAt: Date;
	createdAt: Date;
}

const AnalyticsSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		date: { type: Date, required: true, index: true }, // Date for aggregation (daily)
		views: { type: Number, default: 0 },
		clicks: { type: Number, default: 0 },
		ctr: { type: Number, default: 0 } // Click-through rate percentage
	},
	{
		...TimestampOptions,
		timestamps: true
	}
);

// Compound index for efficient queries
AnalyticsSchema.index({ userId: 1, date: 1 }, { unique: true });

// Method to calculate CTR
AnalyticsSchema.methods.calculateCTR = function() {
	this.ctr = this.views > 0 ? (this.clicks / this.views) * 100 : 0;
	return this.ctr;
};

// Static method to update or create analytics entry
AnalyticsSchema.statics.incrementViews = async function(userId: string, date: Date = new Date()) {
	const startOfDay = new Date(date);
	startOfDay.setHours(0, 0, 0, 0);
	
	const result = await this.findOneAndUpdate(
		{ userId, date: startOfDay },
		{ $inc: { views: 1 } },
		{ upsert: true, new: true }
	);
	
	result.calculateCTR();
	await result.save();
	return result;
};

AnalyticsSchema.statics.incrementClicks = async function(userId: string, date: Date = new Date()) {
	const startOfDay = new Date(date);
	startOfDay.setHours(0, 0, 0, 0);
	
	const result = await this.findOneAndUpdate(
		{ userId, date: startOfDay },
		{ $inc: { clicks: 1 } },
		{ upsert: true, new: true }
	);
	
	result.calculateCTR();
	await result.save();
	return result;
};

// Create the model
const Analytics = mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);

export { Analytics }; 