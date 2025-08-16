<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Separator } from '$lib/components/ui/separator';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Tooltip from '$lib/components/ui/tooltip';

	const lightSwatches = [
		'light-50',
		'light-100',
		'light-200',
		'light-300',
		'light-400',
		'light-500',
		'light-600',
		'light-700',
		'light-800',
		'light-900',
		'light-950'
	];
</script>

<div class="container py-8">
	<h1 class="mb-8 font-display text-xl">Theme Components</h1>

	<div class="grid gap-8">
		<!-- Color Swatches Section -->
		<section>
			<h2 class="mb-4 font-display text-2xl">Theme Colors</h2>

			<div class="grid grid-cols-12 gap-4">
				{#each lightSwatches as swatch, i}
					<div
						class="flex h-20 w-full items-end justify-center rounded-xl border p-1 text-xs shadow-sm"
						style="
            background-color: hsl(var(--{swatch}));
            color : hsl(var(--{lightSwatches[lightSwatches.length - i]}));
            "
					>
						--{swatch}
					</div>
				{/each}
			</div>

			<div class="grid gap-6">
				<!-- Base Colors -->
				<div>
					<h3 class="mb-3 font-display text-lg">Base Colors</h3>
					<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
						<div class="space-y-1">
							<div class="h-10 w-[100px] rounded-md border border-border bg-background"></div>
							<p class="text-xs">background</p>
						</div>
						<div class="space-y-1">
							<div
								class="h-10 w-[100px] rounded-md border border-foreground/20 bg-foreground"
							></div>
							<p class="text-xs">foreground</p>
						</div>
						<div class="space-y-1">
							<div class="h-10 w-[100px] rounded-md border border-border bg-muted"></div>
							<p class="text-xs">muted</p>
						</div>
						<div class="space-y-1">
							<div
								class="h-10 w-[100px] rounded-md border border-muted-foreground/20 bg-muted-foreground"
							></div>
							<p class="text-xs">muted-foreground</p>
						</div>
					</div>
				</div>

				<!-- Primary Colors -->
				<div>
					<h3 class="mb-3 font-display text-lg">Primary Colors</h3>
					<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
						<div class="space-y-1">
							<div class="h-10 w-[100px] rounded-md border border-primary/20 bg-primary"></div>
							<p class="text-xs">primary</p>
						</div>
						<div class="space-y-1">
							<div
								class="h-10 w-[100px] rounded-md border border-primary-foreground/20 bg-primary-foreground"
							></div>
							<p class="text-xs">primary-foreground</p>
						</div>
					</div>
				</div>

				<!-- Secondary Colors -->
				<div>
					<h3 class="mb-3 font-display text-lg">Secondary Colors</h3>
					<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
						<div class="space-y-1">
							<div class="h-10 w-[100px] rounded-md border border-border bg-secondary"></div>
							<p class="text-xs">secondary</p>
						</div>
						<div class="space-y-1">
							<div
								class="h-10 w-[100px] rounded-md border border-secondary-foreground/20 bg-secondary-foreground"
							></div>
							<p class="text-xs">secondary-foreground</p>
						</div>
					</div>
				</div>

				<!-- Accent Colors -->
				<div>
					<h3 class="mb-3 font-display text-lg">Accent Colors</h3>
					<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
						<div class="space-y-1">
							<div class="h-10 w-[100px] rounded-md border border-border bg-accent"></div>
							<p class="text-xs">accent</p>
						</div>
						<div class="space-y-1">
							<div
								class="h-10 w-[100px] rounded-md border border-accent-foreground/20 bg-accent-foreground"
							></div>
							<p class="text-xs">accent-foreground</p>
						</div>
					</div>
				</div>

				<!-- Destructive Colors -->
				<div>
					<h3 class="mb-3 font-display text-lg">Destructive Colors</h3>
					<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
						<div class="space-y-1">
							<div
								class="h-10 w-[100px] rounded-md border border-destructive/20 bg-destructive"
							></div>
							<p class="text-xs">destructive</p>
						</div>
						<div class="space-y-1">
							<div
								class="h-10 w-[100px] rounded-md border border-destructive-foreground/20 bg-destructive-foreground"
							></div>
							<p class="text-xs">destructive-foreground</p>
						</div>
					</div>
				</div>

				<!-- Border & Input Colors -->
				<div>
					<h3 class="mb-3 font-display text-lg">Border & Input Colors</h3>
					<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
						<div class="space-y-1">
							<div class="h-10 w-[100px] rounded-md border border-border/20 bg-border"></div>
							<p class="text-xs">border</p>
						</div>
						<div class="space-y-1">
							<div class="h-10 w-[100px] rounded-md border border-border bg-input"></div>
							<p class="text-xs">input</p>
						</div>
						<div class="space-y-1">
							<div class="h-10 w-[100px] rounded-md border border-ring/20 bg-ring"></div>
							<p class="text-xs">ring</p>
						</div>
					</div>
				</div>

				<!-- Card Colors -->
				<div>
					<h3 class="mb-3 font-display text-lg">Card Colors</h3>
					<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
						<div class="space-y-1">
							<div class="h-10 w-[100px] rounded-md border border-border bg-card"></div>
							<p class="text-xs">card</p>
						</div>
						<div class="space-y-1">
							<div
								class="h-10 w-[100px] rounded-md border border-card-foreground/20 bg-card-foreground"
							></div>
							<p class="text-xs">card-foreground</p>
						</div>
					</div>
				</div>

				<!-- Popover Colors -->
				<div>
					<h3 class="mb-3 font-display text-lg">Popover Colors</h3>
					<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
						<div class="space-y-1">
							<div class="h-10 w-[100px] rounded-md border border-border bg-popover"></div>
							<p class="text-xs">popover</p>
						</div>
						<div class="space-y-1">
							<div
								class="h-10 w-[100px] rounded-md border border-popover-foreground/20 bg-popover-foreground"
							></div>
							<p class="text-xs">popover-foreground</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Buttons Section -->
		<section>
			<h2 class="mb-4 font-display text-2xl">Buttons</h2>
			<div class="flex flex-wrap gap-4">
				<Button variant="default">Default</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="destructive">Destructive</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="link">Link</Button>
			</div>
		</section>

		<!-- Cards Section -->
		<section>
			<h2 class="mb-4 font-display text-2xl">Cards</h2>
			<div class="grid gap-4 md:grid-cols-2">
				<Card.Root>
					<Card.Header>
						<Card.Title>Card Title</Card.Title>
						<Card.Description>Card Description</Card.Description>
					</Card.Header>
					<Card.Content>
						<p>This is a sample card content that demonstrates the theme colors.</p>
					</Card.Content>
					<Card.Footer>
						<Button>Action</Button>
					</Card.Footer>
				</Card.Root>

				<Card.Root class="bg-secondary">
					<Card.Header>
						<Card.Title>Secondary Card</Card.Title>
						<Card.Description>With secondary background</Card.Description>
					</Card.Header>
					<Card.Content>
						<p>This card uses the secondary background color.</p>
					</Card.Content>
					<Card.Footer>
						<Button variant="secondary">Action</Button>
					</Card.Footer>
				</Card.Root>
			</div>
		</section>

		<!-- Form Elements Section -->
		<section>
			<h2 class="mb-4 font-display text-2xl">Form Elements</h2>
			<div class="grid gap-8 md:grid-cols-2">
				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="name">Name</Label>
						<Input id="name" placeholder="Enter your name" />
					</div>
					<div class="space-y-2">
						<Label for="bio">Bio</Label>
						<Textarea id="bio" placeholder="Tell us about yourself" />
					</div>
				</div>

				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="email">Email</Label>
						<Input id="email" type="email" placeholder="Enter your email" />
					</div>
					<div class="space-y-2">
						<Label for="message">Message</Label>
						<Textarea id="message" placeholder="Your message" />
					</div>
				</div>
			</div>
		</section>

		<!-- Tabs Section -->
		<section>
			<h2 class="mb-4 font-display text-2xl">Tabs</h2>
			<Tabs.Root value="account" class="w-full">
				<Tabs.List>
					<Tabs.Trigger value="account">Account</Tabs.Trigger>
					<Tabs.Trigger value="password">Password</Tabs.Trigger>
					<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="account">
					<Card.Root>
						<Card.Header>
							<Card.Title>Account</Card.Title>
							<Card.Description>Manage your account settings.</Card.Description>
						</Card.Header>
						<Card.Content>
							<p>Account content goes here.</p>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="password">
					<Card.Root>
						<Card.Header>
							<Card.Title>Password</Card.Title>
							<Card.Description>Change your password here.</Card.Description>
						</Card.Header>
						<Card.Content>
							<p>Password content goes here.</p>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="settings">
					<Card.Root>
						<Card.Header>
							<Card.Title>Settings</Card.Title>
							<Card.Description>Manage your app settings.</Card.Description>
						</Card.Header>
						<Card.Content>
							<p>Settings content goes here.</p>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>
			</Tabs.Root>
		</section>

		<!-- Avatar Section -->
		<section>
			<h2 class="mb-4 font-display text-2xl">Avatars</h2>
			<div class="flex gap-4">
				<Avatar>
					<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarImage src="https://github.com/radix-ui.png" alt="@radix-ui" />
					<AvatarFallback>RU</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarFallback>JD</AvatarFallback>
				</Avatar>
			</div>
		</section>

		<!-- Tooltips Section -->
		<section>
			<h2 class="mb-4 font-display text-2xl">Tooltips</h2>
			<Tooltip.Provider>
				<div class="flex gap-4">
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button variant="outline">Hover me</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>This is a tooltip</p>
						</Tooltip.Content>
					</Tooltip.Root>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button variant="outline">And me</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Another tooltip</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</div>
			</Tooltip.Provider>
		</section>

		<!-- Loading States Section -->
		<section>
			<h2 class="mb-4 font-display text-2xl">Loading States</h2>
			<div class="space-y-4">
				<Skeleton class="h-12 w-full" />
				<Skeleton class="h-12 w-3/4" />
				<Skeleton class="h-12 w-1/2" />
			</div>
		</section>
	</div>
</div>
