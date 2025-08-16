<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ShareNetwork, SpinnerGap, Palette, Download } from 'phosphor-svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select/index.js';

	import QRCodeStyling, {
		type DrawType,
		type TypeNumber,
		type Mode,
		type ErrorCorrectionLevel,
		type DotType,
		type CornerSquareType,
		type CornerDotType
	} from 'qr-code-styling';

	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Color from 'canvas-sketch-util/color';
	import { DiceFive } from 'phosphor-svelte';
	import {
		CONTRAST_AAA,
		CONTRAST_AA,
		ensureQRContrast,
		createRoundedImage,
		processImageColors
	} from './ShareImageUtils.js';

	interface Props {
		userUrl: string;
		profileImage?: string;
	}

	let { userUrl, profileImage }: Props = $props();

	let fileExt = $state('png');

	// File extension options
	const fileExtensions = [
		{ value: 'png', label: 'PNG' },
		{ value: 'jpeg', label: 'JPEG' },
		{ value: 'webp', label: 'WebP' }
	];

	const triggerContent = $derived(
		fileExtensions.find((ext) => ext.value === fileExt)?.label ?? 'Select format'
	);
	let foregroundColor = $state('#222222');
	let backgroundColor = $state('#ffffff');
	let extractedColors = $state<string[]>([]);
	let contrastingColors = $state<string[]>([]);
	let isExtractingColors = $state(false);
	let currentContrast = $state(0);
	let customImage = $state<string | null>(null);
	let processedImage = $state<string | null>(null);
	let selectedColorIndex = $state<number | null>(null);

	let options = $state({
		width: 500,
		height: 500,
		type: 'canvas' as DrawType,
		data: page.url.hostname + '/' + userUrl,
		// svelte-ignore state_referenced_locally
		image: processedImage || profileImage || '/favicon.ico',
		margin: 50,
		qrOptions: {
			typeNumber: 0 as TypeNumber,
			mode: 'Byte' as Mode,
			errorCorrectionLevel: 'H' as ErrorCorrectionLevel
		},
		imageOptions: {
			hideBackgroundDots: true,
			imageSize: 0.4,
			margin: 5,
			crossOrigin: 'anonymous'
		},
		dotsOptions: {
			// svelte-ignore state_referenced_locally
			color: foregroundColor,
			type: 'rounded' as DotType
		},
		backgroundOptions: {
			// svelte-ignore state_referenced_locally
			color: backgroundColor
		},
		cornersSquareOptions: {
			// svelte-ignore state_referenced_locally
			color: foregroundColor,
			type: 'rounded' as CornerSquareType
		},
		// svelte-ignore state_referenced_locally
		cornersDotOptions: {
			color: foregroundColor,
			type: 'rounded' as CornerDotType
		}
	});

	let qrCode = $state<QRCodeStyling | null>(null);
	let rawdata = $state<Blob | null>(null);
	let qrCodeUrl = $state<string | null>(null);
	let qrWithTaglineUrl = $state<string | null>(null);

	// Share platforms
	const sharePlatforms = [
		{
			name: 'Telegram',
			urlTemplate: 'https://telegram.me/share/url?url={url}&text={text}',
			text: "Hey there! Exciting news - I'm now on Jami and I'd love for you to check out my profile!, See you on the other side! 🤘😎"
		},
		{
			name: 'X (Twitter)',
			urlTemplate: 'https://x.com/intent/post?url={url}'
		}
	];

	let shareLinks = $derived(
		sharePlatforms.map((platform) => {
			let url = platform.urlTemplate.replace(
				'{url}',
				encodeURIComponent('https://' + page.url.hostname + '/' + userUrl)
			);
			if (platform.text) {
				url = url.replace('{text}', encodeURIComponent(platform.text));
			}
			return {
				...platform,
				url
			};
		})
	);

	let isSaving = $state(false);

	// Extract colors when profile image is available
	async function handleColorExtraction() {
		if (!profileImage) return;

		isExtractingColors = true;
		selectedColorIndex = null; // Reset selection when extracting new colors
		try {
			const { extractedColors: colors, contrastingColors: contrasting } =
				await processImageColors(profileImage);
			extractedColors = colors;
			contrastingColors = contrasting;
		} catch (error) {
			console.error('Failed to extract colors:', error);
		} finally {
			isExtractingColors = false;
		}
	}

	// Update QR code colors
	function updateQRColors() {
		const contrastInfo = ensureQRContrast(foregroundColor, backgroundColor);

		options.dotsOptions.color = foregroundColor;
		options.backgroundOptions.color = backgroundColor;
		options.cornersSquareOptions.color = foregroundColor;
		options.cornersDotOptions.color = foregroundColor;

		if (qrCode) {
			qrCode.update(options);
		}

		return contrastInfo;
	}

	// Set color from palette
	function setForegroundColor(color: string) {
		foregroundColor = color;
		selectedColorIndex = null; // Reset selection when manually changing colors
		updateQRColors();
	}

	function setBackgroundColor(color: string) {
		backgroundColor = color;
		selectedColorIndex = null; // Reset selection when manually changing colors
		updateQRColors();
	}

	// Set color combination from palette
	function setColorCombination(foreground: string, background: string, index: number) {
		foregroundColor = foreground;
		backgroundColor = background;
		selectedColorIndex = index;
		updateQRColors();
	}

	// Update QR code image with rounded corners
	async function updateQRImage() {
		const imageUrl = customImage || profileImage || '/favicon.ico';

		try {
			// Create rounded version of the image
			const roundedImageUrl = await createRoundedImage(imageUrl);
			processedImage = roundedImageUrl;
			options.image = roundedImageUrl;
		} catch (error) {
			console.warn('Failed to create rounded image, using original:', error);
			processedImage = imageUrl;
			options.image = imageUrl;
		}

		if (qrCode) {
			qrCode.update(options);
		}
	}

	// Download QR code with tagline
	async function downloadQRCode() {
		if (!qrCode) return;

		isSaving = true;
		try {
			const blob = await generateQRWithTagline();
			if (blob) {
				// Create download link
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `qr-code-${userUrl}.${fileExt}`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			} else {
				// Fallback to original download if tagline generation fails
				await qrCode.download({
					name: `qr-code-${userUrl}`,
					extension: fileExt as any
				});
			}
		} catch (error) {
			console.error('Download failed:', error);
		} finally {
			isSaving = false;
		}
	}

	// Helper function to ensure color is in hex format
	function ensureHexColor(color: string): string {
		// If already hex, return as is
		if (color.startsWith('#')) {
			return color.toUpperCase();
		}

		// Convert rgb/rgba to hex
		if (color.startsWith('rgb')) {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			if (ctx) {
				ctx.fillStyle = color;
				return ctx.fillStyle.toString().toUpperCase();
			}
		}

		// Fallback: try to convert using a temporary element
		const div = document.createElement('div');
		div.style.color = color;
		document.body.appendChild(div);
		const computedColor = getComputedStyle(div).color;
		document.body.removeChild(div);

		// Convert computed rgb to hex
		const match = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
		if (match) {
			const r = parseInt(match[1]);
			const g = parseInt(match[2]);
			const b = parseInt(match[3]);
			return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
		}

		return color; // Return original if conversion fails
	}

	// Add canvas utilities for tagline generation
	async function loadFont(fontFamily: string, fontUrl?: string): Promise<void> {
		if (fontUrl) {
			const font = new FontFace(fontFamily, `url(${fontUrl})`);
			await font.load();
			document.fonts.add(font);
		}
		// Fallback to system fonts if font loading fails
	}

	async function createSVGImage(svgContent: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			const blob = new Blob([svgContent], { type: 'image/svg+xml' });
			const url = URL.createObjectURL(blob);

			img.onload = () => {
				URL.revokeObjectURL(url);
				resolve(img);
			};
			img.onerror = () => {
				URL.revokeObjectURL(url);
				reject(new Error('Failed to load SVG'));
			};
			img.src = url;
		});
	}

	async function generateQRWithTagline(): Promise<Blob | null> {
		if (!qrCode) return null;

		try {
			// Load Lexend font from local file (fallback to system fonts if unavailable)
			try {
				await loadFont('Lexend', '/fonts/Lexend/Lexend-VariableFont_wght.ttf');
			} catch (e) {
				console.warn('Failed to load Lexend font, using fallback');
			}

			// Get QR code canvas - qr-code-styling creates internal canvas
			const qrCanvas = document.createElement('canvas');
			qrCanvas.width = options.width;
			qrCanvas.height = options.height;
			const qrCtx = qrCanvas.getContext('2d');
			if (!qrCtx) throw new Error('Failed to get QR canvas context');

			// Generate QR code on our canvas
			await qrCode.update({ ...options, type: 'canvas' });
			const qrImageData = await qrCode.getRawData('png');
			if (!qrImageData) throw new Error('Failed to get QR data');

			// Create image from QR data and draw to canvas
			const qrImg = new Image();
			await new Promise<void>((resolve, reject) => {
				qrImg.onload = () => resolve();
				qrImg.onerror = () => reject(new Error('Failed to load QR image'));
				qrImg.src = URL.createObjectURL(
					qrImageData instanceof Blob ? qrImageData : new Blob([qrImageData])
				);
			});
			qrCtx.drawImage(qrImg, 0, 0);

			// Load Jami logo
			const logoSvg = `<svg width="612" height="275" viewBox="0 0 612 275" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M122.84 223.18C140.43 223.18 154.69 208.92 154.69 191.33C154.69 173.74 140.43 159.48 122.84 159.48C105.249 159.48 90.9897 173.74 90.9897 191.33C90.9897 208.92 105.249 223.18 122.84 223.18Z" fill="#58266B"/>
<path d="M155.34 247.68C147.82 250.85 139.31 252.64 130.3 252.64C117.93 252.64 106.51 249.27 97.2998 243.58C89.9698 239.67 81.9098 232.76 74.7398 223.71C59.9798 205.08 54.6098 184.38 62.7498 177.49C65.2198 175.4 68.6598 174.82 72.6598 175.55L81.3298 185.51L87.4398 192.52C92.9098 201.56 102.11 208.69 113.32 212.62C118.35 214.39 123.79 215.52 129.49 215.88C129.27 217.52 129.19 219.21 129.26 220.93C129.86 235.64 141.35 247.21 155.35 247.67L155.34 247.68Z" fill="#6B2B7F"/>
<path d="M154.49 147.85C146.49 155.06 134.15 154.42 126.94 146.41L81.4799 95.9599C74.2699 87.9499 74.9199 75.6199 82.9199 68.4099C86.6499 65.0499 91.3199 63.3999 95.9699 63.3999C101.3 63.3999 106.62 65.5699 110.47 69.8499L155.93 120.3C163.14 128.3 162.49 140.64 154.49 147.85Z" fill="#D93593"/>
<path d="M137.01 100.55C151.53 79.6399 169.56 69.9399 180.22 74.8199C186.91 77.8899 188.11 83.3999 188.11 83.3999C188.7 85.7199 188.28 87.6899 187.67 90.6199C187.04 93.6299 186.08 96.1899 183.26 101.96C179.5 109.66 179.1 109.38 177.27 113.81C175.41 118.31 174.46 121.88 173.93 124.23C173.05 128.17 172.58 130.26 172.79 133.28C173.07 137.34 174.42 140.73 175.14 142.52C175.88 144.37 176.62 145.78 176.85 146.2C178.6 149.46 180.2 151.24 180.1 151.33C179.92 151.48 175.47 146.12 169.4 139.85C164.97 135.27 165.04 135.75 162.42 132.87C157.57 127.54 156.03 124.47 152.13 119.28C149.67 116.01 145.96 111.47 140.74 106.42" fill="#C23C96"/>
<path d="M152.01 115.74C160.04 124.28 160.31 124.04 172.4 136.39C173.3 137.31 182.14 146.37 193.03 158.63C200.27 166.78 203.13 170.4 205.29 175.95C207.94 182.77 208.03 188.65 207.92 191.51C207.57 200.09 204.39 206.29 202.83 209.25C200.4 213.86 197.74 217.03 195.32 219.9C191.27 224.71 187.53 227.98 184.93 230.24C182.1 232.69 179.19 235.21 174.73 238.08C170.04 241.09 166.19 242.83 162.11 244.68C157.38 246.82 155.02 247.89 153.07 248.1C146.2 248.82 140.6 245.05 138.47 243.62C133.49 240.27 131.29 236.22 130.41 234.55C128.52 230.96 128.07 227.84 127.72 225.44C127.41 223.26 126.97 220.26 127.62 216.61C128.68 210.67 131.95 206.6 135.19 202.58C136.77 200.61 139 197.88 142.72 194.98C149.1 190 151.59 191 154.21 187.53C158.28 182.13 155.86 174.94 155.36 173.43C154.14 169.8 152.05 167.45 148.77 163.75C145.95 160.57 144.26 159.4 140.08 155.61C134.08 150.17 131.07 147.44 129.65 145.34C122.88 135.31 125.84 123.49 126.38 121.33C127.12 118.37 128.15 116.09 128.91 114.42C132.34 106.83 137.62 100.21 137.62 100.2C137.62 100.2 146.34 109.74 152 115.75L152.01 115.74Z" fill="#612976"/>
<path d="M116.93 204.91C114.79 206.78 112.25 207.96 109.61 208.48C104.36 209.51 98.71 207.91 94.87 203.79L86.22 194.5L82.31 190.3L79.9 187.72L70.93 178.09L70.52 177.65C64.75 171.45 65.26 161.91 71.68 156.33C74.66 153.74 78.4 152.46 82.13 152.46C84.29 152.46 86.45 152.89 88.45 153.74C90.22 154.5 91.87 155.59 93.3 157C93.45 157.14 93.59 157.3 93.74 157.45L94.33 158.09L95.43 159.27C95.43 159.27 95.47 159.31 95.49 159.33L104.4 168.9L118.08 183.59C123.85 189.79 123.34 199.33 116.92 204.91H116.93Z" fill="#82459A"/>
<path d="M152.78 190.65C145.84 197.23 134.59 197.23 127.65 190.65L93.6198 158.37C93.6198 158.37 93.5698 158.33 93.5598 158.3C93.1498 157.91 92.7598 157.51 92.3998 157.09C92.0598 156.69 91.7398 156.29 91.4498 155.87C86.7798 149.31 87.4998 140.33 93.6198 134.52C97.0898 131.23 101.64 129.58 106.19 129.58C110.74 129.58 115.29 131.23 118.76 134.52L127.02 142.36L152.79 166.81C159.73 173.39 159.73 184.07 152.79 190.65H152.78Z" fill="#99459A"/>
<path d="M167.928 57.4024C177.358 46.5809 178.211 31.8903 169.834 24.5899C161.457 17.2896 147.021 20.144 137.591 30.9655C128.16 41.787 127.307 56.4777 135.684 63.778C144.062 71.0784 158.498 68.2239 167.928 57.4024Z" fill="#622A78"/>
<path d="M162.349 53.6337C171.482 43.1536 173.242 29.7398 166.28 23.6732C159.319 17.6065 146.271 21.1842 137.139 31.6643C128.006 42.1444 126.246 55.5582 133.208 61.6249C140.17 67.6915 153.217 64.1138 162.349 53.6337Z" fill="#F58822"/>
<path d="M215.84 40.03L210.94 41.31C205.94 42.62 202.15 46.7 201.21 51.79L200.35 56.44L199.49 51.79C198.55 46.71 194.76 42.63 189.76 41.32L184.86 40.04L189.76 38.78C194.75 37.5 198.56 33.46 199.54 28.4L200.34 24.27L201.13 28.39C202.11 33.45 205.92 37.5 210.91 38.78L215.82 40.03H215.84Z" fill="#5E2974"/>
<path d="M294.55 128.45V180.67C294.55 199.61 279.46 215.06 260.45 215.2C254.16 215.06 249.13 210.05 249.13 203.78C249.13 197.37 254.3 192.22 260.73 192.22H260.17C266.46 192.22 271.49 187.21 271.49 180.66V128.44C271.49 122.03 276.8 116.88 283.09 116.88C289.52 116.88 294.55 122.03 294.55 128.44V128.45ZM271.49 100.04C271.49 93.63 276.8 88.48 283.09 88.48C289.52 88.48 294.55 93.63 294.55 100.04C294.55 106.31 289.52 111.46 283.09 111.46C276.8 111.46 271.49 106.31 271.49 100.04ZM378.41 151.98V175.1C378.41 181.51 373.1 186.66 366.81 186.66C360.38 186.66 355.21 181.51 355.21 175.1V151.84H355.07C355.07 145.57 349.9 140.42 343.61 140.42C337.18 140.42 331.87 145.57 331.87 151.84C331.87 154.62 332.71 156.85 334.25 158.94C334.95 159.92 338.3 162.56 339.28 163.54C342.49 166.74 343.19 172.03 341.1 176.21C338.3 182.2 331.32 184.43 325.45 181.78L323.07 180.25C314.27 173.98 308.53 163.54 308.53 151.98V151.84C308.53 132.62 324.18 117.03 343.61 117.03C343.61 117.03 352.97 117.17 358.56 120.51C360.66 118.28 363.45 117.03 366.81 117.03C373.1 117.03 378.41 122.18 378.41 128.59V151.85H378.55C378.55 151.85 378.41 151.85 378.41 151.99V151.98ZM509.22 151.98V175.23C509.22 181.5 503.91 186.65 497.48 186.65C491.05 186.65 485.88 181.5 485.88 175.23V151.98C485.88 145.57 480.57 140.28 474.14 140.28C467.71 140.28 462.4 145.57 462.4 151.98V175.23C462.4 181.5 457.23 186.65 450.8 186.65C444.37 186.65 439.06 181.5 439.06 175.23V151.98C439.06 145.57 434.03 140.28 427.6 140.28C421.17 140.28 415.86 145.57 415.86 151.98V175.23C415.86 181.5 410.69 186.65 404.26 186.65C397.83 186.65 392.52 181.5 392.52 175.23V151.98C392.52 132.62 408.31 117.03 427.6 117.03C436.54 117.03 444.65 120.37 450.8 125.94C456.95 120.37 465.2 117.03 474.14 117.03C493.43 117.03 509.22 132.77 509.22 151.98ZM523.19 100.04C523.19 93.63 528.22 88.48 534.65 88.48C541.08 88.48 546.11 93.63 546.11 100.04C546.11 106.31 541.08 111.46 534.65 111.46C528.22 111.46 523.19 106.31 523.19 100.04ZM546.11 128.59V175.24C546.11 181.51 541.08 186.66 534.65 186.66C528.22 186.66 523.19 181.51 523.19 175.24V128.59C523.19 122.32 528.22 117.17 534.65 117.17C541.08 117.17 546.11 122.32 546.11 128.59Z" fill="url(#paint0_linear_65_7633)"/>
<defs>
<linearGradient id="paint0_linear_65_7633" x1="249.13" y1="151.84" x2="546.11" y2="151.84" gradientUnits="userSpaceOnUse">
<stop stop-color="#D9347F"/>
<stop offset="1" stop-color="#4D3C97"/>
</linearGradient>
</defs>
</svg>
`;

			const logoImg = await createSVGImage(logoSvg);

			// Create final canvas with tagline space
			const padding = 20;
			const taglineHeight = 120;
			const finalWidth = qrCanvas.width + padding * 2;
			const finalHeight = qrCanvas.height + taglineHeight + padding * 2;

			const finalCanvas = document.createElement('canvas');
			finalCanvas.width = finalWidth;
			finalCanvas.height = finalHeight;
			const ctx = finalCanvas.getContext('2d');

			if (!ctx) throw new Error('Failed to get canvas context');

			// Fill background
			ctx.fillStyle = backgroundColor;
			ctx.fillRect(0, 0, finalWidth, finalHeight);

			// Draw QR code centered
			const qrX = (finalWidth - qrCanvas.width) / 2;
			const qrY = padding;
			ctx.drawImage(qrCanvas, qrX, qrY);

			// Calculate tagline position
			const taglineY = qrY + qrCanvas.height + 10;
			const centerX = finalWidth / 2;

			// Draw logo (scaled to fit)
			const logoScale = 0.25; // Scale down the logo
			const logoWidth = logoImg.width * logoScale;
			const logoHeight = logoImg.height * logoScale;
			const logoX = centerX - logoWidth / 2;
			const logoY = taglineY + 5;

			ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

			// Draw URL text
			const urlText = page.url.hostname + '/' + userUrl;
			const fontSize = 14;
			ctx.font = `${fontSize}px Lexend, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
			ctx.fillStyle = foregroundColor;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';

			const textY = logoY + logoHeight + 15;
			ctx.fillText(urlText, centerX, textY);

			// Convert to blob
			return new Promise((resolve) => {
				finalCanvas.toBlob(
					(blob) => {
						resolve(blob);
					},
					`image/${fileExt}`,
					0.95
				);
			});
		} catch (error) {
			console.error('Failed to generate QR with tagline:', error);
			return null;
		}
	}

	onMount(() => {
		qrCode = new QRCodeStyling(options);

		// Extract colors from profile image if available
		if (profileImage) {
			handleColorExtraction();
		}

		// Process image for rounded corners
		updateQRImage();

		return () => {};
	});

	// Update colors when they change
	$effect(() => {
		const contrastInfo = updateQRColors();
		currentContrast = contrastInfo.contrast;
	});

	$effect(() => {
		const currentQrCode = qrCode;
		let previousUrl = qrCodeUrl;

		if (currentQrCode) {
			(async () => {
				const data = await currentQrCode.getRawData();
				if (data instanceof Blob) {
					rawdata = data;
					const newUrl = URL.createObjectURL(data);
					qrCodeUrl = newUrl;
				} else {
					rawdata = null;
					qrCodeUrl = null;
				}
			})();
		} else {
			rawdata = null;
			qrCodeUrl = null;
		}

		return () => {
			if (previousUrl) {
				URL.revokeObjectURL(previousUrl);
			}
		};
	});

	// Update image source when profileImage prop changes
	$effect(() => {
		if (qrCode && (profileImage || customImage)) {
			updateQRImage();
		}
	});

	// Generate preview with tagline when QR code or colors change
	$effect(() => {
		if (qrCode && foregroundColor && backgroundColor) {
			// Debounce to avoid too many regenerations
			const timeoutId = setTimeout(async () => {
				try {
					const blob = await generateQRWithTagline();
					if (blob) {
						// Clean up previous URL
						if (qrWithTaglineUrl) {
							URL.revokeObjectURL(qrWithTaglineUrl);
						}
						qrWithTaglineUrl = URL.createObjectURL(blob);
					}
				} catch (error) {
					console.warn('Failed to generate preview with tagline:', error);
				}
			}, 500);

			return () => {
				clearTimeout(timeoutId);
			};
		}
	});
</script>

<Dialog.Root>
	<Dialog.Trigger>
		<Button
			variant="ghost"
			class="rounded-2xl border border-primary/20 transition-all duration-300"
		>
			{#if !isSaving}
				<ShareNetwork weight="duotone" />
				<span class="hidden md:block">Share</span>
			{:else}
				<SpinnerGap weight="duotone" />
				<span class="hidden md:block">Share</span>
			{/if}
		</Button>
	</Dialog.Trigger>
	<Dialog.Content
		class="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto p-4 sm:min-w-[60vw] sm:p-8 lg:p-12"
	>
		<Dialog.Header>
			<Dialog.Title>Share your link</Dialog.Title>
			<Dialog.Description>Share your unique link & customize your QR code</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-4 sm:gap-6 lg:grid-cols-2">
			<!-- Left side - Share options and QR customization -->
			<div class="space-y-4 sm:space-y-6">
				<!-- Share Link -->
				<div class="space-y-2">
					<h3 class="font-semibold">Your Link</h3>
					<div class="flex items-center gap-2 rounded-md border bg-muted p-2">
						<p class="flex-1 truncate text-sm text-muted-foreground">
							{'https://' + page.url.hostname + '/' + userUrl}
						</p>
					</div>
				</div>

				<!-- Share Platforms -->
				<div class="space-y-2">
					<h3 class="font-semibold">Share On</h3>
					<div class="flex flex-wrap gap-2">
						{#each shareLinks as platform (platform.name)}
							<a href={platform.url} target="_blank" rel="noopener noreferrer">
								<Button variant="outline" size="sm">{platform.name}</Button>
							</a>
						{/each}
					</div>
				</div>

				<!-- QR Code Customization -->
				<div class="space-y-4">
					<h3 class="font-semibold">Customize QR Code</h3>

					<!-- Color Controls -->
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-2">
							<Label class="text-sm font-medium">Foreground Color</Label>
							<div
								class="flex items-center gap-2 rounded-xl border p-2"
								style="background-color: {backgroundColor}"
							>
								<input
									type="color"
									bind:value={foregroundColor}
									oninput={() => setForegroundColor(foregroundColor)}
									class="h-8 w-8 cursor-pointer rounded-xl"
								/>
								<span class="font-mono text-sm" style="color: {foregroundColor}; "
									>{ensureHexColor(foregroundColor)}</span
								>
							</div>
						</div>

						<div class="space-y-2">
							<Label class="text-sm font-medium">Background Color</Label>
							<div
								class="flex items-center gap-2 rounded-xl border p-2"
								style="background-color: {foregroundColor}"
							>
								<input
									type="color"
									bind:value={backgroundColor}
									oninput={() => setBackgroundColor(backgroundColor)}
									class="h-8 w-8 cursor-pointer rounded-xl border-none"
								/>
								<span class="font-mono text-sm" style="color: {backgroundColor}; "
									>{ensureHexColor(backgroundColor)}</span
								>
							</div>
						</div>
					</div>

					<!-- Profile Image Colors -->
					{#if profileImage}
						<div class="space-y-3">
							{#if extractedColors.length > 0}
								<div class="space-y-2">
									<p class="text-xs text-muted-foreground">Suggested combinations</p>
									<div class="flex flex-wrap gap-2">
										{#each extractedColors as originalColor, i}
											{#if contrastingColors[i]}
												{@const contrast = Color.contrastRatio(originalColor, contrastingColors[i])}
												<button
													onclick={() => {
														setColorCombination(originalColor, contrastingColors[i], i);
													}}
													aria-label="Use combination: {originalColor} on {contrastingColors[
														i
													]} (Contrast: {contrast.toFixed(1)}:1)"
													class="relative flex h-8 w-16 cursor-pointer rounded-[13px] border shadow-sm transition-transform hover:scale-110
																		{selectedColorIndex === i ? 'border border-primary shadow-xl' : 'border-primary/20'}"
													title="Use combination: {originalColor} on {contrastingColors[
														i
													]} (Contrast: {contrast.toFixed(1)}:1)"
												>
													<div
														class="h-full w-1/2 rounded-l-xl"
														style="background-color: {originalColor}"
													></div>
													<div
														class="h-full w-1/2 rounded-r-xl"
														style="background-color: {contrastingColors[i]}"
													></div>
													{#if contrast >= CONTRAST_AAA}
														<div
															class="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-green-500 text-[8px] font-bold text-white"
														>
															✓
														</div>
													{:else if contrast >= CONTRAST_AA}
														<div
															class="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-yellow-500 text-[8px] font-bold text-white"
														>
															~
														</div>
													{/if}
												</button>
											{/if}
										{/each}
									</div>
								</div>
							{:else}
								<div class="rounded-lg border bg-muted/50 p-3">
									<p class="text-xs text-muted-foreground">
										No suitable color combinations found from this image. Try using manual color
										selection.
									</p>
								</div>
							{/if}
						</div>
					{/if}
					<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<p class="text-sm text-muted-foreground">
							Preview • {ensureHexColor(foregroundColor)} on {ensureHexColor(backgroundColor)}
						</p>
						<Button
							size="sm"
							variant="outline"
							onclick={() => {
								handleColorExtraction();
								// Select one of the extracted colors
								const randomIndex = Math.floor(Math.random() * extractedColors.length);
								setColorCombination(
									extractedColors[randomIndex],
									contrastingColors[randomIndex],
									randomIndex
								);
							}}
							disabled={isExtractingColors}
							class="w-full sm:w-auto"
						>
							{#if isExtractingColors}
								<SpinnerGap class="mr-2 h-4 w-4 animate-spin" />
							{:else}
								<DiceFive class="mr-2 h-4 w-4" />
							{/if}
							Re-roll colors
						</Button>
					</div>
				</div>
			</div>

			<!-- Right side - QR Code Preview -->
			<div class="flex flex-col items-center justify-center">
				{#if qrWithTaglineUrl || qrCodeUrl}
					<div class="w-full space-y-4">
						<div class="flex justify-center">
							<img
								class="rounded-2xl border bg-white p-2 shadow-lg sm:p-4"
								src={qrWithTaglineUrl || qrCodeUrl}
								alt="QR Code Preview with Tagline"
								style="max-width: min(100%, {options.width / 1.4}px); height: auto;"
							/>
						</div>

						<div class="flex flex-col gap-2">
							<!-- Contrast Indicator -->
							<div class="flex flex-col gap-2">
								<div class="flex items-center justify-start gap-2">
									<span class="text-sm font-medium">Readability </span>
									{#if currentContrast >= CONTRAST_AAA}
										<div class="flex items-center gap-1 text-green-600">
											<div class="h-2 w-2 rounded-full bg-green-500"></div>
											<span class="text-xs">Perfect</span>
										</div>
									{:else if currentContrast >= CONTRAST_AA}
										<div class="flex items-center gap-1 text-yellow-600">
											<div class="h-2 w-2 rounded-full bg-yellow-500"></div>
											<span class="text-xs">Okay</span>
										</div>
									{:else}
										<div class="flex items-center gap-1 text-red-600">
											<div class="h-2 w-2 rounded-full bg-red-500"></div>
											<span class="text-xs">Poor</span>
										</div>
									{/if}
								</div>
								<p class="text-xs text-muted-foreground">
									{#if currentContrast >= CONTRAST_AAA}
										Perfect readability - QR code will scan easily on all lighting conditions
									{:else if currentContrast >= CONTRAST_AA}
										Good readability - QR code will scan easily on most lighting conditions
									{:else}
										Poor readability - QR code will not scan easily on most lighting conditions
									{/if}
								</p>
							</div>

							<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
								<Select.Root type="single" name="fileExtension" bind:value={fileExt}>
									<Select.Trigger class="w-full sm:w-[120px]">
										{triggerContent}
									</Select.Trigger>
									<Select.Content>
										{#each fileExtensions as extension (extension.value)}
											<Select.Item value={extension.value} label={extension.label}>
												{extension.label}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
								<Button
									size="sm"
									onclick={downloadQRCode}
									disabled={isSaving || currentContrast < CONTRAST_AA}
									title={currentContrast < CONTRAST_AA
										? 'Download disabled due to poor contrast. Please select colors with better contrast.'
										: 'Download QR code'}
									class="w-full sm:w-auto"
								>
									{#if isSaving}
										<SpinnerGap class="mr-2 h-4 w-4 animate-spin" />
									{:else}
										<Download class="mr-2 h-4 w-4" />
									{/if}
									Download
								</Button>
							</div>
						</div>
					</div>
				{:else}
					<div
						class="flex items-center justify-center rounded-md border p-4"
						style="width: min(100%, {options.width / 1.2}px); height: {Math.min(
							300,
							options.height / 1.2
						)}px;"
					>
						<SpinnerGap weight="duotone" class="h-12 w-12 animate-spin" />
					</div>
				{/if}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
