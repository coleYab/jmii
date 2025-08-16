<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import * as Command from '$lib/components/ui/command';
	import { CheckCircle, Trash, Ban } from 'lucide-svelte';

	import { SpinnerGap, UserSwitch } from 'phosphor-svelte';
	import Action from './action.svelte';

	let users: any[] = $state([]);
	let impersonating = $state(false);
	let session = authClient.useSession();

	async function banUser(userId: string) {
		try {
			await authClient.admin.banUser({
				userId: userId,
				banReason: 'No reason provided',
				banExpiresIn: 60 * 60 * 24 * 7 // 7 days
			});
			// Refresh the users list
			const response = await authClient.admin.listUsers({
				query: {
					limit: 10
				}
			});
			if (response.data) {
				users = response.data.users;
			}
		} catch (error) {
			console.error('Error banning user:', error);
		}
	}

	async function unbanUser(userId: string) {
		try {
			await authClient.admin.unbanUser({
				userId: userId
			});
			// Refresh the users list
			const response = await authClient.admin.listUsers({
				query: {
					limit: 10
				}
			});
			if (response.data) {
				users = response.data.users;
			}
		} catch (error) {
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
		} catch (error) {
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
			const response = await authClient.admin.listUsers({
				query: {
					limit: 10
				}
			});
			if (response.data) {
				users = response.data.users;
			}
		} catch (error) {
			console.error('Error deleting user:', error);
		}
	}

	async function createAuxillary() {
		const response = await fetch('/api/users/create-auxiliary', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ email: user.email, baId: user.id })
		});

		const data = await response.json();

		console.log(data);
	}

	let { user } = $props();
</script>

<Command.Root>
	<Command.List>
		<Command.Empty>No actions for this user.</Command.Empty>
		<Command.Group heading="Actions">
			<Action onClick={() => banUser(user.id)}>
				<Ban />
				ban
			</Action>
			<Action onClick={() => unbanUser(user.id)}>
				<CheckCircle />
				unban
			</Action>
		</Command.Group>
		<Command.Separator />
		<Command.Group heading="Crud">
			<Action onClick={() => deleteUser(user.id)}>
				<Trash />
				Delete
			</Action>
			<Action onClick={() => impersonateUser(user.id)}>
				{#if impersonating}
					<SpinnerGap class="animate-spin" size={14} />
				{:else}
					<UserSwitch size={14} />
				{/if}
				Impersonate
			</Action>
		</Command.Group>
	</Command.List>
</Command.Root>
