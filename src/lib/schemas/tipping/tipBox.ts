import mongoose from 'mongoose';
import { TimestampOptions } from '../common';

// Mongoose schema for database
const TipBoxSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    tippingEnabled: { type: Boolean, default: false },
    messagesEnabled: { type: Boolean, default: false }, // messages are stored on the page model 

    tips: { type: [mongoose.Schema.Types.ObjectId], ref: 'Tip', default: [] },

    autoResponseEnabled: { type: Boolean, default: false },
    autoResponseMessage: { type: String, default: '' },

    // Payment gateway account info
    accountName: { type: String, required: true }, // My Telebirr Account
    accountNumber: { type: String, required: true }, // 986563511
    bankCode: { type: String, required: true }, // CBE , TELEBIRR


    // TD think about the goal interaction here
    // goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', default: null },

}, TimestampOptions);


// Create the model
const TipBox = mongoose.models.TipBox || mongoose.model('TipBox', TipBoxSchema);

export { TipBox }; 