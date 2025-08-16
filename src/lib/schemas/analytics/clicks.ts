import mongoose from 'mongoose';

const options = {
    timestamps: true,
}

// Mongoose schema for a click event
const ClickSchema = new mongoose.Schema({
    viewId: { type: mongoose.Schema.Types.ObjectId, ref: 'View', required: true }, // reference to the view
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // allow anonymous
    pageUrl: { type: String, required: true }, // redundant but useful for analytics
    url: { type: String, required: true }, // the clicked URL
    ipAddress: { type: String, required: false },
    userAgent: { type: String, required: false },
    location: { type: String, required: false }
}, options);

// Create the model
const Click = mongoose.models.Click || mongoose.model('Click', ClickSchema);

export { Click }; 