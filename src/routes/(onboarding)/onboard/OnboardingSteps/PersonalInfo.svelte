<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Upload, Camera, Image as ImageIcon, X, Check, CloudArrowUp } from 'phosphor-svelte';
	import { createUploadThing } from '$lib/utils/uploadthing';
	import Cropper, { type CropArea } from 'svelte-easy-crop';

	interface Props {
		onNext: () => void;
		onPrev: () => void;
		onSkip: () => void;
		onRefresh: () => void;
		isFirst: boolean;
		isLast: boolean;
		data: any;
		profileData: any;
	}

	let { onNext, onPrev, onSkip, onRefresh, isFirst, isLast, data, profileData }: Props = $props();

	// Local state
	let profilePhoto: File | null = $state(null);
	let bannerPhoto: File | null = $state(null);
	let profileDragActive = $state(false);
	let bannerDragActive = $state(false);
	let loading = $state(false);
	let saving = $state(false);
	let uploadingProfileImage = $state(false);
	let uploadingBannerImage = $state(false);

	// Cropping state
	let showCropModal = $state(false);
	let cropImageSrc = $state('');
	let cropType: 'profile' | 'banner' = $state('profile');
	let crop = $state({ x: 0, y: 0 });
	let zoom = $state(1);
	let croppedAreaPixels: CropArea | null = $state(null);
	let originalFile: File | null = $state(null);

	// Debounce timer for auto-save
	let saveTimeout: NodeJS.Timeout | null = null;

	// Create UploadThing instances
	const { startUpload: startProfileUpload } = createUploadThing('mediaUploader', {
		onClientUploadComplete: (res) => {
			if (res?.[0]?.url) {
				handleImageUploadSuccess(res[0].url, 'profile');
			}
		},
		onUploadError: (error) => {
			uploadingProfileImage = false;
			console.error('Profile upload error:', error.message);
		}
	});

	const { startUpload: startBannerUpload } = createUploadThing('mediaUploader', {
		onClientUploadComplete: (res) => {
			if (res?.[0]?.url) {
				handleImageUploadSuccess(res[0].url, 'banner');
			}
		},
		onUploadError: (error) => {
			uploadingBannerImage = false;
			console.error('Banner upload error:', error.message);
		}
	});

	// Debounced save function
	function debouncedSave() {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}
		saveTimeout = setTimeout(saveProfile, 1000);
	}

	// Save profile data to API
	async function saveProfile() {
		if (saving || !profileData.displayName?.trim()) return;

		saving = true;
		try {
			const updateData = {
				displayName: profileData.displayName.trim(),
				bio: profileData.bio?.trim() || ''
			};

			const response = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updateData)
			});

			if (response.ok) {
				console.log('Profile updated successfully');
			} else {
				const errorData = await response.json();
				console.error('Failed to update profile:', errorData.error);
			}
		} catch (error) {
			console.error('Error updating profile:', error);
		} finally {
			saving = false;
			onRefresh();
		}
	}

	// Handle image upload success
	async function handleImageUploadSuccess(url: string, type: 'profile' | 'banner') {
		try {
			const updateData = type === 'profile' ? { image: url } : { coverimage: url };
			const response = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updateData)
			});

			if (response.ok) {
				console.log(`${type === 'profile' ? 'Profile' : 'Banner'} image updated successfully`);
				// Update local state with new persisted image URL
				if (type === 'profile') {
					profileData.image = url;
					profilePhoto = null;
					uploadingProfileImage = false;
				} else {
					profileData.coverimage = url;
					bannerPhoto = null;
					uploadingBannerImage = false;
				}
				onRefresh();
			} else {
				console.error(`Failed to update ${type === 'profile' ? 'profile' : 'banner'} image`);
				if (type === 'profile') {
					uploadingProfileImage = false;
				} else {
					uploadingBannerImage = false;
				}
			}
		} catch (error) {
			console.error('Error updating profile:', error);
			if (type === 'profile') {
				uploadingProfileImage = false;
			} else {
				uploadingBannerImage = false;
			}
		}
	}

	// Initialize cropping modal
	function initializeCrop(file: File, type: 'profile' | 'banner') {
		originalFile = file;
		cropType = type;
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
						const croppedFile = new File([blob], originalFile?.name ?? 'mat', {
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

		if (cropType === 'profile') {
			profilePhoto = croppedFile;
			uploadingProfileImage = true;
			startProfileUpload([croppedFile]);
		} else {
			bannerPhoto = croppedFile;
			uploadingBannerImage = true;
			startBannerUpload([croppedFile]);
		}

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

	// Profile image handlers
	function handleProfileFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			if (file.type.startsWith('image/')) {
				initializeCrop(file, 'profile');
			}
		}
	}

	function handleProfileDrop(event: DragEvent) {
		event.preventDefault();
		profileDragActive = false;

		if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
			const file = event.dataTransfer.files[0];
			if (file.type.startsWith('image/')) {
				initializeCrop(file, 'profile');
			}
		}
	}

	function handleProfileDragOver(event: DragEvent) {
		event.preventDefault();
		profileDragActive = true;
	}

	function handleProfileDragLeave() {
		profileDragActive = false;
	}

	// Banner image handlers
	function handleBannerFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			if (file.type.startsWith('image/')) {
				initializeCrop(file, 'banner');
			}
		}
	}

	function handleBannerDrop(event: DragEvent) {
		event.preventDefault();
		bannerDragActive = false;

		if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
			const file = event.dataTransfer.files[0];
			if (file.type.startsWith('image/')) {
				initializeCrop(file, 'banner');
			}
		}
	}

	function handleBannerDragOver(event: DragEvent) {
		event.preventDefault();
		bannerDragActive = true;
	}

	function handleBannerDragLeave() {
		bannerDragActive = false;
	}

	// Get preview URL for images
	function getPreviewUrl(file: File | null, existingUrl: string | null): string | null {
		if (file) {
			return URL.createObjectURL(file);
		}
		return existingUrl;
	}
