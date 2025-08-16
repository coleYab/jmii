<script lang="ts">
  
  import { createEventDispatcher } from 'svelte';
  import Title from './Title.svelte';
  interface Props {
    value: boolean;
    label: string;
    id: string;
  }

  let { value = $bindable(), label, id }: Props = $props();
  const dispatch = createEventDispatcher();

  function handleChange(event: Event) {
      const target = event.target as HTMLInputElement;
      value = target.checked;
      dispatch('change');
  }
</script>

<Title {label} {id} />
<div class="mt-1 flex items-center">
  <input
      type="checkbox"
      {id}
      checked={value}
      onchange={handleChange}
      class="h-4 w-4 rounded border-primary/10 text-primary focus:ring-primary"
  />
</div>