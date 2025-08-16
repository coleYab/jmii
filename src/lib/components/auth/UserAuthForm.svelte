<script lang="ts">
	import Signin from "./_components/Signin.svelte";
	import Signup from "./_components/Signup.svelte";


	let className: string | undefined | null = undefined;
	export { className as class };

	let { mode } = $props();
</script>

{#if mode === 'signin'}
	<Signin />
{:else}
	<Signup />
{/if}