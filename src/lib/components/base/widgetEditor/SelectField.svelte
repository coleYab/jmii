<script lang="ts">
  
  import { createEventDispatcher } from 'svelte';
  import Title from './Title.svelte';
  interface Props {
    value: string;
    label: string;
    id: string;
    options: string[];
  }

  let {
    value = $bindable(),
    label,
    id,
    options
  }: Props = $props();
  const dispatch = createEventDispatcher();
</script>

<Title {label} {id} />
<select
  {id}
  bind:value
  onchange={() => dispatch('change')}
  class="mt-1 block w-full rounded-md border border-primary/10 bg-background p-2 text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
>
  {#each options as option}
      <option value={option}>{option}</option>
  {/each}
</select>