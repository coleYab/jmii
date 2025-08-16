<script lang="ts">
	import type { ITheme } from '$src/models/Theme.model';
	import { Command } from 'phosphor-svelte';

	const { theme }: { theme: ITheme } = $props();
</script>

<div
	class="flex w-full flex-col gap-2 border border-dashed border-primary p-4"
	style="background-color: {theme.background}; color: {theme.foreground}"
>
	<a
		href="#0"
		target="_blank"
		rel="noopener noreferrer"
		class="group relative flex h-24 items-start gap-4 border p-4 transition-all duration-200"
		style="
            background-color: {theme.buttonBackground}; 
            color: {theme.buttonColor}; 
            border-color: {theme.stroke}; 
            border-width: 1px; 
            box-shadow: {theme.shadow.default};
            border-radius: {theme.buttonRounding}px;
        "
		onmouseover={(e) => {
			e.currentTarget.style.boxShadow = theme.shadow.hovered;
		}}
		onmouseout={(e) => (e.currentTarget.style.boxShadow = theme.shadow.default)}
		onfocus={(e) => {
			e.currentTarget.style.boxShadow = theme.shadow.hovered;
		}}
		onblur={(e) => (e.currentTarget.style.boxShadow = theme.shadow.default)}
		onmousedown={(e) => {
			e.currentTarget.style.boxShadow = theme.shadow.active;
		}}
		onmouseup={(e) => {
			e.currentTarget.style.boxShadow = theme.shadow.hovered;
		}}
		tabindex="0"
	>
		<div
			class="flex aspect-square h-full items-center justify-center"
			style="
            background-color: {theme.buttonColor}; 
            color: {theme.buttonBackground}; 
            border-radius: {theme.buttonRounding * 0.5}px;
        "
		>
			<Command size={24} weight="duotone" color="currentColor" />
		</div>
		<div class="flex-grow space-y-1">
			<h4 class="text-base font-semibold">Button</h4>
			<span class="text-sm">https://www.google.com</span>
		</div>
	</a>
</div>
