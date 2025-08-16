<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import FileUpload from '$lib/components/common/FileUpload.svelte';

    interface Props {
        file: {
            accept?: string[];
            url?: string;
        };
    }

    let { file } : Props = $props();
    
    let uploadError = $state('');
    let isUploading = $state(false);

    const dispatch = createEventDispatcher<{
        change: { url: string };
    }>();

    function handleUploadSuccess({ detail }: CustomEvent<{ url: string }>) {
        dispatch('change', { url: detail.url });
        uploadError = '';
        isUploading = false;
    }

    function handleUploadError({ detail }: CustomEvent<{ error: string }>) {
        uploadError = detail.error;
        isUploading = false;
    }

    function handleUploadStart() {
        isUploading = true;
        uploadError = '';
    }
</script>

<div class="mb-4">
    <label for="file-upload" class="block text-sm font-medium text-foreground/80">File Upload</label>
    <div class="mt-1">
        <div class="relative" id="file-upload">
            <FileUpload
                accept={Array.isArray(file.accept) ? file.accept.join(',') : undefined}
                on:start={handleUploadStart}
                on:success={handleUploadSuccess}
                on:error={handleUploadError}
                disabled={isUploading}
            />
            {#if isUploading}
                <div class="absolute inset-0 flex items-center justify-center bg-background/50">
                    <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" ></div>
                </div>
            {/if}
        </div>
        {#if uploadError}
            <p class="mt-1 text-sm text-red-500">{uploadError}</p>
        {/if}
        {#if file.url}
            <div class="mt-2">
                <img src={file.url} alt="Uploaded file preview" class="max-h-32 rounded-lg" />
            </div>
        {/if}
    </div>
</div>
