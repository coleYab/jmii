<script lang="ts">
	import DataTable from './data-table.svelte';
	import { columns } from './columns.js';
	import type { UserRow } from './columns';
	import { onMount } from 'svelte';
	import * as Table from '$lib/components/ui/table';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { toast } from 'svelte-sonner';
	import { authClient } from '$lib/auth-client';

	let userPaginatedResponse: { users: any[] } = $state({ users: [] });

	let loading = $state(false);

	let data: UserRow[] = $derived(
		userPaginatedResponse.users
			.map((item: any) => ({
				...item,
				profile: {
					avatar: item.avatar,
					email: item.email,
					id: item.id,
					image: item.image,
					name: item.name
				},
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
				role: item.role,
				id: item.id,
				status: {
					banned: item.banned,
					banReason: item.banReason,
					banExpires: item.banExpires,
					emailVerified: item.emailVerified
				},
				lastLogin: item.lastLogin || null
			}))
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
	);

	async function fetchUserSessions(userId: string) {
		try {
			const response = await authClient.admin.listUserSessions({
				userId: userId
			});
			if (response.data && response.data.sessions && response.data.sessions.length > 0) {
				// Sort sessions by updatedAt descending to get the most recent one
				const sortedSessions = response.data.sessions.sort((a: any, b: any) => 
					new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
				);
				return sortedSessions[0].updatedAt;
			}
			return null;
		} catch (error) {
			console.error('Error fetching user sessions:', error);
			return null;
		}
	}

	onMount(async () => {
		loading = true;
		try {
			const users = await authClient.admin.listUsers({
				query: {
					limit: 10
				}
			});

			console.log('users', users);
			
			if (users.data) {
				// Fetch last login data for each user
				const usersWithLastLogin = await Promise.all(
					users.data.users.map(async (user: any) => {
						const lastLogin = await fetchUserSessions(user.id);
						return {
							...user,
							lastLogin
						};
					})
				);
				
				userPaginatedResponse = {
					...users.data,
					users: usersWithLastLogin
				};
			}
		} catch (error) {
			console.error('Error fetching users:', error);
			toast.error('Failed to fetch users');
		} finally {
			loading = false;
		}
	});
</script>

{#if !loading && userPaginatedResponse.users.length > 0}
	<DataTable {data} {columns} />
{:else}
	<Table.Root>
		<Table.Caption>Loading accounts...</Table.Caption>
		<Table.Header>
			<Table.Row>
				<Table.Head>Profile</Table.Head>
				<Table.Head>Status & Roles</Table.Head>
				<Table.Head>Created at / Updated at</Table.Head>
				<Table.Head>Last Login</Table.Head>
				<Table.Head>Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each Array(5) as _}
				<Table.Row>
					<Table.Cell>
						<div class="flex items-center gap-3">
							<div class="avatar">
								<Skeleton class="h-12 w-12 animate-pulse rounded-full bg-muted" />
							</div>
							<div class="space-y-2">
								<Skeleton class="h-4 w-24 animate-pulse rounded bg-muted" />
								<Skeleton class="h-3 w-32 animate-pulse rounded bg-muted" />
							</div>
						</div>
					</Table.Cell>
					<Table.Cell>
						<Skeleton class="h-4 w-16 animate-pulse rounded bg-muted" />
						<Skeleton class="h-4 w-16 animate-pulse rounded bg-muted" />
					</Table.Cell>
					<Table.Cell>
						<Skeleton class="h-4 w-20 animate-pulse rounded bg-muted" />
						<Skeleton class="h-4 w-20 animate-pulse rounded bg-muted" />
					</Table.Cell>
					<Table.Cell>
						<Skeleton class="h-4 w-20 animate-pulse rounded bg-muted" />
					</Table.Cell>
					<Table.Cell>
						<div class="space-y-2">
							<Skeleton class="h-3 w-20 animate-pulse rounded bg-muted" />
						</div>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
{/if}
