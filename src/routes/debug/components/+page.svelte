<script lang="ts">
	import Logo from '$lib/components/assets/Logo.svelte';
	// import BrandButton from './components/BrandButton.svelte';
	// import BrandInput from './components/BrandInput.svelte';
	// import BrandTextarea from './components/BrandTextarea.svelte';
	// import BrandToggle from './components/BrandToggle.svelte';
	// import BrandCheckbox from './components/BrandCheckbox.svelte';
	// import BrandInfoCard from './components/BrandInfoCard.svelte';

	import { HandCoins } from 'phosphor-svelte';

	let inputValue = $state('');
	let textareaValue = $state('');
	
	let toggleValue = $state(false);
	let checkboxValue = $state(false);
	let disabledToggle = $state(true);
	let disabledCheckbox = $state(false);
</script>

<!-- <div
	class="landing-page container mx-auto flex h-screen w-screen flex-col items-center justify-center gap-32 border-black md:flex-row"
>
	<div
		class="landing-page container mx-auto flex h-screen w-screen flex-col items-start justify-start gap-2 px-2 pt-8"
	>
		<div class="flex w-full flex-col items-start justify-between gap-2">
			<Logo size="sm" />
		</div>

		<div
			class="flex h-[80vh] overflow-y-scroll w-full flex-col items-start justify-start gap-4 rounded-3xl border border-primary bg-background p-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
		>
			<h2 class="text-sm font-bold">Buttons</h2>

			<div class="flex flex-wrap items-start gap-4">
				<button
					class="
				relative z-20 flex flex-row items-center justify-center gap-2
				
				rounded-2xl border border-black px-4
				
				py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300
				
				ease-in-out
				hover:bg-primary/5
				hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]
				active:shadow-[2px_2px_0px_0px_#F58823]
				
				"
				>
					<HandCoins />
					Tip Me
				</button>

				<BrandButton onclick={() => console.log('Brand button clicked!')}>
					<HandCoins />
					Tip Me
				</BrandButton>

				<BrandButton variant="destructive" onclick={() => console.log('Brand button clicked!')}>
					<HandCoins />
					Tip Me
				</BrandButton>

				<BrandButton disabled onclick={() => console.log('Brand button clicked!')}>
					<HandCoins />
				</BrandButton>

				<BrandButton variant="icon" onclick={() => console.log('Icon button clicked!')}>
					<HandCoins />
				</BrandButton>
			</div>

			<h2 class="text-sm font-bold">Input</h2>

			<div class="flex flex-wrap items-start gap-4">
				<BrandInput bind:value={inputValue} placeholder="Enter some text..." />

				<BrandInput variant="destructive" placeholder="Destructive input..." />

				<BrandInput disabled placeholder="Disabled input..." />
			</div>

			<h2 class="text-sm font-bold">Textarea</h2>

			<div class="flex flex-wrap items-start gap-4">
				<BrandTextarea bind:value={textareaValue} placeholder="Enter your message..." />

				<BrandTextarea variant="destructive" placeholder="Destructive textarea..." />

				<BrandTextarea disabled placeholder="Disabled textarea..." />
			</div>

			<h2 class="text-sm font-bold">Toggle</h2>

			<div class="flex flex-wrap items-start gap-4">
				<BrandToggle bind:checked={toggleValue} />

				<BrandToggle variant="destructive" />

				<BrandToggle bind:checked={disabledToggle} disabled />
			</div>

			<h2 class="text-sm font-bold">Checkbox</h2>

			<div class="flex flex-wrap items-start gap-4">
				<div class="flex items-center gap-2">
					<BrandCheckbox bind:checked={checkboxValue} />
					<label class="cursor-pointer text-sm" onclick={() => (checkboxValue = !checkboxValue)}>
						Check me
					</label>
				</div>

				<div class="flex items-center gap-2">
					<BrandCheckbox variant="destructive" />
					<label class="cursor-pointer text-sm">
						Destructive checkbox
					</label>
				</div>

				<div class="flex items-center gap-2">
					<BrandCheckbox bind:checked={disabledCheckbox} disabled />
					<label class="cursor-not-allowed text-sm opacity-50"> Disabled checkbox </label>
				</div>
			</div>

			<h2 class="text-sm font-bold">Info Cards</h2>

			<div class="flex flex-col gap-4 w-full max-w-md">
				<BrandInfoCard
					variant="success"
					title="Congratulations!"
					message="Your OS has been updated to the latest version."
					onDismiss={() => console.log('Success card dismissed')}
				/>

				<BrandInfoCard
					variant="info"
					title="Did you know?"
					message="You can switch between artboards using ⌘ + T"
					onDismiss={() => console.log('Info card dismissed')}
				/>

				<BrandInfoCard
					variant="warning"
					title="Warning"
					message="Your password strength is low."
					onDismiss={() => console.log('Warning card dismissed')}
				/>

				<BrandInfoCard
					variant="error"
					title="Something went wrong!"
					message="The program has turned off unexpectedly. Send report"
					onDismiss={() => console.log('Error card dismissed')}
				/>

				<BrandInfoCard
					variant="info"
					title="Non-dismissible"
					message="This card cannot be dismissed."
					dismissible={false}
				/>
			</div>
		</div>
	</div>
</div> -->

<style lang="postcss">
	:global(body:has(.landing-page)) {
		@apply min-h-screen;
		position: relative;
	}

	:global(body:has(.landing-page)::before) {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: url('/w.png');
		opacity: 0;
		animation: fadeInBackground 0.5s ease-in-out 0.3s forwards;
		z-index: -1;
	}

	:global(.dark body:has(.landing-page)::before) {
		background-image: url('/g.png');
	}

	@keyframes fadeInBackground {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
