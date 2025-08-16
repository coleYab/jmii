<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	import type { UserRow } from '../columns';

	let { row }: { row: UserRow } = $props();
</script>

{#if row.status}
	<div class="flex gap-2">
		{#if row.status.emailVerified}
			<Badge variant="outline">Verified</Badge>
		{:else}
			<Badge variant="outline" class="bg-amber-100">Unverified</Badge>
		{/if}

		{#if row.role && row.role !== 'user'}
			<Badge variant="destructive">
				{row.role}
			</Badge>
		{:else}
			<Badge variant="outline">
				{row.role}
			</Badge>
		{/if}
		{#if row.status.banned}
			<span class="relative flex flex-col items-center justify-center">
				<Badge variant="outline" class="bg-red-100 text-red-900">Banned</Badge>
				<span class="absolute -bottom-4 whitespace-nowrap text-xs text-muted-foreground">
					{row.status.banReason}
				</span>
			</span>
		{/if}
	</div>
{/if}
