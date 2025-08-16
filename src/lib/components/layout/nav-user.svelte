<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { ChevronsUpDown, LogOut } from 'lucide-svelte';

	import { goto } from '$app/navigation';

	let { data } = $props();
	const profile = data?.profile;

	const sidebar = useSidebar();
</script>

{#key data}
	<Sidebar.Menu>
		<Sidebar.MenuItem>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Sidebar.MenuButton
							size="lg"
							class="rounded-2xl border bg-background data-[state=open]:text-sidebar-accent-foreground  "
							{...props}
						>
							<Avatar.Root class="h-8 w-8 rounded-2xl border">
								<Avatar.Image src={profile?.image} alt={profile?.name} />
								<Avatar.Fallback class="rounded-lg">
									{profile?.name?.charAt(0)}
								</Avatar.Fallback>
							</Avatar.Root>
							<div class="grid flex-1 text-left text-sm leading-tight">
								<span class="truncate font-semibold">
									{profile?.displayName ?? 'Unknown'}
									{data?.user?.role === 'admin' ? '[admin]' : ''}
								</span>
								<span class="truncate text-xs">{data.user?.email}</span>
							</div>
							<ChevronsUpDown class="ml-auto size-4" />
						</Sidebar.MenuButton>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content
					class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-2xl"
					side={sidebar.isMobile ? 'bottom' : 'right'}
					align="end"
					sideOffset={4}
				>
					<DropdownMenu.Label class="p-0 font-normal">
						<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
							<Avatar.Root class="h-8 w-8 rounded-lg border">
								<Avatar.Image src={profile?.image} alt={profile?.displayName} />
							</Avatar.Root>
							<div class="grid flex-1 text-left text-sm leading-tight">
								<span class="truncate font-semibold">
									{profile?.displayName ?? 'Unknown'}
									{data?.user?.role === 'admin' ? '[admin]' : ''}
								</span>
								<span class="truncate text-xs">{data?.user?.email}</span>
							</div>
						</div>
					</DropdownMenu.Label>

					<DropdownMenu.Separator />
					<DropdownMenu.Item
						onclick={async () => {
							await authClient.signOut();
							goto('/login');
						}}
					>
						<LogOut />
						Log out
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</Sidebar.MenuItem>
	</Sidebar.Menu>
{/key}
