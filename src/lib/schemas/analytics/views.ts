import mongoose from 'mongoose';

const options = {
    timestamps: true,
}


// Mongoose schema for a page view
const ViewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    pageUrl: { type: String, required: true },
    ipAddress: { type: String, required: false },
    userAgent: { type: String, required: false },
    location: { type: String, required: false }
}, options);

// Create the model
const View = mongoose.models.View || mongoose.model('View', ViewSchema);

export { View }; 