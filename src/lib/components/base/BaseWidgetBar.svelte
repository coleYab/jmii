<script module>
	interface Props {
		id: string;
		locked?: boolean;
		type: string;
		currentSize: { width: number; height: number };
		hasClickHandler?: boolean;
		boardElement?: HTMLElement | null;
		rows?: number;
		columns?: number;
		isMobile?: boolean;

		children?: Snippet;

		ondelete: () => void;
		onedit: () => void;
		onrefresh: () => void;
		onresize: (size: { width: number; height: number }) => void;
		onduplicate: () => void;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Trash, PencilLine, HandGrabbing, ArrowsClockwise } from 'phosphor-svelte';
	import { on } from 'svelte/events';

	import { drawerStore } from '$src/stores/drawerStore';

	import { innerWidth } from 'svelte/reactivity/window';
	import { dragStore } from '$src/stores/dragStore';
	import { BOARD_CONFIG, getResponsiveCellDimensions } from '$src/stores/board/board.config';
	import { boardStore } from '$src/stores/boardStore';
	import { getWidgetConfig } from '$src/utils/widgetRegistry';

	let {
		id,
		locked = false,
		type,
		currentSize,
		hasClickHandler = false,
		boardElement = null,
		rows = 10,
		columns = 4,
		isMobile = false,
		// children
		children,
		// functions
		ondelete,
		onedit,
		onrefresh,
		onresize,
		onduplicate
	}: Props = $props();

	let isMobileViewport = $derived(innerWidth.current && innerWidth.current < 768);

	let isHovered = $state(false);
	let isClicked = $state(false);
	let widgetBar = $state<HTMLDivElement | null>(null);
	let dragPosition = $state<{ targetRow: number; targetCol: number; isValid: boolean } | null>(
		null
	);
	let touchStartTime = $state<number>(0);
	let hasDraggedSinceTouch = $state<boolean>(false);
	let wasSelectedAtTouchStart = $state<boolean>(false);
	let widgetConfig = $derived(getWidgetConfig(type));
	// Validation function similar to DragDropManager
	function canPlaceWidget(
		widgetId: string,
		row: number,
		col: number,
		widgetSize: { width: number; height: number }
	): boolean {
		const currentBoard = boardStore.getCurrentBoardState(isMobile);

		for (let r = row; r < row + widgetSize.height; r++) {
			for (let c = col; c < col + Math.min(widgetSize.width, columns); c++) {
				if (
					r >= rows ||
					c >= columns ||
					(currentBoard[r][c] && currentBoard[r][c]?.id !== widgetId)
				) {
					return false;
				}
			}
		}
		return true;
	}

	// Action to handle non-passive touchmove
	function handleTouchMove(element: HTMLElement) {
		const cleanup = on(
			element,
			'touchmove',
			(e: TouchEvent) => {
				// Only allow dragging if this widget is already selected
				if ($dragStore.isSelected !== id) {
					return;
				}

				// Mark that dragging has occurred
				hasDraggedSinceTouch = true;

				// Stop bubbling so we can JUST move this widget and nothing else
				e.preventDefault();
				e.stopPropagation();

				const touch = e.touches[0];
				console.log('touchmove:', { x: touch.clientX, y: touch.clientY });

				// Calculate target row and col like DragDropManager does
				// Use the passed board element reference
				if (boardElement) {
					// Use responsive cell dimensions based on viewport width
					const viewportWidth = innerWidth.current || 1024; // Fallback to tablet size
					const responsive = getResponsiveCellDimensions(viewportWidth);
					const cellDimensions = {
						width: responsive.CELL_WIDTH,
						height: responsive.CELL_HEIGHT,
						gap: responsive.CELL_GAP
					};

					const rect = boardElement.getBoundingClientRect();
					const x = touch.clientX - rect.left;
					const y = touch.clientY - rect.top;

					const targetCol = Math.floor(x / (cellDimensions.width + cellDimensions.gap));
					const targetRow = Math.floor(y / (cellDimensions.height + cellDimensions.gap));

					// Validate placement
					const isValid = canPlaceWidget(id, targetRow, targetCol, currentSize);

					dragPosition = { targetRow, targetCol, isValid };

					console.log('BaseWidgetBar:: calculated position', {
						targetRow,
						targetCol,
						isValid,
						x,
						y,
						boardRect: rect
					});
				}
			},
			{ passive: false }
		);

		return {
			destroy: cleanup
		};
	}

	// Check if drawer is open
	let isDrawerOpen = $derived($drawerStore.show);

	function deleteWidget() {
		if (isDrawerOpen) return;
		ondelete();
	}

	function editWidget() {
		if (isDrawerOpen) return;
		onedit();
	}

	// function duplicateWidget() {
	// 	if (isDrawerOpen) return;
	// 	onduplicate();
	// }

	function resizeWidget(size: { width: number; height: number }) {
		onresize(size);
	}
