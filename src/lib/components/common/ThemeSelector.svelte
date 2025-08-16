<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { AppWindow, MoonStars, SunHorizon } from 'phosphor-svelte';

	let isDarkMode = $state(false);
	let systemPeek = $state(false);

	function toggleDarkMode() {
		isDarkMode = !isDarkMode;
		document.documentElement.classList.toggle('dark', isDarkMode);
		document.documentElement.classList.toggle('light', !isDarkMode);
		localStorage.setItem('darkMode', isDarkMode ? 'dark' : 'light');
	}

	function setSystemTheme() {
		// Whenever the user explicitly chooses to respect the OS preference
		localStorage.removeItem('theme');
		document.documentElement.classList.remove('dark');
		if (
			localStorage.theme === 'dark' ||
			(!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
		) {
			document.documentElement.classList.add('dark');
			isDarkMode = true;
		} else {
			document.documentElement.classList.remove('dark');
			isDarkMode = false;
		}
	}

	onMount(() => {
		const savedDarkMode = localStorage.getItem('darkMode');

		isDarkMode = savedDarkMode === 'dark';
		document.documentElement.classList.toggle('dark', isDarkMode);
		document.documentElement.classList.toggle('light', !isDarkMode);
	});
</script>

{#if browser}
	<!-- Container -->
	<div
		class="	bg-background hidden
		border-light-400 dark:border-dark-600 fixed right-2
		top-2 z-50 flex-row items-center
		justify-center gap-2 rounded-sm border px-2 py-1 text-sm
		transition-all duration-300
		"
	>
		<!-- Toggle Button -->
		<button
			onclick={() => {
				if (systemPeek) return;
				toggleDarkMode();
			}}
		>
			{#if isDarkMode}
				<MoonStars size={18} weight="duotone" />
			{:else}
				<SunHorizon size={18} weight="duotone" />
			{/if}
		</button>
		<!-- System Button -->
		<button
			onmouseover={() => {
				systemPeek = true;
			}}
			onfocus={() => {
				systemPeek = true;
			}}
			onmouseout={() => {
				systemPeek = false;
			}}
			onblur={() => {
				systemPeek = false;
			}}
			onclick={setSystemTheme}
		>
			<AppWindow size={18} weight="duotone" />
		</button>
	</div>
{/if}
