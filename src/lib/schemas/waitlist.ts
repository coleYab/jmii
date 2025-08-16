import mongoose from 'mongoose';

const WaitlistSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, index: true },
    preferredUrl: { type: String, required: true, unique: true, index: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'invited', 'registered'], default: 'pending' }
});

// Add timestamps
WaitlistSchema.set('timestamps', true);

// Create the model
const Waitlist = mongoose.models.Waitlist || mongoose.model('Waitlist', WaitlistSchema);

export { Waitlist }; 