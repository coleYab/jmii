import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-node'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({

        }),
        csrf: {
            checkOrigin: false,
        },
		alias: {
			"$lib": "src/lib",
			"$lib/*": "src/lib/*",

			"$src": "src/",
			"$src/*": "src/*",

			"$stores": "src/stores",
			"$stores/*": "src/stores/*",

			"$utils": "src/utils",
			"$utils/*": "src/utils/*",

			"$components": "src/lib/components",
			"$components/*": "src/lib/components/*",

			"$constants": "src/lib/constants",
			"$constants/*": "src/lib/constants/*",

			"$debug": "src/routes/debug",
			"$debug/*": "src/routes/debug/*"
		}
	}
};

export default config;
