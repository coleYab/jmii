<script lang="ts">
	import AccountsTable from './_components/data-table/accounts-table.svelte';
</script>

<div class="container mx-auto space-y-6 pt-10">
	<div class="pl-2 pt-2">
		<h3 class="text-lg font-medium">Account Management</h3>
		<p class="text-sm text-muted-foreground">Manage accounts & access on the platform.</p>
	</div>

	<div class="w-full">
		<AccountsTable />
	</div>
</div>
