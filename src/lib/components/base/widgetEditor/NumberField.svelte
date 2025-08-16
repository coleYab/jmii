<script lang="ts">
  
  import { createEventDispatcher } from 'svelte';
  import Title from './Title.svelte';
  interface Props {
    value: number;
    label: string;
    id: string;
  }

  let { value = $bindable(), label, id }: Props = $props();
  const dispatch = createEventDispatcher();
</script>

<Title {label} {id} />
<input
  type="number"
  {id}
  bind:value
  oninput={() => dispatch('change')}
  class="mt-1 block w-full rounded-md border border-primary/10 bg-background p-2 text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
/>