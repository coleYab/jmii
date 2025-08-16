<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	// Predefined amounts
	const predefinedAmounts = [50, 100, 200, 500, 1000, 10000];

	interface AmountStepProps {
		tipAmount: number;
	}
	let { tipAmount = $bindable() }: AmountStepProps = $props();

	let customAmount = $state('');
	if (tipAmount === 0) {
		customAmount = '';
		tipAmount = 5;
	}

	const currencyFormatter = (amount: number) => {
		// changes 1000000 to 1M, 10000 to 10k
		if (amount >= 1000000) {
			const millions = amount / 1000000;
			return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
		}
		if (amount >= 1000) {
			const thousands = amount / 1000;
			return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
		}
		return amount.toString();
	};
</script>

<div class="flex flex-col gap-4 sm:gap-6">
	<div class="flex flex-col gap-2 sm:gap-3">
		<!-- Predefined amounts -->
		<div class="flex w-full justify-center">
			<Label for="amount-preset" class="w-full text-center text-xs sm:text-sm"
				>Choose from one of these amounts (ETB)</Label
			>
		</div>
		<div class="grid grid-cols-3 gap-2 sm:gap-3">
			{#each predefinedAmounts as amount}
				<Button
					variant={'ghost'}
					class="aspect-square h-16 w-full rounded-lg border-b-2 border-l border-r-2 border-t border-primary
				
				{tipAmount === amount
						? 'bg-primary/90 text-background hover:bg-primary/80 hover:text-background'
						: ''} text-sm sm:text-base md:text-lg"
					onclick={() => {
						tipAmount = amount;
						customAmount = '';
					}}
				>
					{currencyFormatter(amount)} <span class="text-xs sm:text-sm">ETB</span>
				</Button>
			{/each}
		</div>
	</div>

	<!-- Custom amount -->
	<div class="flex flex-col items-center justify-center gap-2 sm:gap-3">
		<div class="flex w-full justify-center">
			<Label for="custom-amount" class="w-full text-center text-xs sm:text-sm">Custom amount (ETB)</Label>
		</div>
		<Input
			oninput={(e) => {
				const value = (e.target as HTMLInputElement).value;
				if (value === '' || /^[0-9.]*$/.test(value)) {
					customAmount = value;
				}
				if (
					customAmount !== '' &&
					!isNaN(parseFloat(customAmount)) &&
					parseFloat(customAmount) > 0
				) {
					tipAmount = parseInt(customAmount);
				}
			}}
			id="custom-amount"
			type="number"
			class="h-16 w-full rounded-lg border-b-2 border-l border-r-2 border-t border-primary p-3 sm:p-4 text-sm sm:text-base"
			placeholder="Enter custom amount"
			bind:value={customAmount}
			min="1"
		/>
	</div>
</div>
