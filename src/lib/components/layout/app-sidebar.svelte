<script lang="ts" module>
	import { GearSix, Palette, Signature } from 'phosphor-svelte';
	import {
		ChartLineUp,
		HandCoins,
		Swap,
		Users,
		Invoice,
		HandWithdraw,
		SquaresFour
	} from 'phosphor-svelte';

	const navData = {
		navMain: [
			{
				title: 'Builder',
				url: '/builder',
				icon: SquaresFour
			},

			{
				title: 'Analytics',
				url: '/analytics',
				icon: ChartLineUp
			},
			{
				title: 'Tips',
				url: '/tips',
				icon: HandCoins
			},
			// {
			// 	title: 'Referrals',
			// 	url: '/referrals',
			// 	icon: Swap
			// },
			// {
			// 	title: 'Settings',
			// 	url: '/settings',
			// 	icon: GearSix
			// }
		],
		navAdmin: [
			{
				title: 'Users',
				url: '/users',
				icon: Users
			},
			{
				title: 'KYC',
				url: '/kyc',
				icon: Signature
			},
			{
				title: 'Colors',
				url: '/colors',
				icon: Palette
			},
			{
				title: 'Transactions',
				url: '/transactions',
				icon: Invoice
			},
			{
				title: 'Payouts',
				url: '/payouts',
				icon: HandWithdraw
			}
		]
	};
</script>

<script lang="ts">
	import NavMain from '$lib/components/layout/nav-main.svelte';
	import NavUser from '$lib/components/layout/nav-user.svelte';
	import NavAdmin from '$lib/components/layout/nav-admin.svelte';
	import TeamSwitcher from '$lib/components/layout/team-switcher.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import NavUrl from './nav-url.svelte';
	let {
		ref = $bindable(null),
		collapsible = 'icon',
		data,
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & { data: any } = $props();

	// console.log(data);
</script>

<Sidebar.Root variant="inset" bind:ref {collapsible} {...restProps}>
	<Sidebar.Header>
		<TeamSwitcher />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={navData.navMain} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUrl {data} />
		{#if data?.user?.role === 'admin'}
			<NavAdmin items={navData.navAdmin} />
		{/if}
		<NavUser {data} />
	</Sidebar.Footer>
</Sidebar.Root>
