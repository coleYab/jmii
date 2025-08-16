<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Upload, Image as ImageIcon, X, CloudArrowUp } from 'phosphor-svelte';
	import { createUploadThing } from '$lib/utils/uploadthing';
	import Cropper, { type CropArea } from 'svelte-easy-crop';

	interface Props {
		currentImage?: string | null;
		disabled?: boolean;
		label?: string;
		id?: string;
	}

	let { currentImage = null, disabled = false, label = 'Banner Image', id = 'banner-image' }: Props = $props();

	const dispatch = createEventDispatcher<{
		upload: { url: string };
		start: void;
		error: { error: string };
	}>();

	// Local state
	let bannerPhoto: File | null = $state(null);
	let dragActive = $state(false);
	let uploading = $state(false);

	// Cropping state
	let showCropModal = $state(false);
	let cropImageSrc = $state('');
	let crop = $state({ x: 0, y: 0 });
	let zoom = $state(1);
	let croppedAreaPixels: CropArea | null = $state(null);
	let originalFile: File | null = $state(null);

	// Create UploadThing instance
	const { startUpload } = createUploadThing('mediaUploader', {
		onClientUploadComplete: (res) => {
			if (res?.[0]?.url) {
				uploading = false;
				bannerPhoto = null;
				dispatch('upload', { url: res[0].url });
			}
		},
		onUploadError: (error) => {
			uploading = false;
			dispatch('error', { error: error.message });
		}
	});

	// Initialize cropping modal
	function initializeCrop(file: File) {
		originalFile = file;
		cropImageSrc = URL.createObjectURL(file);
		crop = { x: 0, y: 0 };
		zoom = 1;
		croppedAreaPixels = null;
		showCropModal = true;
	}

	// Create cropped image blob
	async function getCroppedImage(): Promise<File | null> {
		if (!croppedAreaPixels || !originalFile) return null;

		return new Promise((resolve) => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			const image = new Image();

			image.onload = () => {
				const { x, y, width, height } = croppedAreaPixels as unknown as CropArea;

				canvas.width = width;
				canvas.height = height;

				ctx?.drawImage(image, x, y, width, height, 0, 0, width, height);

				canvas.toBlob((blob) => {
					if (blob) {
						const croppedFile = new File([blob], originalFile?.name ?? 'banner.jpg', {
							type: originalFile?.type ?? 'image/jpeg',
							lastModified: Date.now()
						});
						resolve(croppedFile);
					} else {
						resolve(null);
					}
				}, originalFile?.type ?? 'image/jpeg');
			};

			image.src = cropImageSrc;
		});
	}

	// Confirm crop and upload
	async function confirmCrop() {
		const croppedFile = await getCroppedImage();
		if (!croppedFile) return;

		showCropModal = false;
		bannerPhoto = croppedFile;
		uploading = true;
		dispatch('start');
		startUpload([croppedFile]);

		// Clean up
		URL.revokeObjectURL(cropImageSrc);
		cropImageSrc = '';
		originalFile = null;
	}

	// Cancel crop
	function cancelCrop() {
		showCropModal = false;
		URL.revokeObjectURL(cropImageSrc);
		cropImageSrc = '';
		originalFile = null;
	}

	// File handlers
	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			if (file.type.startsWith('image/')) {
				initializeCrop(file);
			}
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragActive = false;

		if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
			const file = event.dataTransfer.files[0];
			if (file.type.startsWith('image/')) {
				initializeCrop(file);
			}
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragActive = true;
	}

	function handleDragLeave() {
		dragActive = false;
	}

	// Get preview URL for images
	function getPreviewUrl(): string | null {
		if (bannerPhoto) {
			return URL.createObjectURL(bannerPhoto);
		}
		return currentImage;
	}

	function triggerFileInput() {
		const input = document.querySelector(`#${id}-input`) as HTMLInputElement;
		input?.click();
	}
</script>

<div class="grid w-full gap-3">
	<Label for={id}>{label}</Label>
	<div class="flex w-full flex-row items-center justify-between gap-3">
		<!-- Banner Image Preview/Dropzone -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative flex w-1/2 items-center justify-center rounded-xl border-2 border-dashed border-primary/30 p-1 transition-colors
			{dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
			{uploading ? 'opacity-50' : ''}"
			ondrop={handleDrop}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
		>
			{#if uploading}
				<div class="flex flex-col items-center gap-2">
					<div
						class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
					></div>
					<span class="text-xs text-muted-foreground">Uploading...</span>
				</div>
			{:else if getPreviewUrl()}
				<img
					src={getPreviewUrl()}
					alt="Banner preview"
					class="aspect-[3/2] h-full w-full rounded-xl object-cover"
				/>
				<div
					class="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity hover:opacity-100"
				>
					<ImageIcon size={24} weight="bold" class="text-white" />
				</div>
			{:else}
				<div class="flex flex-col items-center gap-2 text-muted-foreground">
					<ImageIcon size={32} weight="duotone" />
					<span class="text-center text-xs">Drop banner image or click to upload</span>
				</div>
			{/if}

			<input
				id="{id}-input"
				type="file"
				accept="image/*"
				onchange={handleFileSelect}
				class="absolute inset-0 cursor-pointer opacity-0"
				{disabled}
			/>
		</div>

		<!-- Banner Image Upload Button -->
		<Button
			variant="outline"
			size="sm"
			onclick={triggerFileInput}
			{disabled}
			class="mx-auto w-fit"
		>
			<Upload size={16} class="mr-2" />
			{currentImage ? 'Change Banner Image' : 'Choose Banner Image'}
		</Button>
	</div>
</div>

<!-- Crop Modal -->
{#if showCropModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
		<div class="mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-background p-6">
			<!-- Modal Header -->
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold">Crop Banner Image</h3>
				<Button variant="ghost" size="sm" onclick={cancelCrop}>
					<X size={20} />
				</Button>
			</div>

			<!-- Cropper Container -->
			<div class="relative mb-4 min-h-[300px] flex-1">
				<Cropper
					image={cropImageSrc}
					bind:crop
					bind:zoom
					aspect={3 / 1}
					cropShape="rect"
					showGrid={true}
					oncropcomplete={(e) => {
						croppedAreaPixels = e.pixels as unknown as CropArea;
					}}
				/>
			</div>

			<!-- Zoom Control -->
			<div class="mb-4">
				<Label for="zoom-slider" class="mb-2 block text-sm font-medium">Zoom</Label>
				<input
					id="zoom-slider"
					type="range"
					min="1"
					max="3"
					step="0.1"
					bind:value={zoom}
					class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted"
				/>
			</div>

			<!-- Modal Actions -->
			<div class="flex justify-end gap-3">
				<Button variant="outline" onclick={cancelCrop}>Cancel</Button>
				<Button onclick={confirmCrop} disabled={!croppedAreaPixels}>
					<CloudArrowUp size={16} class="mr-2" weight="duotone" />
					Crop & Upload
				</Button>
			</div>
		</div>
	</div>
{/if} 