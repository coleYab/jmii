<script lang="ts">
	import UserDetailsDisplayEdit from '../common/UserDetailsDisplayEdit.svelte';

	import type { Profile } from '$lib/types/profile';
	import type { ITheme } from '$src/models/Theme.model';

	let {
		profileData,
		refresh,
		theme
	}: {
		profileData: Profile;
		refresh: () => void;
		theme?: ITheme;
	} = $props();
</script>

<UserDetailsDisplayEdit
	{profileData}
	isPublicView={false}
	isManualOverride={false}
	{refresh}
	mode="creative"
/>

<!-- {#if profileData}
	<div class="flex flex-col items-center justify-center p-8">
		<div class="text-muted-foreground">No user found</div>
	</div>
{:else}
	<div class="flex items-center justify-center p-8">
		<div class="text-muted-foreground">No user found</div>
	</div>
{/if} -->
