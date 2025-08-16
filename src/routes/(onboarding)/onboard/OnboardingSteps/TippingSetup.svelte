<script lang="ts">
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';

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

	interface PaymentMethod {
		id: string;
		name: string;
		icon: string;
		description: string;
		enabled: boolean;
		accountInfo: string;
	}

	// Initialize local state from profile data
	let enableTipping = $state(profileData?.tipsEnabled ?? true);
	let tipMeText = $state(profileData?.tipMeText ?? 'Tip me');
	let tipThanksText = $state(profileData?.tipThanksText ?? 'Thanks for supporting me! 💝');
	let saving = $state(false);

	// Debounce timer for auto-save
	let saveTimeout: NodeJS.Timeout | null = null;

	let customMessage = $state('Thanks for supporting me! 💝');

	// Debounced save function
	function debouncedSave() {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}
		saveTimeout = setTimeout(saveProfile, 1000);
	}

	// Save profile data to API
	async function saveProfile() {
		if (saving) return;

		saving = true;
		try {
			const updateData = {
				tipsEnabled: enableTipping,
				tipMeText: tipMeText.trim(),
				tipThanksText: tipThanksText.trim()
			};

			const response = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updateData)
			});

			if (response.ok) {
				console.log('Tipping settings updated successfully');
			} else {
				const errorData = await response.json();
				console.error('Failed to update tipping settings:', errorData.error);
			}
		} catch (error) {
			console.error('Error updating tipping settings:', error);
		} finally {
			saving = false;
			onRefresh();
		}
	}

	// Handle tipping toggle change
	function handleTippingToggle() {
		debouncedSave();
	}

	// Handle text input changes
	function handleTextChange() {
		debouncedSave();
	}
</script>

<div class="space-y-6 sm:space-y-8">
	<!-- Header -->
	<div class="text-center">
		<h2 class="mb-2 text-lg font-bold text-foreground sm:text-xl">Set Tipping Up</h2>
		<p class="text-sm text-muted-foreground sm:text-base">
			Enable tipping and payments to monetize your content
		</p>
	</div>

	<!-- Enable Tipping Toggle -->
	<div class="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between sm:space-x-2">
		<div class="flex flex-col gap-1 sm:gap-2">
			<h2 class="text-base font-bold text-foreground sm:text-lg">Enable Tipping</h2>
			<p class="text-xs text-muted-foreground sm:text-sm">Allow your audience to support you financially</p>
		</div>
		<div class="flex items-center space-x-2">
			<Switch id="tipping" bind:checked={enableTipping} onCheckedChange={handleTippingToggle} />
			<Label for="tipping" class="whitespace-nowrap text-xs sm:text-sm">
				Tipping {enableTipping ? 'Enabled' : 'Disabled'}
			</Label>
		</div>
	</div>

	{#if enableTipping}
		<!-- Tip Button Text Customization -->
		<div class="space-y-3 sm:space-y-4">
			<div class="grid gap-3 sm:gap-4">
				<div class="flex w-full flex-col gap-1">
					<Label for="tipMeText" class="text-sm">Tip Button Text</Label>
					<Input
						bind:value={tipMeText}
						oninput={handleTextChange}
						disabled={saving}
						type="text"
						id="tipMeText"
						placeholder="Tip me"
						class="w-full rounded-2xl text-sm"
					/>
					<p class="text-xs text-muted-foreground sm:text-sm">
						{saving ? 'Saving...' : ' '}
					</p>
				</div>
			</div>
		</div>

		<!-- Custom Thank You Message -->
		<div class="space-y-3 sm:space-y-4">
			<div class="grid w-full gap-1">
				<Label for="customMessage" class="text-sm">Thank You Message</Label>
				<Textarea
					bind:value={customMessage}
					oninput={handleTextChange}
					placeholder="Thank you so much for your support! It means the world to me..."
					rows={3}
					maxlength={200}
					class="rounded-2xl text-sm"
					disabled={saving}
				/>
				<p class="text-xs text-muted-foreground sm:text-sm">
					{saving ? 'Saving...' : `${customMessage?.length || 0}/200`}
				</p>
			</div>
		</div>
	{:else}
		<!-- Disabled State -->
		<div class="rounded-lg border-2 border-dashed border-border bg-muted/50 p-6 text-center sm:p-8">
			<div class="mb-3 text-4xl sm:mb-4 sm:text-6xl">💸</div>
			<h3 class="mb-2 text-base font-bold text-foreground sm:text-lg">Monetization Disabled</h3>
			<p class="text-sm text-muted-foreground sm:text-base">
				You can always enable this later in your settings.
			</p>
		</div>
	{/if}

	<!-- Loading indicator -->
	{#if saving}
		<div class="flex items-center justify-center gap-2 text-xs text-muted-foreground sm:text-sm">
			<div
				class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
			></div>
			Saving changes...
		</div>
	{/if}
</div>