</script>

<div
	bind:this={widgetBar}
	class="isolate h-full {hasClickHandler ? 'group relative' : ''}"
	role="button"
	tabindex="0"
	onmouseover={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	onblur={() => (isHovered = false)}
	onfocus={() => (isHovered = true)}
	onmousedown={() => (isClicked = true)}
	onmouseup={() => (isClicked = false)}
	ontouchstart={(e) => {
		e.preventDefault();
		e.stopPropagation();
		console.log('touchstart:', e);
		console.log(id);

		// Reset drag tracking and capture initial selection state
		touchStartTime = Date.now();
		hasDraggedSinceTouch = false;
		wasSelectedAtTouchStart = $dragStore.isSelected === id;

		// Selection happens immediately
		if ($dragStore.isSelected === id) {
			// Don't deselect immediately - wait for touchend to check if drag occurred
		} else {
			// Select immediately on touchstart
			$dragStore.isSelected = id;
		}

		isClicked = true;
	}}
	ontouchend={(e) => {
		console.log('touchend:', e);
		isClicked = false;

		const touchDuration = Date.now() - touchStartTime;

		// Handle widget drop if it was being dragged (only if dragPosition exists, meaning it was moved)
		if ($dragStore.isSelected === id && dragPosition && dragPosition.isValid) {
			console.log('BaseWidgetBar:: dropping widget', {
				widgetId: id,
				targetRow: dragPosition.targetRow,
				targetCol: dragPosition.targetCol,
				isValid: dragPosition.isValid
			});

			// Update widget position
			boardStore.updateWidgetPosition(id, dragPosition.targetRow, dragPosition.targetCol, isMobile);

			// Keep widget selected after successful drop
		} else if (wasSelectedAtTouchStart && !hasDraggedSinceTouch && touchDuration < 500) {
			// Only deselect if widget was ALREADY selected at touchstart AND it was a quick tap without dragging
			console.log(
				'BaseWidgetBar:: deselecting widget - quick tap without drag on already selected widget'
			);
			$dragStore.isSelected = null;
		}

		// Reset drag position and drag tracking
		dragPosition = null;
		hasDraggedSinceTouch = false;
		touchStartTime = 0;
		wasSelectedAtTouchStart = false;
	}}
	use:handleTouchMove
	ontouchcancel={(e) => {
		console.log('touchcancel:', e);
		isClicked = false;
	}}
>
	<!-- <div class="w-full h-full">
		<span>
			{isMobile ? 'mobile' : 'desktop'}
			{$dragStore.isSelected === id ? 'selected' : 'not selected'}
		</span>
		{@render children?.()} 
	</div> -->
	{#if !locked}
		{#if $dragStore.isSelected === id && isMobile}
			<!-- This component will be the draggable area on mobile  -->
			<div
				ontouchstart={(e) => {
					e.preventDefault();
					e.stopPropagation();
					deleteWidget();
				}}
				class="
	absolute -left-2 -top-2 z-[100] flex flex-row rounded-full border border-foreground/30 bg-background p-1 text-sm text-red-800 transition-all dark:bg-background"
			>
				<Trash color="currentColor" size={18} weight="duotone" />
			</div>
			<!-- This component will be the draggable area on mobile  -->
			<button
				ontouchstart={(e) => {
					editWidget();
					e.preventDefault();
					e.stopPropagation();
				}}
				class="
	absolute -right-2 -top-2 z-[100] flex flex-row rounded-full border border-foreground/30 bg-background p-1 text-sm transition-all dark:bg-background"
			>
				<PencilLine color="currentColor" size={18} weight="duotone" />
			</button>
			<!-- This component will be the draggable area on mobile  -->

			<div
				ontouchstart={(e) => {
					e.preventDefault();
					e.stopPropagation();
					console.log('Move touchstart:', e);
				}}
				class="
			

		absolute bottom-2 left-1/2 z-[100] flex
		-translate-x-1/2 justify-end gap-1
		rounded-md border border-primary/30
		bg-background p-1 text-sm transition-all ease-in-out"
			>
				{#if widgetConfig?.sizes}
					{#each widgetConfig.sizes as size}
						{@const isCurrentSize =
							currentSize.width === size.width && currentSize.height === size.height}
						{@const widthPx = size.width * 2}
						{@const heightPx = size.height * 2}
						<button
							aria-label={`${size.width}x${size.height}`}
							onclick={() => resizeWidget(size)}
							class:bg-foreground={isCurrentSize}
							class="flex h-6 w-6 flex-col items-center justify-center overflow-clip rounded-md transition-all hover:bg-sidebar-border"
						>
							<span
								class:border-foreground={!isCurrentSize}
								class:border-background={isCurrentSize}
								class:bg-foreground={isCurrentSize}
								class="flex flex-row rounded-[3px]
							border-2 border-foreground bg-foreground"
								style={`height: ${heightPx * 4}px; width: ${widthPx * 4}px;`}
							>
							</span>
						</button>
					{/each}
				{/if}
			</div>
		{:else if !isMobile}
			<div
				ontouchstart={(e) => {
					e.preventDefault();
					e.stopPropagation();
					console.log('Move touchstart:', e);
				}}
				class="
					{isHovered ? 'opacity-100' : 'opacity-0'}
					absolute left-2 top-2 z-[100]
					flex justify-end gap-1
					rounded-md border border-primary/30
					bg-background p-1 text-sm transition-all ease-in-out"
			>
				{#if widgetConfig?.sizes}
					{#each widgetConfig.sizes as size}
						{@const isCurrentSize =
							currentSize.width === size.width && currentSize.height === size.height}
						{@const widthPx = size.width * 2}
						{@const heightPx = size.height * 2}
						<button
							aria-label={`${size.width}x${size.height}`}
							onclick={() => resizeWidget(size)}
							class:bg-foreground={isCurrentSize}
							class="flex h-6 w-6 flex-col items-center justify-center overflow-clip rounded-md transition-all hover:bg-sidebar-border"
						>
							<span
								class:border-foreground={!isCurrentSize}
								class:border-background={isCurrentSize}
								class:bg-foreground={isCurrentSize}
								class="flex flex-row rounded-[3px] border-2 border-foreground bg-foreground"
								style={`height: ${heightPx * 4}px; width: ${widthPx * 4}px;`}
							>
							</span>
						</button>
					{/each}
				{/if}
			</div>
			<div
				class="
			{isHovered && !isDrawerOpen ? 'opacity-100' : 'opacity-0'}
			absolute bottom-2 right-2 z-[100] flex
			flex-row justify-end gap-1 rounded-lg border border-foreground/30 bg-background p-1 text-sm transition-all dark:bg-background"
			>
				<button class="transition-all hover:bg-sidebar-border" onclick={editWidget}>
					<PencilLine color="currentColor" size={18} weight="duotone" />
				</button>

				<button class="transition-all hover:bg-sidebar-border" onclick={onrefresh}>
					<ArrowsClockwise color="currentColor" size={18} weight="duotone" />
				</button>
				<button class="transition-all hover:bg-sidebar-border" onclick={deleteWidget}>
					<Trash color="currentColor" size={18} weight="duotone" />
				</button>
			</div>
		{/if}

		<!-- Top Bar -->
		<!-- <div
			class="
			{isHovered && !isDrawerOpen ? 'opacity-100' : 'opacity-0'}
			absolute bottom-2 right-2 z-[100] flex
			flex-row justify-end gap-1 rounded-lg border border-foreground/30 bg-background p-1 text-sm transition-all dark:bg-background"
		>
			<button class="transition-all hover:bg-sidebar-border" >
				<PencilLine color="currentColor" size={18} weight="duotone" />
			</button>
			<button class="transition-all hover:bg-sidebar-border" onclick={duplicateWidget}>
				<CopySimple color="currentColor" size={18} weight="duotone" />
			</button>
			<button class="transition-all hover:bg-sidebar-border" onclick={onrefresh}>
				<ArrowsClockwise color="currentColor" size={18} weight="duotone" />
			</button>
			<button class="transition-all hover:bg-sidebar-border" onclick={deleteWidget}>
				<Trash color="currentColor" size={18} weight="duotone" />
			</button>
		</div> -->
	{/if}

	<div class={hasClickHandler && !locked ? 'pointer-events-none relative z-20' : ''}>
		{@render children?.()}
	</div>

	{#if hasClickHandler}
		<span
			class="absolute -bottom-[4px] -right-[4px] -z-10
				rounded-xl opacity-100
				saturate-0 transition-all duration-300 ease-in-out group-hover:saturate-100
				{isClicked ? '-translate-x-[2px] -translate-y-[2px]' : ''}"
			style="background: linear-gradient(to bottom right, #602A76, #DC3092, #F58823);
				width: calc(100%);
				height: calc(100%);"
		></span>
		<span
			class="absolute -left-[1px] -top-[1px] -z-10 rounded-xl opacity-100 saturate-0 group-hover:saturate-100"
			style="background: linear-gradient(to bottom right, #602A76, #DC3092, #F58823);
				width: calc(100% + 2px);
				height: calc(100% + 2px);"
		></span>
	{/if}
</div>
