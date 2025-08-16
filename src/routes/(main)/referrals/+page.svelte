<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as Table from '$lib/components/ui/table';

	import { Separator } from '$lib/components/ui/separator';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';

	const { data } = $props();

	let copied = $state(false);

	const copyReferralCode = () => {
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 1500);

		navigator.clipboard.writeText(`https://jami.bio/sign-up?ref=${data?.user?.url}`);
		toast.success('Referral code copied to clipboard');
	};
</script>

<header
	class="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
>
	<div class="flex items-center gap-2 px-4">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mr-2 h-4" />
	</div>

	<div
		class="container mr-24 flex w-full max-w-screen-xl items-center justify-between gap-2 px-4"
	></div>
</header>

<main class="container mx-auto flex max-h-[80vh] flex-col gap-12">
	<div class="flex justify-between gap-4">
		<h1 class="text-2xl font-bold">Referrals</h1>
		<div class="flex items-center justify-center gap-8 rounded-xl border border-primary px-2 py-1">
			<div class="flex flex-col px-2">
				{#if data}
					<small class="text-sm text-muted-foreground"> Your Referral Code: </small>
					<span>https://jami.bio/sign-up?ref={data?.user?.url}</span>
				{/if}
			</div>
			<Button onclick={copyReferralCode} class="w-24">
				{copied ? 'Copied' : 'Copy'}
			</Button>
		</div>
	</div>

	<Table.Root class=" max-h-[50vh] overflow-y-auto">
		<Table.Header class="sticky top-0 z-10 bg-background">
			<Table.Row>
				<Table.Head class="w-[100px]">Name</Table.Head>
				<Table.Head>Status</Table.Head>
				<Table.Head>Date</Table.Head>
				<Table.Head class="text-right">Amount</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each Array(20) as _}
				<Table.Row class="odd:bg-muted">
					<Table.Cell class="font-medium">Bori</Table.Cell>
					<Table.Cell>
						<Badge variant="outline">Signed Up</Badge>
						<Badge variant="default">Paid</Badge>
						<Badge variant="destructive">Failed to sign up</Badge>
					</Table.Cell>
					<Table.Cell>
						<span class="flex flex-col">
							<span class="text-sm text-muted-foreground">10 days ago</span>
							<span class="text-sm text-muted-foreground">7/04/2025 12:00:00</span>
						</span>
					</Table.Cell>
					<Table.Cell class="text-right">50.00 ETB</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
		<Table.Footer class="sticky bottom-0 z-10 bg-background">
			<Table.Row>
				<Table.Cell >Total Earnings: 50.00 ETB</Table.Cell>
			</Table.Row>
		</Table.Footer>
	</Table.Root>
</main>
