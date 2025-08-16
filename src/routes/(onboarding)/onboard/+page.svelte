<script>
	import Logo from '$lib/components/assets/Logo.svelte';
	import Onboarding from './Onboarding.svelte';

	let { data } = $props();
	
	// Need to keep a local state and sync it every now and then with the ui 

	let profileData = $state(data.profile);

	async function onRefresh() {
		// Refetch and reset data.profile.profile
		const profile = await fetch('/api/user/profile');
		let newProfileData = await profile.json();

		profileData = JSON.parse(JSON.stringify(newProfileData.profile));


		console.log('Refreshing profile data', profileData);
	}
</script>

<div
	class="landing-page container mx-auto flex h-screen w-screen flex-col items-start justify-start gap-2 px-2 pt-8"
>
	<div class="flex w-full flex-col items-baseline justify-between gap-2 px-8 lg:flex-row">
		<Logo size="sm" />
		<small class="hidden text-xs lg:block">
			Welcome to jami.bio , we have reserved the username <span class="font-bold">{'username'}</span
			> for you. lets get your page started
		</small>
	</div>

	<div
		class="
		flex max-h-[calc(95vh-100px)] min-h-[calc(95vh-100px)]
		w-full flex-col items-start justify-start gap-4 rounded-3xl border border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
	>
		<Onboarding {data} {onRefresh} {profileData} />
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
