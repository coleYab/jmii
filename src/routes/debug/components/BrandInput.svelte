<script lang="ts">
	interface Props {
		value?: string;
		placeholder?: string;
		type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
		class?: string;
		disabled?: boolean;
		required?: boolean;
		name?: string;
		id?: string;
		variant?: 'default' | 'destructive';
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
		onfocus?: (event: FocusEvent) => void;
		onblur?: (event: FocusEvent) => void;
	}

	let { 
		value = $bindable(''),
		placeholder = '',
		type = 'text',
		class: className = '',
		disabled = false,
		required = false,
		name,
		id,
		variant = 'default',
		oninput,
		onchange,
		onfocus,
		onblur
	}: Props = $props();
</script>

<div class="group relative flex rounded-2xl">
	<input
		bind:value
		{type}
		{placeholder}
		{disabled}
		{required}
		{name}
		{id}
		{oninput}
		{onchange}
		{onfocus}
		{onblur}
		class="relative z-20 
		inline-flex flex-row items-center justify-center gap-2 rounded-2xl 
		bg-background px-4 py-2 backdrop-blur-lg transition-all duration-300 
		ease-in-out hover:bg-background/95 focus:bg-background/95 focus:outline-none
		placeholder:text-muted-foreground disabled:cursor-not-allowed
		{variant === 'destructive' ? 'bg-[#ffd4d4]' : ''}
		{className}"
	/>
	<span
		class="absolute -bottom-[4px] -right-[4px]
		rounded-2xl opacity-100
		transition-all duration-300 ease-in-out
        {disabled
			? '-translate-x-[2px] -translate-y-[2px] saturate-50'
			: ' group-hover:-translate-x-[2px] group-hover:-translate-y-[2px] group-focus-within:-translate-x-[2px] group-focus-within:-translate-y-[2px] '}
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
