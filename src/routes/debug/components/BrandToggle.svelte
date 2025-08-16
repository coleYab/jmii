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

<div class="group relative flex rounded-full">
	<label class="relative z-20 cursor-pointer">
		<input type="checkbox" bind:checked {disabled} {onchange} {name} {id} class="sr-only" />
		<div
			class="relative flex h-6 w-11 items-center rounded-full
			bg-background backdrop-blur-lg transition-all duration-300
			ease-in-out hover:bg-background/95
		{variant === 'destructive' ? 'bg-[#ffd4d4]' : ''}

			{disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
			{className}"
		>
			<!-- Toggle circle -->
			<div
				class="absolute h-4 w-4 rounded-full bg-foreground transition-all duration-300 ease-in-out
				{checked ? 'translate-x-6' : 'translate-x-1'}
				{variant === 'destructive' ? 'bg-[#c44848]' : 'bg-primary'}
				{disabled ? 'opacity-50' : ''}"
			></div>
		</div>
	</label>
	<span
		class="absolute -bottom-[4px] -right-[4px]
		rounded-2xl opacity-100
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
		class="absolute -left-[1px] -top-[1px] rounded-[17px] opacity-100
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
