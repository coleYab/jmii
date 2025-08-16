import mongoose from 'mongoose';
import { TimestampOptions } from '../lib/schemas/common';

// Mongoose schema for database
// Router: file://./../routes/api/user/+server.ts

const UserSchema = new mongoose.Schema(
	{
		name: { type: String, default: '' },

		email: { type: String, required: true, unique: true, index: true },
		emailVerified: { type: Boolean, default: false },

		image: { type: String, default: '' },
		cover: { type: String, default: '' },

		profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null },

		// TODO: Create a tipbox on user creation
		tipBoxId: { type: mongoose.Schema.Types.ObjectId, ref: 'TipBox', default: null },
		analyticsId: { type: mongoose.Schema.Types.ObjectId, ref: 'Analytics', default: null },

		pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page', default: null },

		role: { type: String, enum: ['user', 'admin'], default: 'user' },
		url: { type: String, sparse: true, unique: true, maxLength: 32 }
	},
	TimestampOptions
);

// Create the model
const User = mongoose.models.User || mongoose.model('User', UserSchema, 'user');

export { User };
