<script lang="ts">
	import { ArrowsVertical } from 'phosphor-svelte';

	interface Props {
		value?: string;
		placeholder?: string;
		class?: string;
		disabled?: boolean;
		required?: boolean;
		name?: string;
		id?: string;
		rows?: number;
		cols?: number;
		resizable?: boolean;
		minHeight?: number;
		maxHeight?: number;
		variant?: 'default' | 'destructive';
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
		onfocus?: (event: FocusEvent) => void;
		onblur?: (event: FocusEvent) => void;
	}

	let { 
		value = $bindable(''),
		placeholder = '',
		class: className = '',
		disabled = false,
		required = false,
		name,
		id,
		rows = 4,
		cols,
		resizable = true,
		minHeight = 80,
		maxHeight = 400,
		variant = 'default',
		oninput,
		onchange,
		onfocus,
		onblur
	}: Props = $props();

	let textareaElement: HTMLTextAreaElement;
	let containerElement: HTMLDivElement;
	let isDragging = $state(false);
	let startY = $state(0);
	let startHeight = $state(0);

	function handleResizeStart(event: MouseEvent) {
		if (disabled || !resizable) return;
		
		isDragging = true;
		startY = event.clientY;
		startHeight = textareaElement.offsetHeight;
		
		document.addEventListener('mousemove', handleResizeMove);
		document.addEventListener('mouseup', handleResizeEnd);
		event.preventDefault();
	}

	function handleResizeMove(event: MouseEvent) {
		if (!isDragging) return;
		
		const deltaY = event.clientY - startY;
		const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
		
		textareaElement.style.height = `${newHeight}px`;
	}

	function handleResizeEnd() {
		isDragging = false;
		document.removeEventListener('mousemove', handleResizeMove);
		document.removeEventListener('mouseup', handleResizeEnd);
	}
</script>

<div bind:this={containerElement} class="group relative flex rounded-2xl">
	<textarea
		bind:this={textareaElement}
		bind:value
		{placeholder}
		{disabled}
		{required}
		{name}
		{id}
		{rows}
		{cols}
		{oninput}
		{onchange}
		{onfocus}
		{onblur}
		class="relative z-20 
		flex rounded-2xl resize-none
		bg-background px-4 py-2 backdrop-blur-lg transition-all duration-300 
		ease-in-out hover:bg-background/95 focus:bg-background/95 focus:outline-none
		placeholder:text-muted-foreground disabled:cursor-not-allowed
		{variant === 'destructive' ? 'bg-[#ffd4d4]' : ''}
		{className}"
	></textarea>
	
	{#if resizable && !disabled}
		<div
			class="absolute bottom-0 right-0 z-30 cursor-s-resize p-2 opacity-50 hover:opacity-100 transition-opacity duration-200"
			onmousedown={handleResizeStart}
			role="button"
			tabindex="-1"
		>
			<ArrowsVertical />
		</div>
	{/if}
	
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