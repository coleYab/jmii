<script lang="ts">
	import { CheckCircle, Info, Warning, XCircle, X } from 'phosphor-svelte';

	// Color definitions for easy editing
	const COLORS = {
		success: {
			gradient: '#22c55e, #16a34a',
			background: '#dcfce7'
		},
		info: {
			gradient: '#3b82f6, #1d4ed8',
			background: '#dbeafe'
		},
		warning: {
			gradient: '#eab308, #ca8a04',
			background: '#fef3c7'
		},
		error: {
			gradient: '#ef4444, #dc2626',
			background: '#fee2e2'
		}
	} as const;

	interface Props {
		title: string;
		message: string;
		variant?: 'success' | 'info' | 'warning' | 'error';
		dismissible?: boolean;
		class?: string;
		onDismiss?: () => void;
	}

	let {
		title,
		message,
		variant = 'info',
		dismissible = true,
		class: className = '',
		onDismiss
	}: Props = $props();

	function getIcon(variant: string) {
		switch (variant) {
			case 'success':
				return CheckCircle;
			case 'info':
				return Info;
			case 'warning':
				return Warning;
			case 'error':
				return XCircle;
			default:
				return Info;
		}
	}

	const IconComponent = getIcon(variant);
</script>

<div class="group relative flex rounded-2xl">
	<div
		class="relative z-20 flex w-full items-start gap-3 rounded-2xl px-4 py-3 backdrop-blur-lg transition-all duration-300 ease-in-out hover:bg-background/95 {className}"
		style="background-color: {COLORS[variant].background};"
	>
		{#if variant}
			<div class="mt-0.5 flex-shrink-0">
				<IconComponent size={40} weight="duotone" color="currentColor" fill="currentColor" />
			</div>
		{/if}

		<!-- Content -->
		<div class="min-w-0 flex-1">
			<h3 class="mb-1 text-sm font-semibold text-gray-900">{title}</h3>
			<p class="text-sm text-gray-700">{message}</p>
		</div>

		<!-- Dismiss button -->
		{#if dismissible}
			<button
				onclick={onDismiss}
				class="ml-2 flex-shrink-0 rounded-full p-1 transition-colors duration-200 hover:bg-black/10"
				aria-label="Dismiss"
			>
				<X size={16} class="text-gray-600" />
			</button>
		{/if}
	</div>

	<!-- Gradient borders -->
	<span
		class="absolute -bottom-[4px] -right-[4px] rounded-2xl opacity-100 transition-all duration-300 ease-in-out group-hover:-translate-x-[2px] group-hover:-translate-y-[2px]"
		style="background: linear-gradient(to bottom right, {COLORS[variant]
			.gradient}); width: calc(100%); height: calc(100%);"
	></span>
	<span
		class="absolute -left-[1px] -top-[1px] rounded-[17px] opacity-100"
		style="background: linear-gradient(to bottom right, {COLORS[variant]
			.gradient}); width: calc(100% + 2px); height: calc(100% + 2px);"
	></span>
</div>
