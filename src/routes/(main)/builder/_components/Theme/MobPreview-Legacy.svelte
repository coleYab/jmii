<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import { onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';

	// Define the interface for a mobile device preset
	interface MobilePreset {
		name: string;
		width: number;
		height: number;
		devicePixelRatio?: number;
		userAgent?: string;
		type?: 'phone' | 'tablet'; // Device type for styling
		hasNotch?: boolean; // Whether the device has a notch
	}

	// Preset array of common mobile device dimensions with styling properties
	const mobilePresets: MobilePreset[] = [
		{ name: 'iPhone (Modern)', width: 390, height: 844, type: 'phone', hasNotch: true },
		{ name: 'iPad', width: 768, height: 1024, type: 'tablet', hasNotch: false }
	];

	// Current selected preset
	const selectedPreset: Writable<MobilePreset> = writable(mobilePresets[0]);

	// Scale factor for the preview (to fit in the available space)
	let scale = 1;
	let containerRef: HTMLDivElement;

	// Update the scale based on container size
	function updateScale() {
		if (!containerRef) return;

		const containerWidth = containerRef.clientWidth;
		const containerHeight = containerRef.clientHeight;

		const currentPreset = $selectedPreset;
		// Add extra width for device frame elements
		const frameWidth = currentPreset.width + 40; // 20px bezel on each side
		const frameHeight = currentPreset.height + 60; // extra space for top and bottom bezels

		const widthScale = (containerWidth * 0.9) / frameWidth;
		const heightScale = (containerHeight * 0.9) / frameHeight;

		// Use the smaller scale to ensure the preview fits
		scale = Math.min(widthScale, heightScale, 1);
	}

	// Handle window resize events
	function handleResize() {
		updateScale();
	}

	onMount(() => {
		updateScale();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	// Update scale when selected preset changes
	$: if ($selectedPreset) updateScale();

	// Determine device frame classes based on the selected preset
	$: deviceClasses = [
		'device-frame',
		$selectedPreset.type || 'phone',
		$selectedPreset.hasNotch ? 'has-notch' : ''
	]
		.filter(Boolean)
		.join(' ');
</script>

<div class="flex flex-row">
	<div class="max-w-screen-xl border p-8">
		<div class="preset-selector">
			<Label for="preset-select whitespace-nowrap">Device preset</Label>

			<Select.Root
				type="single"
				name="favoriteFruit"
				onValueChange={(value) => {
					if (value) {
						const preset = mobilePresets.find((preset) => preset.name === value);
						if (preset) {
							$selectedPreset = preset;
						}
					}
				}}
			>
				<Select.Trigger class="w-[180px]">
					{$selectedPreset.name}
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						{#each mobilePresets as preset}
							<Select.Item value={preset.name} label={preset.name}>
								{preset.name}
							</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>
		</div>
	</div>

	<div class="mobile-previewer-container" bind:this={containerRef}>
		<div class="preview-area py-2">
			<div
				class={deviceClasses}
				style:width="{$selectedPreset.width + 40}px"
				style:height="{$selectedPreset.height + 60}px"
				style:transform="scale({scale})"
			>
				<!-- Phone hardware elements -->
				{#if $selectedPreset.type !== 'tablet'}
					<!-- Power button -->
					<div class="phone-button power-button"></div>
					<!-- Volume buttons -->
					<div class="phone-button volume-up"></div>
					<div class="phone-button volume-down"></div>
				{/if}

				<!-- Screen area with notch compensation -->
				<div
					class="device-screen"
					style:width="{$selectedPreset.width}px"
					style:height="{$selectedPreset.height}px"
				>
					{#if $selectedPreset.hasNotch}
						<div class="notch"></div>
						<div class="status-bar"></div>
					{/if}

					<div class="device-content" class:has-notch={$selectedPreset.hasNotch}>
						<slot></slot>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.mobile-previewer-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
	}

	.preset-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.custom-device {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.custom-input {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.preview-area {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: start;
		overflow: hidden;
		background-color: #f5f5f5;
		border-radius: 0.5rem;
	}

	/* Base device frame */
	.device-frame {
		position: relative;
		transform-origin: center center;
		border-radius: 2rem;
		background-color: #1a1a1a;
		box-shadow:
			0 20px 40px rgba(0, 0, 0, 0.2),
			0 10px 20px rgba(0, 0, 0, 0.2),
			inset 0 0 0 2px rgba(255, 255, 255, 0.1);
		padding: 10px;
		display: flex;
		justify-content: center;
		align-items: center;
		transition:
			width 0.3s,
			height 0.3s;
	}

	/* Phone styling */
	.device-frame.phone {
		border-radius: 2.5rem;
	}

	/* Tablet styling */
	.device-frame.tablet {
		border-radius: 1.5rem;
	}

	/* Device screen */
	.device-screen {
		position: relative;
		background-color: white;
		border-radius: 1rem;
		overflow: hidden;
	}

	/* Phone hardware buttons */
	.phone-button {
		position: absolute;
		background-color: #2a2a2a;
		z-index: 2;
	}

	.power-button {
		right: -2px;
		top: 100px;
		width: 3px;
		height: 40px;
		border-top-right-radius: 2px;
		border-bottom-right-radius: 2px;
	}

	.volume-up {
		left: -2px;
		top: 80px;
		width: 3px;
		height: 30px;
		border-top-left-radius: 2px;
		border-bottom-left-radius: 2px;
	}

	.volume-down {
		left: -2px;
		top: 120px;
		width: 3px;
		height: 30px;
		border-top-left-radius: 2px;
		border-bottom-left-radius: 2px;
	}

	/* Simplified notch styling - inspired by iPhone 12 but more subtle */
	.notch {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 130px;
		height: 20px; /* Reduced height */
		background-color: #1a1a1a;
		border-bottom-left-radius: 12px;
		border-bottom-right-radius: 12px;
		z-index: 3;
	}

	/* Status bar for phones with notch */
	.status-bar {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 20px; /* Same as notch height */
		background-color: rgb(173, 173, 173);
		z-index: 2;
	}

	/* Content area with optional notch compensation */
	.device-content {
		width: 100%;
		height: 100%;
		overflow: auto;
		position: relative;
		z-index: 1;
	}

	/* Add padding to top when device has notch to compensate for status bar */
	.device-content.has-notch {
		padding-top: 20px; /* Same as notch height */
	}
</style>
