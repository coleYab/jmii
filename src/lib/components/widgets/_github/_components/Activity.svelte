<script lang="ts">
	interface Props {
		size: { width: number; height: number };
	}

	let { size }: Props = $props();
</script>

<div class="flex h-full w-full items-center justify-center">
	<div class=" w-full p-4">
		<span class="text-lg font-bold">Activity</span>

	</div>
</div>
