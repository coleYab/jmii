import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Theme, type ITheme } from '../../../models/Theme.model';
import { User } from '../../../models/User.model';
import { connectDB } from '$lib/mongo';

// GET: Retrieve themes with optional filtering
export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		await connectDB();

		const category = url.searchParams.get('category');
		const isActive = url.searchParams.get('active') !== 'false';
		const defaultOnly = url.searchParams.get('default') === 'true';
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const page = parseInt(url.searchParams.get('page') || '1');

		let query: any = {};
		
		if (isActive) query.isActive = true;
		if (category) query.category = category;
		if (defaultOnly) query.isDefault = true;

		const skip = (page - 1) * limit;
		
		const [themes, total] = await Promise.all([
			Theme.find(query)
				.populate('createdBy', 'name email')
				.sort({ usageCount: -1, createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Theme.countDocuments(query)
		]);

		return json({
			success: true,
			data: themes,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit)
			}
		});
	} catch (error) {
		console.error('Theme GET error:', error);
		return json(
			{ success: false, error: 'Failed to fetch themes' },
			{ status: 500 }
		);
	}
};

// POST: Create a new theme
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		await connectDB();

		// Check authentication and admin role
		const user = locals.user;
		if (!user?.id) {
			return json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 }
			);
		}

		const userDoc = await User.findById(user.id);
		if (!userDoc || userDoc.role !== 'admin') {
			return json(
				{ success: false, error: 'Admin access required' },
				{ status: 403 }
			);
		}

		const themeData: Partial<ITheme> = await request.json();

		// Validate required fields
		if (!themeData.name || !themeData.description || !themeData.id || 
			!themeData.background || !themeData.foreground || !themeData.stroke || 
			!themeData.buttonColor || !themeData.buttonBackground || !themeData.shadow ||
			themeData.buttonRounding === undefined) {
			return json(
				{ success: false, error: 'Missing required fields: name, description, id, background, foreground, stroke, buttonColor, buttonBackground, shadow, buttonRounding' },
				{ status: 400 }
			);
		}

		// Validate shadow object
		if (!themeData.shadow.default || !themeData.shadow.active || !themeData.shadow.hovered || 
			!themeData.shadow.disabled || !themeData.shadow.highlighted) {
			return json(
				{ success: false, error: 'Missing required shadow states: default, active, hovered, disabled, highlighted' },
				{ status: 400 }
			);
		}

		// Validate color format
		const colorFields: (keyof ITheme)[] = ['background', 'foreground', 'stroke', 'buttonColor', 'buttonBackground'];
		const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
		
		for (const field of colorFields) {
			const colorValue = themeData[field];
			if (typeof colorValue === 'string' && !hexColorRegex.test(colorValue)) {
				return json(
					{ success: false, error: `${field} must be a valid hex color code` },
					{ status: 400 }
				);
			}
		}

		// Check if theme ID already exists
		const existingTheme = await Theme.findOne({ id: themeData.id });
		if (existingTheme) {
			return json(
				{ success: false, error: 'Theme ID already exists' },
				{ status: 409 }
			);
		}

		const newTheme = new Theme({
			...themeData,
			createdBy: userDoc._id,
			metadata: {
				supportedModes: ['both'],
				previewImage: '',
				tags: [],
				...themeData.metadata
			}
		});

		await newTheme.save();
		await newTheme.populate('createdBy', 'name email');

		return json({
			success: true,
			message: 'Theme created successfully',
			data: newTheme
		}, { status: 201 });

	} catch (error: any) {
		console.error('Theme POST error:', error);
		
		if (error.name === 'ValidationError') {
			return json(
				{ success: false, error: error.message },
				{ status: 400 }
			);
		}

		return json(
			{ success: false, error: 'Failed to create theme' },
			{ status: 500 }
		);
	}
};

// PUT: Update an existing theme
export const PUT: RequestHandler = async ({ request, locals }) => {
	try {
		await connectDB();

		const user = locals.user;
		if (!user?.id) {
			return json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 }
			);
		}

		const userDoc = await User.findById(user.id);
		if (!userDoc || userDoc.role !== 'admin') {
			return json(
				{ success: false, error: 'Admin access required' },
				{ status: 403 }
			);
		}

		const { id, ...updateData } = await request.json();
		
		if (!id) {
			return json(
				{ success: false, error: 'Theme ID is required' },
				{ status: 400 }
			);
		}

		const theme = await Theme.findOneAndUpdate(
			{ id },
			{ $set: updateData },
			{ new: true, runValidators: true }
		).populate('createdBy', 'name email');

		if (!theme) {
			return json(
				{ success: false, error: 'Theme not found' },
				{ status: 404 }
			);
		}

		return json({
			success: true,
			message: 'Theme updated successfully',
			data: theme
		});

	} catch (error: any) {
		console.error('Theme PUT error:', error);
		
		if (error.name === 'ValidationError') {
			return json(
				{ success: false, error: error.message },
				{ status: 400 }
			);
		}

		return json(
			{ success: false, error: 'Failed to update theme' },
			{ status: 500 }
		);
	}
};

// DELETE: Delete a theme
export const DELETE: RequestHandler = async ({ url, locals }) => {
	try {
		await connectDB();

		const user = locals.user;
		if (!user?.id) {
			return json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 }
			);
		}

		const userDoc = await User.findById(user.id);
		if (!userDoc || userDoc.role !== 'admin') {
			return json(
				{ success: false, error: 'Admin access required' },
				{ status: 403 }
			);
		}

		const themeId = url.searchParams.get('id');
		if (!themeId) {
			return json(
				{ success: false, error: 'Theme ID is required' },
				{ status: 400 }
			);
		}

		const theme = await Theme.findOneAndDelete({ id: themeId });
		
		if (!theme) {
			return json(
				{ success: false, error: 'Theme not found' },
				{ status: 404 }
			);
		}

		// Don't allow deletion of default themes
		if (theme.isDefault) {
			return json(
				{ success: false, error: 'Cannot delete default themes' },
				{ status: 403 }
			);
		}

		return json({
			success: true,
			message: 'Theme deleted successfully'
		});

	} catch (error) {
		console.error('Theme DELETE error:', error);
		return json(
			{ success: false, error: 'Failed to delete theme' },
			{ status: 500 }
		);
	}
}; 