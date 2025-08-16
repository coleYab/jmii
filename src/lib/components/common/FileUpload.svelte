<script lang="ts">
  import { createUploadThing } from '$lib/utils/uploadthing';
  import { createEventDispatcher } from 'svelte';
  import { authClient } from '$lib/auth-client';

  interface Props {
    accept?: string;
    disabled?: boolean;
  }

  let { accept, disabled = false }: Props = $props();

  const dispatch = createEventDispatcher<{
    start: void;
    success: { url: string };
    error: { error: string };
  }>();

  const { startUpload } = createUploadThing('mediaUploader', {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.url) {
        dispatch('success', { url: res[0].url });
      }
    },
    onUploadError: (error) => {
      dispatch('error', { error: error.message });
    }
  });
</script>

<input
  type="file"
  {accept}
  {disabled}
  class="block w-full text-sm text-foreground/80
    file:mr-4 file:py-2 file:px-4
    file:rounded-full file:border-0
    file:text-sm file:font-semibold
    file:bg-primary/10 file:text-primary
    hover:file:bg-primary/20
    disabled:opacity-50 disabled:cursor-not-allowed"
  onchange={async (e) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    dispatch('start');
    await startUpload([file]);
  }}
/>
