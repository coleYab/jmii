<script lang="ts">
    interface Props {
        label: string;
        id: string;
    }

    let { label, id }: Props = $props();

    function formatLabel(str: string): string {
        // Insert space before capital letters and trim any extra spaces
        const spaced = str.replace(/([A-Z])/g, ' $1').trim();
        // Capitalize first letter and convert rest to lowercase
        return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
    }
</script>

<label for={id} class="block text-sm font-medium text-foreground/80">{formatLabel(label)}</label>
