<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';

	import Logo from '$lib/components/assets/Logo.svelte';

	import { page } from '$app/state';
</script>

<div
	class="error-page container mx-auto flex h-screen w-screen flex-col items-center justify-center gap-8 px-4 sm:gap-12 md:gap-16 lg:flex-row"
>
	<div class="flex flex-col items-center justify-center gap-4 sm:gap-6">
		<div
			class="relative flex aspect-square flex-col items-center justify-center rounded-xl border-primary/50 bg-primary p-4 text-primary-foreground shadow-lg sm:p-6"
		>
			<Logo size="sm" fill="currentColor" />
			<p class="absolute bottom-2 right-2 text-xs font-medium sm:bottom-3 sm:right-3 sm:text-sm">Jami.bio</p>
			<p class="text-center text-xs sm:text-sm">One link to rule them all</p>
		</div>

		<div class="text-center">
			<div class="text-3xl font-bold text-primary mb-2 sm:text-4xl md:text-5xl">
				{page.status}
			</div>
			<div class="text-lg text-muted-foreground max-w-sm sm:text-xl sm:max-w-md md:max-w-lg">
				{page.error?.message || 'Something went wrong. Don\'t worry, it\'s not you - it\'s us!'}
			</div>
		</div>

		<div class="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:gap-4">
			<div class="text-center">
				<p class="text-sm text-muted-foreground mb-3 max-w-xs sm:text-base sm:mb-4 sm:max-w-sm md:max-w-md">
					Let's get you back on track. Head to the home page to continue your journey.
				</p>
				<div class="flex flex-row items-center justify-center gap-2">
					<Button
						onclick={() => goto('/')}
						variant="default"
						size="lg"
						class="text-sm h-auto px-6 py-2 font-medium shadow-md hover:shadow-lg transition-all duration-200 sm:text-base sm:px-8 sm:py-3"
					>
						Return to Home Page
					</Button>
				</div>
			</div>
			<div class="text-xs text-muted-foreground sm:text-sm">
				<a href="/PP" class="text-primary hover:underline transition-colors">Privacy Policy</a> |
				<a href="/TOS" class="text-primary hover:underline transition-colors">Terms of Service</a>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	:global(body:has(.error-page)) {
		@apply min-h-screen;
		position: relative;
	}

	:global(body:has(.error-page)::before) {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: url('/w.png');
		background-size: cover;
		background-position: center;
		opacity: 0;
		animation: fadeInBackground 0.8s ease-in-out 0.3s forwards;
		z-index: -1;
	}

	:global(.dark body:has(.error-page)::before) {
		background-image: url('/g.png');
	}

	@keyframes fadeInBackground {
		from {
			opacity: 0;
		}
		to {
			opacity: 0.1;
		}
	}

	/* Mobile-first responsive adjustments */
	@media (max-width: 640px) {
		:global(body:has(.error-page)) {
			padding: 1rem;
		}
	}

	@media (min-width: 768px) {
		:global(body:has(.error-page)) {
			padding: 2rem;
		}
	}
</style>
