<script lang="ts">
	import AppSidebar from '$lib/components/layout/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	/** @type {{children?: import('svelte').Snippet}} */
	let { children, data } = $props();
</script>

<Sidebar.Provider>
	<AppSidebar {data} />
	<Sidebar.Inset class=" max-h-[98vh] min-w-0 overflow-y-auto !rounded-2xl scrollbar-hide ">
		{@render children?.()}
	</Sidebar.Inset>
</Sidebar.Provider>
