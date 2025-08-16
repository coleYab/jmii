<script lang="ts">
	import { authClient } from '$lib/auth-client';

	import { quintInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';

	const session = authClient.useSession();

	$inspect($session.data);
</script>

<div
	class="flex h-screen w-screen flex-col items-center justify-center"
	transition:fade={{ duration: 100, easing: quintInOut }}
>
	<h2
		class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-light text-sidebar-foreground"
	>
		Loading indefinitely...
	</h2>
</div>
