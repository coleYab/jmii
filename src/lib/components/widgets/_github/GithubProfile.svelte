<script lang="ts" module>
	export const defaultProps: GithubProfileProps = {
		username: 'robimez'
	};
	type GithubProfileProps = {
		username: string;
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import BaseWidget from '$lib/components/base/BaseWidget.svelte';
	import UserBlock from './_components/UserBlock.svelte';
	import ContribGraph from './_components/ContribGraph.svelte';
	import Activity from './_components/Activity.svelte';
	import { scale } from 'svelte/transition';

	interface Props {
		size?: { width: number; height: number };
		specificProps: Record<string, any>;
		githubData: any;
	}

	let { size = { width: 1, height: 1 }, specificProps, githubData = $bindable() }: Props = $props();

	let loading = $state(false);

	let p = $derived({
		...defaultProps,
		...specificProps,
		...githubData
	});

	const fetchData = async () => {
		loading = true;
		const { username } = p;
		const response = await fetch(`/api/github/${username}`);
		if (!response.ok) {
			throw new Error('Failed to fetch GitHub data');
		}
		const data = await response.json();
		githubData = data;
		loading = false;
	};

	onMount(async () => {
		fetchData();
	});
</script>

<BaseWidget {size} type="GithubProfile">
	<a
		href={`https://github.com/${p.username}`}
		class="block h-full w-full overflow-hidden p-3 hover:bg-gray-50 transition-colors duration-200"
		target="_blank"
		rel="noopener noreferrer"
	>
	{#key p.username}
		{#if !loading}
			<div
				in:scale={{ duration: 1000, start: 0.9 }}
				class="h-full w-full"
			>
				{#if size.width === 1 && size.height === 1}
					<UserBlock
						{p}
						{size}
						user={{ username: p.username }}
						following={p.following}
						followers={p.followers}
						name={p.name}
					/>
				{:else if size.width === 1 && size.height === 2}
					<div class="flex h-full w-full flex-col gap-4">
						<UserBlock
							{p}
							user={{ username: p.username }}
							{size}
							following={p.following}
							followers={p.followers}
							name={p.name}
						/>

						{#if githubData}
							<div class="flex-1">
								<ContribGraph {size} contributionData={githubData} />
							</div>
						{/if}
					</div>
				{:else if size.width === 2 && size.height === 1}
					<div class="flex h-full w-full items-center gap-4">
						<div class="flex-shrink-0">
							<UserBlock
								{p}
								user={{ username: p.username }}
								{size}
								following={p.following}
								followers={p.followers}
								name={p.name}
							/>
						</div>
						{#if githubData}
							<div class="flex-1">
								<ContribGraph {size} contributionData={githubData} />
							</div>
						{/if}
					</div>
				{:else if size.width === 2 && size.height === 2}
					<div class="flex h-full w-full flex-col gap-4">
						<div class="flex items-start gap-4">
							<div class="flex-shrink-0">
								<UserBlock
									{p}
									user={{ username: p.username }}
									{size}
									following={p.following}
									followers={p.followers}
									name={p.name}
								/>
							</div>
							{#if githubData}
								<div class="flex-1">
									<ContribGraph {size} contributionData={githubData} />
								</div>
							{/if}
						</div>
						<div class="flex-1">
							<Activity {size} />
						</div>
					</div>
				{/if}
			</div>
		{/if}
	{/key}
	</a>
</BaseWidget>

<style>
	a {
		text-decoration: none;
		color: inherit;
	}
</style>
