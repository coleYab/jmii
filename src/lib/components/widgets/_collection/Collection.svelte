<script lang="ts" module>
    import { writable } from 'svelte/store';

    export const defaultProps = {
        mode: 'username',
        placeholder: 'Enter value...',
        buttonText: 'Submit'
    };

    type CollectionProps = typeof defaultProps;
</script>

<script lang="ts">
    import { Notebook } from 'phosphor-svelte';
	import BaseWidget from '$lib/components/base/BaseWidget.svelte';

    interface Props {
        size: { width: number; height: number };
        specificProps: Record<string, any>;
    }

    let { size, specificProps }: Props = $props();

    let inputValue = $state('');

    let p = $derived({
        ...defaultProps,
        ...specificProps
    });

    function handleSubmit() {
        console.log(`Submitted ${p.mode}: ${inputValue}`);
        inputValue = '';
    }
</script>

<BaseWidget {size} type="Collection">
    <div class="flex h-full w-full flex-col p-2">
        <div class="flex items-center gap-2 mb-2">
            <Notebook size={20} weight="duotone" />
            <span class="text-sm font-semibold capitalize">{p.mode} Collection</span>
        </div>

        <div class="flex flex-col gap-2 flex-grow">
            <input
                type="text"
                class="flex-grow px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                placeholder={p.placeholder}
                bind:value={inputValue}
            />
            <button
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                onclick={handleSubmit}
            >
                {p.buttonText}
            </button>
        </div>
    </div>
</BaseWidget> 