<script lang="ts">
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { FloppyDisk, TipJar } from 'phosphor-svelte';

	interface Props {
		refresh: () => void;
		profileData: any;
	}

	let { refresh, profileData = $bindable() }: Props = $props();

	// Initialize local state from profile data
	let enableTipping = $state(profileData?.tipsEnabled ?? true);
	let tipMeText = $state(profileData?.tipMeText ?? 'Tip me');
	let tipThanksText = $state(profileData?.tipThanksText ?? 'Thanks for supporting me! 💝');
	let saving = $state(false);

	// Debounce timer for auto-save
	let saveTimeout: NodeJS.Timeout | null = null;

	let customMessage = $state('Thanks for supporting me! 💝');

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
			refresh();
		}
	}
</script>

<div class="space-y-8 p-12">
	<!-- Header -->
	<div class="text-center">
		<h2 class="mb-2 text-lg font-bold text-foreground">Set Tipping Up</h2>
	</div>

	<!-- Enable Tipping Toggle -->
	<div class="flex items-center justify-between space-x-2 border-b border-border pb-4">
		<div class="flex flex-row items-center gap-2">
			<Switch id="tipping" bind:checked={enableTipping} />
			<Label for="tipping" class="whitespace-nowrap">
				Tipping {enableTipping ? 'Enabled' : 'Disabled'}
			</Label>
		</div>
	</div>

	{#if enableTipping}
		<!-- Tip Button Text Customization -->
		<div class="space-y-4">
			<div class="grid gap-4">
				<div class="flex w-full flex-col gap-1.5">
					<Label for="tipMeText">Tip Button Text</Label>
					<Input
						bind:value={tipMeText}
						disabled={saving}
						type="text"
						id="tipMeText"
						placeholder="Tip me"
						class="w-full rounded-2xl"
					/>
					<p class="text-sm text-muted-foreground">
						{saving ? 'Saving...' : ' '}
					</p>
				</div>
			</div>
		</div>

		<!-- Custom Thank You Message -->
		<div class="space-y-4">
			<div class="grid w-full gap-1.5">
				<Label for="customMessage">Thank You Message</Label>
				<Textarea
					bind:value={customMessage}
					placeholder="Thank you so much for your support! It means the world to me..."
					rows={3}
					maxlength={200}
					class="rounded-2xl"
					disabled={saving}
				/>
				<p class="text-sm text-muted-foreground">
					{saving ? 'Saving...' : `${customMessage?.length || 0}/200`}
				</p>
			</div>
		</div>
	{:else}
		<!-- Disabled State -->
		<div
			class="flex flex-col items-center justify-center rounded-lg border-border bg-muted/50 p-8 text-center"
		>
			<span class="mb-2 text-lg font-bold text-foreground">
				<TipJar size={72} weight="duotone" />
			</span>
			<h3 class="mb-2 text-lg font-bold text-foreground">Tipping Disabled</h3>
			<p class="text-sm text-muted-foreground">Enable tipping to edit your tipping settings</p>
		</div>
	{/if}

	<footer class="border-t border-primary py-2">
		<!-- Loading indicator -->

		<div class="group relative flex w-full items-center justify-center rounded-2xl">
			<button
				class="z-20 inline-flex w-full flex-row items-center justify-center rounded-2xl bg-background p-1
					py-4 backdrop-blur-lg transition-all duration-300 ease-in-out
			"
				onclick={saveProfile}
			>
				<span class=" flex items-center justify-center gap-4">
					{#if saving}
						Saving Changes ...
					{:else}
						Save Changes
					{/if}

					<FloppyDisk size={24} weight="duotone" class="aspect-square text-primary" />
				</span>
			</button>

			<span
				class="absolute -bottom-[2px] -right-[2px]
		rounded-2xl opacity-100
		transition-all duration-300 ease-in-out"
				style="background: #333;
		width: calc(100%);
		height: calc(100%);"
			>
			</span>
			<span
				class="absolute -left-[1px] -top-[1px] rounded-[17px] opacity-100"
				style="background: #333;
		width: calc(100% + 2px);
		height: calc(100% + 2px);"
			>
			</span>
		</div>
	</footer>
</div>
