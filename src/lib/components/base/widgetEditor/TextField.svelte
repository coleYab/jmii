<script lang="ts">
  
  import { createEventDispatcher } from 'svelte';
  import Title from './Title.svelte';
  interface Props {
    value: string;
    label: string;
    id: string;
  }

  let { value = $bindable(), label, id }: Props = $props();
  const dispatch = createEventDispatcher();

  function handleInput(e: Event) {
      const target = e.target as HTMLTextAreaElement;
      target.style.height = 'auto';
      target.style.height = target.scrollHeight + 'px';
      dispatch('change');
  }
</script>

<Title {label} {id} />
<textarea
  {id}
  bind:value
  oninput={handleInput}
  class="mt-1 block w-full rounded-md border border-primary/10 bg-background p-2 text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
></textarea>