<script lang="ts" module>
	export const defaultProps = {
		file: {
			accept: ['image/*'],
			url: ''
		},
		image: '',
		href: '',
		altText: 'Button Image'
	} as const;

	export type ButtonProps = typeof defaultProps;
</script>

<script lang="ts">
	import BaseWidget from '$lib/components/base/BaseWidget.svelte';
	import { LockKeyhole } from 'lucide-svelte';
	import { Link } from 'phosphor-svelte';

	interface Props {
		size: { width: number; height: number };
		specificProps: Record<string, any>;
	}

	let { size, specificProps }: Props = $props();

	let p = $derived({
		...defaultProps,
		...specificProps
	});

	function extractYouTubeVideoId(url: string): string | null {
		try {
			const normalized = url?.startsWith('http') ? url : `https://${url}`;
			const u = new URL(normalized);
			const host = u.hostname.replace('www.', '');
			if (host === 'youtu.be') {
				return u.pathname.slice(1).split('/')[0] || null;
			}
			if (host.endsWith('youtube.com')) {
				if (u.pathname === '/watch') {
					return u.searchParams.get('v');
				}
				const m = u.pathname.match(/\/(embed|shorts)\/([^\/?#]+)/);
				if (m) return m[2];
			}
			return null;
		} catch {
			return null;
		}
	}

	function getYouTubeThumbnail(url: string): string | null {
		const id = extractYouTubeVideoId(url);
		return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
	}

	interface LogoMapping {
		name: string;
		checker: (link: string) => boolean;
		logo: string;
	}

	const logos: LogoMapping[] = [
		{
			name: 'Telegram',
			checker: (link) => /(?:t\.me|telegram\.me|telegram\.org)/i.test(link),
			logo: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg'
		},
		{
			name: 'Instagram',
			checker: (link) => /(?:instagram\.com|instagr\.am)/i.test(link),
			logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg'
		},
		{
			name: 'Discord',
			checker: (link) => /(?:discord\.gg|discord(app)?\.com)/i.test(link),
			logo: 'https://upload.wikimedia.org/wikipedia/fr/4/4f/Discord_Logo_sans_texte.svg'
		},
		{
			name: 'Facebook',
			checker: (link) => /(?:facebook\.com|fb\.com)/i.test(link),
			logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/2023_Facebook_icon.svg'
		},
		{
			name: 'Linkedin',
			checker: (link) => /(?:linkedin\.com)/i.test(link),
			logo: 'https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg'
		},
		{
			name: 'Tiktok',
			checker: (link) => /(?:tiktok\.com)/i.test(link),
			logo: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Ionicons_logo-tiktok.svg'
		},
		{
			name: 'Spotify',
			checker: (link) => {
				return /^(https?:\/\/open\.spotify\.com\/|spotify:)/.test(link);
			},
			logo: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg'
		}
	];

	// const tumbnailMapping = {
	// 	"Telegram": "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
	// 	"Instagram": "",
	// 	"Spotify": "",
	// 	"Facebook": "",
	// 	"Discord": "",
	// 	"TikTok": "",
	// }

	function getButtonTumbnail(url: string): string | null {
		if (!url) return null;
		const ytTmbnail = getYouTubeThumbnail(url);
		if (ytTmbnail) return ytTmbnail;

		for (const logo of logos) {
			if (logo.checker(url)) {
				console.log(`Button Tumbnail Mapper:: mapping ${url} to ${logo.name}'s logo`);
				return logo.logo;
			}
		}

		return null;
	}

	let displayImage = $derived.by(() => {
		return p.file.url || p.image || (p.href ? getButtonTumbnail(p.href) : '') || '';
	});
</script>

<BaseWidget
	{size}
	type="Button"
	onclick={() => {
		window.open(p.href, '_blank');
	}}
>
	{#if !displayImage}
		<div class="flex h-full w-full flex-col items-center justify-center gap-2 bg-background">
			<Link size={24} />
			<span>
				{p.href}
			</span>
		</div>
	{:else}
		<img src={displayImage} alt={p.altText} class="h-full w-full" style="object-fit: cover;" />
	{/if}
</BaseWidget>
