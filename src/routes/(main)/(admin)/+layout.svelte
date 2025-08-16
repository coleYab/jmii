<script lang="ts">

	/** @type {{children?: import('svelte').Snippet}} */
	let { children, data } = $props();
</script>


		{@render children?.()}

