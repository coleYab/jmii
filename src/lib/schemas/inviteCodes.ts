import mongoose from 'mongoose';

const InviteCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, index: true },
    used: { type: Boolean, default: false },
    usedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

// Add timestamps
InviteCodeSchema.set('timestamps', true);

// Create the model
const InviteCode = mongoose.models.InviteCode || mongoose.model('InviteCode', InviteCodeSchema);

export { InviteCode };