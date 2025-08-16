import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltePhosphorOptimize } from 'phosphor-svelte/vite';

export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	// Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [sveltePhosphorOptimize(), devtoolsJson(), sveltekit()],
		test: {
			include: ['src/**/*.{test,spec}.{js,ts}']
		},
		define: {
			'import.meta.env.BETTER_AUTH_URL': JSON.stringify(env.BETTER_AUTH_URL)
		},
		clearScreen: false,
		server: {
			host: true,
			port: 5173
		},
        preview: {
            allowedHosts: ["jmii.onrender.com"],
        },
		optimizeDeps: {
			include: [
				'phosphor-svelte',
				'clsx',
				'bits-ui',
				'better-auth/svelte',
				'better-auth/client/plugins',
				'lucide-svelte',
				'@lucide/svelte',
				'svelte-sonner',
				'@wabosh/navigation-loader',
				'@internationalized/date',
				'tailwind-variants',
				'tailwind-merge',
				'uploadthing/client',
				'svelte-easy-crop',
				'better-auth/svelte-kit',
				'chalk',
				'dotenv',
				'better-auth/plugins',
				'mongoose'
			]
		}
	};
});
