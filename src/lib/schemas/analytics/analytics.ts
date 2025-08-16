import mongoose from 'mongoose';
import { TimestampOptions } from '../common';

// Mongoose schema for a click event
const AnalyticsSchema = new mongoose.Schema({
    viewId: { type: mongoose.Schema.Types.ObjectId, ref: 'View', required: true }, // reference to the view
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // allow anonymous
    pageUrl: { type: String, required: true }, // redundant but useful for analytics
    url: { type: String, required: true }, // the clicked URL
    ipAddress: { type: String, required: false },
    userAgent: { type: String, required: false },
    location: { type: String, required: false }
}, TimestampOptions);

// Create the model
const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema);

export { Analytics }; 