<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	import { navigation } from '$src/stores/navigationStore';
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { cn } from '$lib/utils';
	import { CircleNotch } from 'phosphor-svelte';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';

	interface INavMainProps {
		items: {
			title: string;
			url: string;
			// this should be `Component` after lucide-svelte updates types
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			icon?: any;
			isActive?: boolean;
			items?: {
				title: string;
				url: string;
			}[];
		}[];
	}

	let { items }: INavMainProps = $props();

	const sidebar = useSidebar();

	let isNavigatingFrom = $derived((url: string) => navigating?.from?.url.pathname === url);
	let isNavigatingTo = $derived((url: string) => navigating?.to?.url.pathname === url);
</script>

<Sidebar.Group>
	<Sidebar.Menu class="flex flex-col gap-2">
		{#each items as mainItem (mainItem.title)}
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					onclick={() => {
						if (mainItem.url !== '#') {
							$navigation.page = mainItem.title;
							goto(mainItem.url);
						}
					}}
					class={cn(
						'rounded-xl   py-5 text-[14px] transition-colors duration-300',
						mainItem.url === '#' && 'pointer-events-none cursor-not-allowed opacity-50',

						mainItem.url === page.url.pathname && [
							'bg-primary text-primary-foreground',
							'hover:bg-primary/90 hover:text-primary-foreground',
							'focus:bg-primary/90 focus:text-primary-foreground',
							isNavigatingTo(mainItem.url) && 'opacity-70'
						]
					)}
				>
					{#snippet tooltipContent()}
						{mainItem.title}
					{/snippet}
					{#if isNavigatingFrom(mainItem.url)}
						<span>
							<CircleNotch size={22} weight="duotone" class="animate-spin" />
						</span>
					{:else if mainItem.icon}
						<span class="overflow-visible flex aspect-square size-10 items-center justify-center ">
							<mainItem.icon size={22} weight="duotone" />
						</span>
					{/if}
					{#if sidebar.state !== "collapsed"}
						<span>{mainItem.title}</span>
					{/if}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
