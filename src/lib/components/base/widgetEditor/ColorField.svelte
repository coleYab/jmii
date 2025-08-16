<script lang="ts">
    import Title from './Title.svelte';
    import { createEventDispatcher } from 'svelte';

    interface Props {
        id: string;
        label: string;
        value?: string;
    }

    let { id, label, value = $bindable('#000000') }: Props = $props();

    const dispatch = createEventDispatcher();

    function handleChange(e: Event) {
        const input = e.target as HTMLInputElement;
        value = input.value;
        dispatch('change', { value });
    }
</script>

<div class="space-y-2">
    <Title {label} {id} />
    <input
        {id}
        type="color"
        class="h-10 w-full cursor-pointer rounded-md border border-primary/30 bg-transparent p-1"
        {value}
        onchange={handleChange}
    />
</div> 