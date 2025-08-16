<script lang="ts">
	import AppSidebar from '$lib/components/layout/app-sidebar.svelte';
	import { navigation } from '$src/stores/navigationStore';

	import { Separator } from '$lib/components/ui/separator/index.js';

	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let { children } = $props();
</script>

<!-- <Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset class="max-h-screen overflow-y-auto rounded-xl">
		<header
			class="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background/20 backdrop-blur-sm transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
		>
			<div class="flex items-center gap-2 px-4">
				<Sidebar.Trigger class="-ml-1" />
				<Separator orientation="vertical" class="mr-2 h-4" />

				{#if $navigation.accounts}
					<Breadcrumb.Root>
						<Breadcrumb.List>
							<Breadcrumb.Item class="hidden md:block">
								<Breadcrumb.Link href="#">Accounts</Breadcrumb.Link>
							</Breadcrumb.Item>
							<Breadcrumb.Separator class="hidden md:block" />
							<Breadcrumb.Item>
								<Breadcrumb.Page>Account</Breadcrumb.Page>
							</Breadcrumb.Item>
						</Breadcrumb.List>
					</Breadcrumb.Root>
				{:else}
					<Breadcrumb.Root>
						<Breadcrumb.List>
							<Breadcrumb.Item>
								<Breadcrumb.Page>{$navigation.page}</Breadcrumb.Page>
							</Breadcrumb.Item>
							{#if $navigation.subpage}
								<Breadcrumb.Separator class="hidden md:block" />
								<Breadcrumb.Item>
									<Breadcrumb.Page>{$navigation.subpage}</Breadcrumb.Page>
								</Breadcrumb.Item>
							{/if}
						</Breadcrumb.List>
					</Breadcrumb.Root>
				{/if}
			</div>
		</header>
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider> -->
