<script lang="ts">
	interface Props {
		children: import('svelte').Snippet;
		onclick?: () => void;
		class?: string;
		disabled?: boolean;
		variant?: 'default' | 'icon' | 'destructive' | 'colorful';
	}

	let {
		children,
		onclick,
		class: className = '',
		disabled = false,
		variant = 'default'
	}: Props = $props();
</script>

<div class="group relative flex rounded-2xl">
	<button
		{onclick}
		{disabled}
		class="relative z-20
		inline-flex flex-row items-center justify-center gap-2 rounded-2xl
		bg-background backdrop-blur-lg transition-all duration-300
		ease-in-out hover:bg-background/95 disabled:cursor-not-allowed

		{variant === "destructive" ? 'bg-[#ffd4d4]' : ''}
		{variant === 'icon' ? 'px-2 py-2' : 'px-4 py-2'}
		{className}"
	>
		{@render children()}
	</button>
	<span
		class="absolute -bottom-[4px] -right-[4px]
		rounded-2xl opacity-100
		transition-all duration-300 ease-in-out
        {disabled
			? '-translate-x-[2px] -translate-y-[2px] saturate-50'
			: ' group-hover:-translate-x-[2px] group-hover:-translate-y-[2px] '}
        "
		style=" 
		background: linear-gradient(to bottom right, {variant === 'destructive' ? '#762A2A, #EB5454' : '#602A76, #DC3092, #F58823'});
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
		background: linear-gradient(to bottom right, {variant === 'destructive' ? '#762A2A, #EB5454' : '#602A76, #DC3092, #F58823'});
		width: calc(100% + 2px);
		height: calc(100% + 2px);
		"
	>
	</span>
</div>
