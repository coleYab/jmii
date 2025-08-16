<script lang="ts">
	import { Star, Folder } from 'phosphor-svelte';
	import Follow from './Follow.svelte';
	interface Props {
		p: any;
		following: number;
		user: { username: string };
		followers: number;
		name: string;
		size: { width: number; height: number };
	}

	let {
		p,
		following,
		user,
		followers,
		name,
		size
	}: Props = $props();
</script>

<div class="w-{size.width}/2 h-{size.height}/2 overflow-hidden">
	<div class=" flex flex-col items-start justify-start px-2">
		<div class="flex w-full items-center justify-start gap-4 py-4">
			<img src={p.avatar_url} alt={p.name} class="h-16 w-16 rounded-lg" />
			<div class="flex flex-col items-start justify-start ">
				<span class="block truncate text-sm">
					<b>{following}</b> following
				</span>
				<span class="block truncate text-sm">
					<b>{followers}</b> followers
				</span>

				<span class="flex items-center justify-start gap-2">
					<span class="flex items-center justify-center gap-1">
						<Star size={16} />
						{p.total_stars}
					</span>
					<span class="flex items-center justify-center gap-1">
						<Folder size={16} />
						{p.public_repos}
					</span>
				</span>
			</div>
		</div>
		<div class=" flex w-full shrink flex-col justify-start">
			<p class=" truncate pb-2 text-left font-display text-lg">{name ?? p.login}</p>

			<Follow {user} />
		</div>
	</div>
</div>
