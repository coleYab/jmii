<script lang="ts">
	import { GithubLogo, GoogleLogo, SpinnerGap } from 'phosphor-svelte';

	import { page } from '$app/state';

	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	let isEmailLoading = $state(false);
	let isGithubLoading = $state(false);
	let isGoogleLoading = $state(false);
	let email = $state('');
	let password = $state('');


	async function onEmailSubmit() {
		isEmailLoading = true;
		const { data, error } = await authClient.signUp.email({
			email,
			password,
			name: email.split('@')[0],
			callbackURL: `${page.url.origin}/dash`
		});

		if (error) {
			console.error(error);
			toast.error(error.message ?? 'Failed to sign up with email');
		} else {
			toast.success('Successfully signed up with email');
			goto('/builder');
		}
		isEmailLoading = false;
	}

	async function onGithubClick() {
		isGithubLoading = true;

		try {
			const { data, error } = await authClient.signIn.social({
				provider: 'github',
				callbackURL: `${page.url.origin}/dash`
			});

			console.log(data);
		} catch (error) {
			console.error('Github sign in error:', error);
		} finally {
			isGithubLoading = false;
		}
	}

	async function onGoogleClick() {
		isGoogleLoading = true;
		try {
			const data = await authClient.signIn.social({
				provider: 'google',
				callbackURL: `${page.url.origin}/dash`,
			});
			console.log(data);
		} catch (error) {
			console.error('Google sign in error:', error);
		} finally {
			isGithubLoading = false;
		}
	}
</script>

<div class="grid gap-4">
	<div class="grid gap-2">
		<div class="flex w-full max-w-sm flex-col gap-1.5">
			<Label class="sr-only" for="email">Email</Label>
			<Label for="email" class="text-sm text-muted-foreground">Email</Label>
			<Input
				id="email"
				placeholder="name@gmail.com"
				type="email"
				bind:value={email}
				autocapitalize="none"
				autocomplete="email"
				autocorrect="off"
				disabled={isEmailLoading}
			/>
		</div>
		<div class="flex w-full max-w-sm flex-col gap-1.5">
			<Label class="sr-only" for="password">Password</Label>
			<Label for="password" class="text-sm text-muted-foreground">Password</Label>
			<Input
				id="password"
				placeholder="********"
				type="password"
				bind:value={password}
				disabled={isEmailLoading}
			/>
		</div>
	</div>
	<Button type="submit" disabled={isEmailLoading} onclick={onEmailSubmit}>
		{#if isEmailLoading}
			<SpinnerGap class="mr-2 h-4 w-4 animate-spin" />
		{/if}
		Sign Up with Email
	</Button>
</div>

<div class="relative">
	<div class="absolute inset-0 flex items-center">
		<span class="w-full border-t"></span>
	</div>
	<div class="relative flex justify-center text-xs uppercase">
		<span class="bg-background px-2 text-muted-foreground"> Or continue with </span>
	</div>
</div>

<div class="flex items-center justify-center gap-2">
	<Button variant="outline" type="button" disabled={isGithubLoading} onclick={onGithubClick}>
		{#if isGithubLoading}
			<SpinnerGap class="mr-2 h-4 w-4 animate-spin" />
		{:else}
			<GithubLogo class="mr-2 h-4 w-4" />
		{/if}
		GitHub
	</Button>
	<Button variant="outline" type="button" disabled={isGoogleLoading} onclick={onGoogleClick}>
		{#if isGoogleLoading}
			<SpinnerGap class="mr-2 h-4 w-4 animate-spin" />
		{:else}
			<GoogleLogo class="mr-2 h-4 w-4" />
		{/if}
		Google
	</Button>
</div>