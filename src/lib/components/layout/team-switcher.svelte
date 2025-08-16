<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Logo from '../assets/Logo.svelte';

	// This should be `Component` after lucide-svelte updates types
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton
			onclick={() => {
				goto('/');
			}}
			size="lg"
			variant="default"
			class="h-auto transition-all duration-300 data-[state=open]:bg-sidebar-primary-foreground  data-[state=open]:text-sidebar-primary  "
		>
			<div
				class="flex aspect-square size-8
				items-center justify-center rounded-lg bg-sidebar-primary p-1
				text-sidebar-primary-foreground
				data-[state=open]:size-12"
			>
				<Logo size="sm" fill="white" />
			</div>
			<div class="grid flex-1 text-left text-sm leading-tight">
				<span class="truncate font-semibold"> Jami.et </span>
				<span class="truncate text-xs">One link to rule them all</span>
			</div>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
</Sidebar.Menu>
