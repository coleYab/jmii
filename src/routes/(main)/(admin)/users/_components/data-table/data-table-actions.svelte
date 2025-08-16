<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	import { authClient } from '$lib/auth-client';
	import { CheckCircle, Trash, Ellipsis } from 'lucide-svelte';

	import { UserSwitch, Prohibit } from 'phosphor-svelte';
	import type { UserRow } from './columns';

	import SessionSheet from './_components/sheets/session-sheet.svelte';
	import { toast } from 'svelte-sonner';

	let { row }: { row: UserRow } = $props();

	let users: any[] = $state([]);
	let impersonating = $state(false);

	let showSessionsSheet = $state(false);
	let showProfileSheet = $state(false);

	const refreshUsers = async () => {
		const response = await authClient.admin.listUsers({
			query: {
				limit: 100
			}
		});
		if (response.data) {
			users = response.data.users;
		}

		console.log('initial row', row);

		// set the row to be the new updated user by filtering for by id
		row = users.find((user) => user.id === row.id);

		console.log('Updated row', row);
	};

	async function banUser(userId: string) {
		try {
			await authClient.admin.banUser({
				userId: userId,
				banReason: 'No reason provided',
				banExpiresIn: 60 * 60 * 24 * 7 // 7 days
			});
			// Refresh the users list
			await refreshUsers();
			toast.success('User banned successfully');
		} catch (error) {
			toast.error('Error banning user');
			console.error('Error banning user:', error);
		}
	}

	async function unbanUser(userId: string) {
		try {
			await authClient.admin.unbanUser({
				userId: userId
			});
			// Refresh the users list
			await refreshUsers();

			toast.success('User unbanned successfully');
		} catch (error) {
			toast.error('Error unbanning user');
			console.error('Error unbanning user:', error);
		}
	}

	async function impersonateUser(userId: string) {
		try {
			impersonating = true;
			await authClient.admin.impersonateUser({
				userId: userId
			});
			// Redirect to home page as impersonated user
			window.location.href = '/';
			toast.success('Impersonating user successfully');
		} catch (error) {
			toast.error('Error impersonating user');
			console.error('Error impersonating user:', error);
		} finally {
			impersonating = false;
		}
	}

	async function deleteUser(userId: string) {
		try {
			if (
				!confirm(
					'Are you sure you want to permanently delete this user? This action cannot be undone.'
				)
			) {
				return;
			}
			await authClient.admin.removeUser({
				userId: userId
			});
			// Refresh the users list
			await refreshUsers();
			toast.success('User deleted successfully');
		} catch (error) {
			toast.error('Error deleting user');
			console.error('Error deleting user:', error);
		}
	}
</script>

<SessionSheet {row} bind:showSessionsSheet />

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" class="relative size-8 border p-0">
				<span class="sr-only">Open menu</span>
				<Ellipsis class="size-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.GroupHeading>Access</DropdownMenu.GroupHeading>
			{#if row.status.banned}
				<DropdownMenu.Item onclick={() => unbanUser(row.id)}>
					<CheckCircle class="size-4" />
					Unban
				</DropdownMenu.Item>
			{:else}
				<DropdownMenu.Item onclick={() => banUser(row.id)}>
					<Prohibit class="size-4" />
					Ban
				</DropdownMenu.Item>
			{/if}
			<DropdownMenu.Item onclick={() => impersonateUser(row.id)}>
				<UserSwitch class="size-4" />
				Impersonate
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={() => deleteUser(row.id)}>
				<Trash class="size-4" />
				Delete
			</DropdownMenu.Item>
		</DropdownMenu.Group>
		<DropdownMenu.Separator />
		<DropdownMenu.Item onclick={() => (showSessionsSheet = true)}>View Sessions</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
