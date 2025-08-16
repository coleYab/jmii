<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';

	import Logo from '$lib/components/assets/Logo.svelte';

	import { DoorOpen, ShareNetwork, GridFour, Slideshow,HandCoins } from 'phosphor-svelte';


	import LinkCheckForm from '$lib/components/landing/LinkCheckForm.svelte';

	let { data } = $props();
</script>

<div
	class="landing-page container mx-auto flex h-screen w-screen flex-col items-center justify-center gap-32 border-black md:flex-row"
>
	<div class="flex flex-col items-center justify-center gap-4">
		<div
			class=" relative flex aspect-square flex-col items-center justify-center rounded-lg border-primary/50 bg-primary p-4 text-primary-foreground"
		>
			<Logo size="sm" fill="currentColor" />
			<p class="absolute bottom-2 right-2 text-sm">Jami.bio</p>
			<p class="text-center text-sm">One link to rule them all</p>
		</div>

		<div class="flex flex-row flex-wrap items-center justify-center gap-2 text-pretty">
			<span class="w-full text-center text-xl font-extralight"> The one stop destination to </span>

			<span class="relative flex flex-row items-center gap-4 font-handwriting text-xl">
				<span
					class="origin-center -rotate-12 rounded-sm border-2 border-primary bg-primary-foreground"
				>
					<ShareNetwork size={24} weight="duotone" />
				</span>

				Share,
			</span>
			<span class="relative flex flex-row items-center gap-4 font-handwriting text-xl">
				<span
					class="origin-center rotate-[23deg] rounded-sm border-2 border-primary bg-primary-foreground"
				>
					<Slideshow size={24} weight="duotone" />
				</span> Showcase,
			</span>
			<span class="text-center text-xl font-extralight"> and </span>

			<span class="relative flex flex-row items-center gap-4">
				<span
					class="origin-center rotate-[12deg] rounded-sm border-2 border-primary bg-primary-foreground"
				>
					<HandCoins size={24} weight="duotone" />
				</span>
				<span
					class="bg-gradient-to-r from-[#DF337C] to-[#5c4878]
							bg-clip-text pr-2 font-handwriting text-xl text-transparent dark:brightness-150"
				>
					Monetize
				</span>

				<!-- <span
						class="text-md absolute -bottom-6 right-2 rounded-md bg-primary-foreground bg-gradient-to-r from-cyan-400 to-emerald-500 
						bg-clip-text pb-2 text-right font-handwriting text-transparent brightness-50 contrast-50 dark:brightness-150
				"
					>
						via arifpay
					</span> -->
			</span>
		</div>
		<LinkCheckForm />

		<div class="mt-6 flex flex-col items-center justify-center gap-1">
			<div class="flex flex-row items-center justify-center gap-2">
				{#if data.user?.id}
					<Button
						onclick={() => goto('/builder')}
						variant="default"
						size="lg"
						class="text-md h-auto px-12 py-4 font-normal"
					>
						<GridFour size={24} />
						Start Creating
					</Button>
				{:else}
					<Button
						onclick={() => goto('/login')}
						variant="default"
						size="lg"
						class="text-md h-auto px-12 py-4 font-normal"
					>
						<DoorOpen size={24} />
						Get started
					</Button>
				{/if}
			</div>
			<div class=" text-sm">
				<a href="/PP" class="text-primary hover:underline">Privacy Policy</a> |
				<a href="/TOS" class="text-primary hover:underline">Terms of Service</a>
			</div>
		</div>
	</div>
</div>

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
