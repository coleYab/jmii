<script lang="ts">
	import { Command } from 'lucide-svelte';

	import { Button } from '../ui/button';
	import UserAuthForm from './UserAuthForm.svelte';

	let mode: 'signin' | 'signup' = $state('signin');
</script>

<div
	class="container relative hidden h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 w-screen"
>
	<Button
		variant="ghost"
		class="absolute right-4 top-4 md:right-8 md:top-8"
		onclick={() => {
			mode = mode === 'signin' ? 'signup' : 'signin';
		}}
	>
		{#if mode === 'signin'}
			Sign up
		{:else}
			Sign in
		{/if}
	</Button>
	<div class="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
		<div
			class="absolute inset-0 bg-cover object-contain"
			style="
				background-image:
					url(https://images.unsplash.com/photo-1543539748-a4bf17a68a8a?q=80&w=1683&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D);"
		></div>
		<div class="relative z-20 flex items-center text-lg font-medium">
			<Command class="mr-2 h-6 w-6" />
			Jami
		</div>
		<div class="relative z-20 mt-auto">
			<blockquote class="space-y-2">
				<p class="text-lg">&ldquo;Link Everything, Track All&rdquo;</p>
				<footer class="text-sm">Jami</footer>
			</blockquote>
		</div>
	</div>
	<div class="lg:p-8">
		<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
			<div class="flex flex-col space-y-2 text-center">
				<h1 class="text-2xl font-semibold tracking-tight">
					Welcome {mode === 'signin' ? 'back' : ''}
				</h1>
				<p class="text-sm text-muted-foreground">Enter your email to continue.</p>
			</div>
			<UserAuthForm {mode} />

			<span class="flex flex-col gap-2">
				<p class="px-8 text-center text-sm text-muted-foreground">
					By proceeding, you confirm that you agree with our <a href="/TOS" class="underline"
						>Terms of Service</a
					>
					and <a href="/PP" class="underline">Privacy Policy</a>
				</p>
			</span>
		</div>
	</div>
</div>