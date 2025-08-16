<script lang="ts">
	import { GithubLogo } from 'phosphor-svelte';
	interface Props {
		user?: { username: string };
	}

	let { user = { username: 'username' } }: Props = $props();
</script>

<button
	class=" flex
  w-full flex-row items-center
  justify-center gap-2
  rounded-lg bg-[#2b3137] px-3 py-2 text-[#fafbfc] transition-all hover:bg-[#24292e]
  dark:bg-[#ffffff]
	dark:text-[#2b3137]"
>
	<span class="flex items-center justify-center rounded-full p-1">
		<GithubLogo size={16} color="currentColor" weight="fill" />
	</span>
	<span class="flex truncate whitespace-nowrap">
		Follow @{user.username}
	</span>
</button>