</script>

<div class="flex flex-col gap-4 px-1 py-2 sm:gap-6">
	{#if loading}
		<div class="flex items-center justify-center py-6 sm:py-8">
			<div
				class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent sm:h-6 sm:w-6"
			></div>
			<span class="ml-2 text-xs text-muted-foreground sm:text-sm">Loading your profile...</span>
		</div>
	{:else}
		<!-- Profile Picture Upload -->
		<div class="grid w-full gap-2 sm:gap-3">
			<Label for="profile-picture" class="text-sm">Profile Picture</Label>
			<div class="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-between">
				<!-- Profile Picture Preview/Dropzone -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-primary/30 p-1 transition-colors sm:h-32 sm:w-32
					{profileDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
					{uploadingProfileImage ? 'opacity-50' : ''}"
					ondrop={handleProfileDrop}
					ondragover={handleProfileDragOver}
					ondragleave={handleProfileDragLeave}
				>
					{#if uploadingProfileImage}
						<div class="flex flex-col items-center gap-1 sm:gap-2">
							<div
								class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent sm:h-6 sm:w-6"
							></div>
							<span class="text-xs text-muted-foreground">Uploading...</span>
						</div>
					{:else if getPreviewUrl(profilePhoto, profileData.image)}
						<img
							src={getPreviewUrl(profilePhoto, profileData.image)}
							alt="Profile preview"
							class="h-full w-full rounded-full object-cover"
						/>
						<div
							class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity hover:opacity-100"
						>
							<Camera size={20} weight="bold" class="text-white sm:size-6" />
						</div>
					{:else}
						<div class="flex flex-col items-center gap-1 text-muted-foreground sm:gap-2">
							<Camera size={24} weight="duotone" class="sm:size-8" />
							<span class="text-center text-xs sm:text-sm">Drop image or click</span>
						</div>
					{/if}

					<input
						type="file"
						accept="image/*"
						onchange={handleProfileFileSelect}
						class="absolute inset-0 cursor-pointer opacity-0"
						disabled={uploadingProfileImage}
					/>
				</div>

				<!-- Profile Picture Upload Button -->
				<Button
					variant="outline"
					size="sm"
					onclick={() =>
						(document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
					disabled={uploadingProfileImage}
					class="w-full text-xs sm:mx-auto sm:w-fit sm:text-sm"
				>
					<Upload size={14} class="mr-1 sm:mr-2 sm:size-4" />
					<span class="hidden sm:inline">{profileData.image ? 'Change Profile Picture' : 'Choose Profile Picture'}</span>
					<span class="sm:hidden">{profileData.image ? 'Change' : 'Choose'}</span>
				</Button>
			</div>
		</div>

		<!-- Banner Image Upload -->
		<div class="grid w-full gap-2 sm:gap-3">
			<Label for="banner-image" class="text-sm">Banner Image</Label>
			<div class="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-between">
				<!-- Banner Image Preview/Dropzone -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="relative flex w-full items-center justify-center rounded-xl border-2 border-dashed border-primary/30 p-1 transition-colors sm:w-1/2
					{bannerDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
					{uploadingBannerImage ? 'opacity-50' : ''}"
					ondrop={handleBannerDrop}
					ondragover={handleBannerDragOver}
					ondragleave={handleBannerDragLeave}
				>
					{#if uploadingBannerImage}
						<div class="flex flex-col items-center gap-1 py-8 sm:gap-2">
							<div
								class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent sm:h-6 sm:w-6"
							></div>
							<span class="text-xs text-muted-foreground">Uploading...</span>
						</div>
					{:else if getPreviewUrl(bannerPhoto, profileData.coverimage)}
						<img
							src={getPreviewUrl(bannerPhoto, profileData.coverimage)}
							alt="Banner preview"
							class="aspect-[3/2] h-full w-full rounded-xl object-cover"
						/>
						<div
							class="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity hover:opacity-100"
						>
							<ImageIcon size={20} weight="bold" class="text-white sm:size-6" />
						</div>
					{:else}
						<div class="flex flex-col items-center gap-1 py-8 text-muted-foreground sm:gap-2">
							<ImageIcon size={24} weight="duotone" class="sm:size-8" />
							<span class="text-center text-xs sm:text-sm">Drop banner or click</span>
						</div>
					{/if}

					<input
						type="file"
						accept="image/*"
						onchange={handleBannerFileSelect}
						class="absolute inset-0 cursor-pointer opacity-0"
						disabled={uploadingBannerImage}
					/>
				</div>

				<!-- Banner Image Upload Button -->
				<Button
					variant="outline"
					size="sm"
					onclick={() =>
						(document.querySelectorAll('input[type="file"]')[1] as HTMLInputElement)?.click()}
					disabled={uploadingBannerImage}
					class="w-full text-xs sm:mx-auto sm:w-fit sm:text-sm"
				>
					<Upload size={14} class="mr-1 sm:mr-2 sm:size-4" />
					<span class="hidden sm:inline">{profileData.coverimage ? 'Change Banner Image' : 'Choose Banner Image'}</span>
					<span class="sm:hidden">{profileData.coverimage ? 'Change Banner' : 'Choose Banner'}</span>
				</Button>
			</div>
		</div>

		<!-- Display Name -->
		<div class="flex w-full flex-col gap-1">
			<Label for="display-name" class="text-sm">What should we call you?</Label>
			<Input
				bind:value={profileData.displayName}
				oninput={debouncedSave}
				disabled={saving}
				type="text"
				maxlength={16}
				id="display-name"
				placeholder="Display Name"
				class="w-full rounded-2xl text-sm"
			/>
			<p class="text-xs text-muted-foreground sm:text-sm">
				{saving ? 'Saving...' : ' '}
			</p>
		</div>

		<!-- Bio -->
		<div class="grid w-full gap-1">
			<Label for="bio" class="text-sm">Tell us about yourself (Optional)</Label>
			<Textarea
				bind:value={profileData.bio}
				oninput={debouncedSave}
				placeholder="What makes you unique? What do you do? What are you passionate about?"
				rows={3}
				maxlength={100}
				class="rounded-2xl text-sm"
				disabled={saving}
			/>
			<p class="text-xs text-muted-foreground sm:text-sm">
				{saving ? 'Saving...' : `${profileData.bio?.length || 0}/100`}
			</p>
		</div>
	{/if}
</div>

<!-- Crop Modal -->
{#if showCropModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4">
		<div class="flex max-h-[95vh] w-full max-w-lg flex-col rounded-lg bg-background p-4 sm:max-w-2xl sm:p-6">
			<!-- Modal Header -->
			<div class="mb-3 flex items-center justify-between sm:mb-4">
				<h3 class="text-base font-semibold sm:text-lg">
					Crop {cropType === 'profile' ? 'Profile Picture' : 'Banner Image'}
				</h3>
				<Button variant="ghost" size="sm" onclick={cancelCrop}>
					<X size={18} class="sm:size-5" />
				</Button>
			</div>

			<!-- Cropper Container -->
			<div class="relative mb-3 min-h-[250px] flex-1 sm:mb-4 sm:min-h-[300px]">
				<Cropper
					image={cropImageSrc}
					bind:crop
					bind:zoom
					aspect={cropType === 'profile' ? 1 : 3 / 1}
					cropShape={cropType === 'profile' ? 'round' : 'rect'}
					showGrid={true}
					oncropcomplete={(e) => {
						console.log('Crop complete:', e);
						croppedAreaPixels = e.pixels as unknown as CropArea;
					}}
				/>
			</div>

			<!-- Zoom Control -->
			<div class="mb-3 sm:mb-4">
				<Label for="zoom-slider" class="mb-1 block text-xs font-medium sm:mb-2 sm:text-sm">Zoom</Label>
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
			<div class="flex justify-end gap-2 sm:gap-3">
				<Button variant="outline" size="sm" onclick={cancelCrop} class="text-xs sm:text-sm">Cancel</Button>
				<Button onclick={confirmCrop} disabled={!croppedAreaPixels} size="sm" class="text-xs sm:text-sm">
					<CloudArrowUp size={14} class="mr-1 sm:mr-2 sm:size-4" weight="duotone" />
					Crop & Upload
				</Button>
			</div>
		</div>
	</div>
{/if}
