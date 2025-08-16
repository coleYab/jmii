<script lang="ts">
	import { onMount } from 'svelte';
	import { GearSix } from 'phosphor-svelte';
	import * as Popover from '$lib/components/ui/popover';
	import { tipStore } from '$src/stores/tipStore';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	let { session, data }: any = $props();

	onMount(() => {
		console.log(session);
	});
</script>

<small> TODO : ui here </small>
<Popover.Root>
	<Popover.Trigger
		><Button variant="ghost" size="icon" class=" transition-all duration-300  ">
			<GearSix weight="duotone" />
		</Button>
	</Popover.Trigger>
	<Popover.Content alignOffset={300}>
		<div class="grid gap-4">
			<div class="space-y-2">
				<h4 class="font-medium leading-none">Quick Settings</h4>
				<p class="text-sm text-muted-foreground">Quickly adjust the settings for your page</p>
			</div>
			<div class="grid gap-2">
				<div class="grid grid-cols-3 items-center gap-4">
					<div class="flex items-center space-x-2">
						<Switch id="tipping" bind:checked={$tipStore.enabled} />
						<Label for="tipping" class="whitespace-nowrap "
							>Tipping {$tipStore.enabled ? 'Enabled' : 'Disabled'}
						</Label>
					</div>
				</div>
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
