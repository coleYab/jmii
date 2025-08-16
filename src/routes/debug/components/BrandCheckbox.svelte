<script lang="ts">
	interface Props {
		checked?: boolean;
		disabled?: boolean;
		class?: string;
		variant?: 'default' | 'destructive';
		onchange?: (event: Event) => void;
		name?: string;
		id?: string;
	}

	let {
		checked = $bindable(false),
		disabled = false,
		class: className = '',
		variant = 'default',
		onchange,
		name,
		id
	}: Props = $props();
</script>

<div class="group relative flex rounded-lg">
	<label class="relative z-20 cursor-pointer">
		<input type="checkbox" bind:checked {disabled} {onchange} {name} {id} class="sr-only" />
		<div
			class="relative flex h-5 w-5 items-center justify-center rounded-lg
			bg-background backdrop-blur-lg transition-all duration-300
			ease-in-out hover:bg-background/95
		{variant === 'destructive' ? 'bg-[#ffd4d4]' : ''}

			{disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
			{className}"
		>
			<!-- Checkmark -->
			{#if checked}
				<svg
					class="h-3 w-3 text-foreground transition-all duration-200 ease-in-out
					{disabled ? 'opacity-50' : ''}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="3"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			{/if}
		</div>
	</label>
	<span
		class="absolute -bottom-[4px] -right-[4px]
		rounded-lg opacity-100
		transition-all duration-300 ease-in-out
        {disabled
			? '-translate-x-[2px] -translate-y-[2px] saturate-50'
			: ' group-hover:-translate-x-[2px] group-hover:-translate-y-[2px] '}
        "
		style=" 
		background: linear-gradient(to bottom right, {variant === 'destructive'
			? '#762A2A, #EB5454'
			: '#602A76, #DC3092, #F58823'});
		width: calc(100% );
		height: calc(100% );
		"
	>
	</span>
	<span
		class="absolute -left-[1px] -top-[1px] rounded-lg opacity-100
        {disabled ? 'saturate-50 ' : ' '}
        "
		style=" 
		background: linear-gradient(to bottom right, {variant === 'destructive'
			? '#762A2A, #EB5454'
			: '#602A76, #DC3092, #F58823'});
		width: calc(100% + 2px);
		height: calc(100% + 2px);
		"
	>
	</span>
</div>
