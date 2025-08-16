<script lang="ts">
	import UserProfileSection from './UserProfileSection.svelte';

	interface IPagePreviewClassicProps {
		profileData: any;
		focusOn: 'profile' | 'cover' | 'widgets';
	}

	let { profileData, focusOn }: IPagePreviewClassicProps = $props();
</script>

<!-- Classic Mode - Matching Public Layout -->
<div class="flex flex-col items-center justify-center gap-4 bg-background p-2">
	<!-- User Details Section - Matching public layout -->
	<UserProfileSection {profileData} mode="classic" />

	<!-- Classic Board Content - Matching public layout -->
	<div class=" flex w-full flex-col items-center justify-center">
		<div class="relative flex w-full flex-col">
			<!-- Preview Links - Matching public link styling -->
			<div class="space-y-4">
				<!-- Standalone Link Example -->
				<div
					class="group relative flex items-start gap-4 rounded-xl border border-border border-primary/20 bg-card bg-gradient-to-r from-primary/5 to-transparent p-4 shadow-sm transition-all duration-200 hover:shadow-md"
				>
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
						<svg
							class="h-4 w-4 text-muted-foreground"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							/>
						</svg>
					</div>
					<div class="flex-grow space-y-1">
						<h4 class="text-base font-semibold text-foreground">Your Link Title</h4>
						<span class="text-sm text-muted-foreground">https://example.com</span>
					</div>
				</div>

				<!-- Collection Example -->
				<div class="rounded-xl border border-primary/20 bg-card p-4 shadow-sm">
					<div class="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
						<div class="flex items-center gap-3">
							<h3 class="text-lg font-semibold text-foreground">Link Collection</h3>
						</div>
					</div>
					<div class="space-y-3">
						<div
							class="group relative flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md"
						>
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
								<svg
									class="h-4 w-4 text-muted-foreground"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
									/>
								</svg>
							</div>
							<div class="flex-grow space-y-1">
								<h4 class="text-base font-semibold text-foreground">Collection Link 1</h4>
								<span class="text-sm text-muted-foreground">https://example.com/1</span>
							</div>
						</div>
						<div
							class="group relative flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md"
						>
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
								<svg
									class="h-4 w-4 text-muted-foreground"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
									/>
								</svg>
							</div>
							<div class="flex-grow space-y-1">
								<h4 class="text-base font-semibold text-foreground">Collection Link 2</h4>
								<span class="text-sm text-muted-foreground">https://example.com/2</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
