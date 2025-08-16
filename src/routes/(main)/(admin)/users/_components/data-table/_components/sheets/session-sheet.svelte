<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { onMount } from 'svelte';

	import prettyMilliseconds from 'pretty-ms';

	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { LinkBreak } from 'phosphor-svelte';
	import { Separator } from '$lib/components/ui/separator';

	let { row, showSessionsSheet = $bindable() } = $props();

	let userSessions: any[] = $state([]);
	let loadingSessions = $state(false);

	async function fetchUserSessions(forceRefresh = false) {
		loadingSessions = true;
		if (!forceRefresh && userSessions.length > 0) {
			return;
		}

		try {
			const response = await authClient.admin.listUserSessions({
				userId: row.id
			});
			if (response.data) {
				userSessions = response.data.sessions;
			}
		} catch (error) {
			toast.error('Error fetching sessions: ' + error);
			console.error('Error fetching sessions:', error);
		} finally {
			loadingSessions = false;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}

	$effect(() => {
		if (showSessionsSheet) {
			fetchUserSessions(true);
		}
	});

	onMount(() => {
		if (showSessionsSheet) {
			fetchUserSessions(true);
		}
	});
</script>

<Sheet.Root bind:open={showSessionsSheet}>
	<Sheet.Content side="left" class="sm:max-w-2xl overflow-scroll">
		<Sheet.Header class="pb-2">
			<Sheet.Title>Edit Sessions</Sheet.Title>
			<Sheet.Description>View all sessions for this user.</Sheet.Description>
		</Sheet.Header>

		<Separator class="my-2" />


		{#if loadingSessions}
			<div class="flex flex-col gap-2">
				{#each Array(10) as _}
					<Skeleton class="h-24 w-full " />
				{/each}
			</div>
		{:else}
			{#each userSessions as session}
				<div class="flex gap-2 border px-1 py-2 justify-between">
					<div>
						{#if session.impersonatedBy}
							<Badge variant="outline">{session.impersonatedBy}</Badge>
						{/if}
						{#if session.ipAddress}
							<span class="text-sm text-muted-foreground">{session.ipAddress}</span>
						{/if}
						<div class="flex flex-row items-center justify-start gap-4 p-1">
							<div class="flex flex-col items-start">
								<button
									class="cursor-pointer text-sm font-medium hover:opacity-80"
									onclick={() => {
										copyToClipboard(session.id);
										toast.success('Copied Session ID to clipboard');
									}}
								>
									Sesh id: {session.id.slice(0, 8)}...{session.id.slice(-8)}
								</button>
								<button
									class="cursor-pointer text-sm font-medium hover:opacity-80"
									onclick={() => {
										copyToClipboard(session.userId);
										toast.success('Copied User ID to clipboard');
									}}
								>
									User id: {session.userId.slice(0, 8)}...{session.userId.slice(-8)}
								</button>
								<button
									class="cursor-pointer text-xs text-muted-foreground hover:opacity-80"
									onclick={() => {
										copyToClipboard(session.token);
										toast.success('Copied Token to clipboard');
									}}
								>
									Token: {session.token}
								</button>
							</div>
							<div class="flex flex-col border-l-2 pl-2">
								<span class="text-sm">
									Expires in {prettyMilliseconds(Date.parse(session.expiresAt) - Date.now())}
								</span>
								<span class="text-xs text-muted-foreground">
									Created
									<span class="font-bold">
										{prettyMilliseconds(Date.now() - Date.parse(session.createdAt))}
									</span>
									ago at
									<span class="font-bold">
										{new Date(session.createdAt).toLocaleString()}
									</span>
								</span>
								<span class="text-xs text-muted-foreground">
									Updated
									<span class="font-bold">
										{prettyMilliseconds(Date.now() - Date.parse(session.updatedAt))}
									</span>
									ago at
									<span class="font-bold">
										{new Date(session.updatedAt).toLocaleString()}
									</span>
								</span>
							</div>
						</div>
						<button
							class="cursor-pointer text-xs text-muted-foreground hover:opacity-80"
							onclick={() => {
								copyToClipboard(session.id);
								toast.success('Copied User agent to clipboard');
							}}
						>
							User agent: {session.userAgent}
						</button>
					</div>

					<Button variant="destructive" size="icon">
						<LinkBreak />
					</Button>
				</div>
			{/each}
		{/if}

		<!-- <Sheet.Footer>
			<Sheet.Close>Close</Sheet.Close>
		</Sheet.Footer> -->
	</Sheet.Content>
</Sheet.Root>
