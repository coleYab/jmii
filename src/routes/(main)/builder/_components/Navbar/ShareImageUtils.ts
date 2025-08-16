import ColorThief from 'colorthief';
import Color from 'canvas-sketch-util/color';
import type QRCodeStyling from 'qr-code-styling';

// Contrast standards for QR codes
export const CONTRAST_AAA = 7; // Excellent contrast
export const CONTRAST_AA = 4.5; // Good contrast (minimum for QR codes)
export const CONTRAST_WARNING_THRESHOLD = 6; // When to show warning in console

// Image styling
export const IMAGE_BORDER_RADIUS = 48; // Border radius for center image in pixels

// Color extraction function
export async function extractColorsFromImage(imageUrl: string): Promise<string[]> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			try {
				const colorThief = new ColorThief();
				const palette = colorThief.getPalette(img, 8);
				const colors = palette.map((rgb) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
				resolve(colors);
			} catch (error) {
				reject(error);
			}
		};

		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = imageUrl;
	});
}

// Function to ensure good contrast for QR codes
export function ensureQRContrast(
	foreground: string,
	background: string
): { fg: string; bg: string; contrast: number } {
	try {
		const contrast = Color.contrastRatio(foreground, background);

		// QR codes need high contrast (at least AA, ideally AAA)
		if (contrast < CONTRAST_WARNING_THRESHOLD) {
			console.warn(
				`Low contrast detected: ${contrast.toFixed(2)}:1. Consider choosing different colors.`
			);
		}

		return { fg: foreground, bg: background, contrast };
	} catch (error) {
		console.warn('Color contrast check failed:', error);
		return { fg: foreground, bg: background, contrast: 0 };
	}
}

// Create contrasting version of a color with WCAG compliance
export function createContrastingColor(baseColor: string): string {
	try {
		const baseLuminance = Color.relativeLuminance(baseColor);
		let bestContrast = 0;
		let bestColor = '#000000';

		// Try multiple variations to find the best contrast
		for (let attempt = 0; attempt < 10; attempt++) {
			// Determine if we need a light or dark contrasting color
			const needsLight = baseLuminance < 0.5;
			const lightnessOffset = needsLight ? 40 + attempt * 5 : -(40 + attempt * 5);

			// Add some variation in hue and saturation
			const hueOffset = (Math.random() - 0.5) * 60; // -30 to +30
			const saturationOffset = (Math.random() - 0.5) * 40; // -20 to +20

			const candidate = Color.offsetHSL(baseColor, hueOffset, saturationOffset, lightnessOffset);
			const contrast = Color.contrastRatio(baseColor, candidate.hex);

			if (contrast > bestContrast) {
				bestContrast = contrast;
				bestColor = candidate.hex;
			}

			// If we achieve good contrast (AAA level), use it
			if (contrast >= CONTRAST_AAA) {
				break;
			}
		}

		// If we still don't have good contrast, use high-contrast fallbacks
		if (bestContrast < CONTRAST_AA) {
			bestColor = baseLuminance > 0.5 ? '#000000' : '#ffffff';
		}

		return bestColor;
	} catch (error) {
		console.warn('Failed to create contrasting color for:', baseColor);
		return '#000000';
	}
}

// Create rounded image using canvas
export function createRoundedImage(
	imageUrl: string,
	borderRadius: number = IMAGE_BORDER_RADIUS
): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				reject(new Error('Could not get canvas context'));
				return;
			}

			// Set canvas size to match image
			canvas.width = img.width;
			canvas.height = img.height;

			// Create rounded rectangle path
			const radius = Math.min(borderRadius, img.width / 2, img.height / 2);

			ctx.beginPath();
			ctx.roundRect(0, 0, img.width, img.height, radius);
			ctx.clip();

			// Draw the image within the rounded path
			ctx.drawImage(img, 0, 0);

			// Convert to data URL
			resolve(canvas.toDataURL('image/png'));
		};

		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = imageUrl;
	});
}

// Process colors from image and create contrasting pairs
export async function processImageColors(imageUrl: string): Promise<{
	extractedColors: string[];
	contrastingColors: string[];
}> {
	try {
		const colors = await extractColorsFromImage(imageUrl);

		// Create contrasting versions and filter out low contrast pairs
		const validPairs: { original: string; contrasting: string }[] = [];

		for (const color of colors) {
			const contrastingColor = createContrastingColor(color);
			const contrast = Color.contrastRatio(color, contrastingColor);

			// Only include pairs with good contrast (AA minimum)
			if (contrast >= CONTRAST_AA) {
				validPairs.push({ original: color, contrasting: contrastingColor });
			}
		}

		return {
			extractedColors: validPairs.map((pair) => pair.original),
			contrastingColors: validPairs.map((pair) => pair.contrasting)
		};
	} catch (error) {
		console.error('Failed to process image colors:', error);
		return {
			extractedColors: [],
			contrastingColors: []
		};
	}
}
