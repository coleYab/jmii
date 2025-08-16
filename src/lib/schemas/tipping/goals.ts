import mongoose from 'mongoose';

const options = {
    timestamps: true,
}

// Mongoose schema for database
const GoalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    goalAmount: { type: Number, required: true, min: 1 },

    title: { type: String, default: '', maxLength: 126 },
    description: { type: String, default: '', maxLength: 1080 },

    tips: { type: [mongoose.Schema.Types.ObjectId], ref: 'Tip', default: [] },

}, options);


// Create the model
const Goal = mongoose.models.Goal || mongoose.model('Goal', GoalSchema);

export { Goal }; 