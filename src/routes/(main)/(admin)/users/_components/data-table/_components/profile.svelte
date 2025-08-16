<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';

	import type { UserRow } from '../columns';

	let { row }: { row: UserRow } = $props();
</script>

<div class="flex items-center gap-3">
	<div class="avatar">
		<div class=" overflow-clip rounded-full">
			<Avatar.Root class="size-12 rounded-md ">
				{#if !row?.profile?.image || row?.profile?.image == 'https://example.com/image.png'}
					<Avatar.Image
						src={`https://api.dicebear.com/9.x/shapes/svg?scale=130&seed=${row?.profile?.name}`}
					/>
				{:else}
					<Avatar.Image src={row?.profile?.image} alt={row?.profile?.name} />
				{/if}
				<Avatar.Fallback>{row?.profile?.name?.charAt(0)}</Avatar.Fallback>
			</Avatar.Root>
		</div>
	</div>
	<div>
		<div class="font-bold">{row?.profile?.name}</div>
		<div class="text-sm opacity-50">{row?.profile?.email}</div>
		<div class="text-xs opacity-50">
			ID: {row?.profile?.id} 
		</div>
	</div>
</div>
