<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/input/input.svelte';
	import { page } from '$app/state';

	const session = authClient.useSession();

	let { data } = $props();
	console.log(data);

	let isEditing = $state(false);
	let isSaving = $state(false);
	let customUrl = $state('');
	let editingUrl = $state('');
	let urlError = $state('');
	let isFetching = $state(true);

	async function fetchUserUrl() {
		isFetching = true;
		const url = data?.profile?.url;
		if (url) {
			customUrl = url;
			editingUrl = url;
		} else {
			customUrl = '';
			editingUrl = '';
		}
		isFetching = false;
	}

	async function handleUpdate() {
		isSaving = true;
		if (!$session.data?.user?.id) return;

		urlError = '';

		try {
			const response = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					url: editingUrl
				})
			});

			const result = await response.json();

			if (!response.ok) {
				urlError = result.error || 'Failed to update URL';
				isSaving = false;
				return;
			}

			// Update local state with the new URL
			customUrl = editingUrl;
			isEditing = false;
		} catch (error) {
			console.error('Error updating URL:', error);
			urlError = 'Failed to update URL. Please try again.';
		} finally {
			isSaving = false;
		}
	}

	$effect(() => {
		if ($session.data?.user?.id) {
			fetchUserUrl();
		}
	});

	$effect(() => {
		editingUrl = editingUrl.toLowerCase();
		// also remove all non-alphanumeric characters except for underscores
		editingUrl = editingUrl.replace(/[^a-z0-9_]/g, '');
	});

	let copied = $state(false);
</script>

<Sidebar.Group
	class="rounded-2xl border bg-sidebar-primary-foreground pb-3 pt-1 group-data-[collapsible=icon]:hidden"
>
	<Sidebar.GroupLabel class="flex flex-row items-center justify-between"
		>Your jami.bio link <button
			onclick={() => {
				navigator.clipboard.writeText(`${page.url.origin}/${customUrl}`);
				copied = true;
				setTimeout(() => {
					copied = false;
				}, 3000);
			}}>{copied ? 'Copied' : 'Copy'}</button
		></Sidebar.GroupLabel
	>
	<Sidebar.Menu>
		<Sidebar.MenuItem class="group">
			{#if isEditing}
				<div class="relative flex flex-col gap-2 p-1">
					<small
						class="absolute -bottom-2 right-0 text-xs {editingUrl.length == 32
							? 'text-red-500'
							: 'text-muted-foreground'}"
					>
						{editingUrl.length}/32
					</small>
					<Input
						type="text"
						maxlength={32}
						bind:value={editingUrl}
						placeholder="Enter Your URL"
						class="h-8 text-sm"
						disabled={isSaving}
					/>
					{#if urlError}
						<p class="text-xs text-red-500">{urlError}</p>
					{/if}
					<div class="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onclick={() => {
								isEditing = false;
								editingUrl = customUrl;
								urlError = '';
							}}
							disabled={isSaving}
							class="h-7 text-xs"
						>
							Cancel
						</Button>
						<Button size="sm" onclick={handleUpdate} disabled={isSaving} class="h-7 text-xs ">
							{isSaving ? 'Saving...' : 'Save'}
						</Button>
					</div>
				</div>
			{:else}
				<div class="flex items-center gap-2 px-1 text-sm">
					{#if isFetching}
						<span class="text-foreground/50">Fetching...</span>
					{:else if customUrl}
						<a
							href="{page.url.origin}/{customUrl}"
							class="truncate text-primary hover:underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							{page.url.host}/{customUrl}
						</a>
						<button
							type="button"
							onclick={() => (isEditing = true)}
							class="ml-auto rounded-md border border-primary/30 px-2 py-0.5 text-xs opacity-0 transition-all hover:bg-primary/10 group-hover:opacity-100"
						>
							Edit
						</button>
					{:else}
						<span class="text-foreground/50">Not set</span>
						<button
							type="button"
							onclick={() => (isEditing = true)}
							class="ml-auto rounded-md border border-primary/30 px-2 py-0.5 text-xs transition-all hover:bg-primary/10"
						>
							Set URL
						</button>
					{/if}
				</div>
			{/if}
		</Sidebar.MenuItem>
	</Sidebar.Menu>
</Sidebar.Group>
