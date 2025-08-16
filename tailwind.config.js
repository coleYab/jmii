import { fontFamily } from "tailwindcss/defaultTheme";
import tailwindcssAnimate from "tailwindcss-animate";
import plugin from 'tailwindcss/plugin'



/** @type {import('tailwindcss').Config} */
const config = {
	content: ["./src/**/*.{html,js,svelte,ts}"],
	darkMode: "selector",
	// safelist: ["dark"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px"
			}
		},
		extend: {
			fontFamily: {
				sans: [...fontFamily.sans],
				// Sets the font-display, font-content, and font-handwriting
				'display': ['var(--font-display)', 'serif'],
				'content': ['var(--font-content)', 'sans-serif'],
				'handwriting': ['var(--font-handwriting)', 'cursive'],
			},
			fontWeight: {
				// Sets the weights for the fonts
				'display': ['var(--font-display-weight)',],
				'content': ['var(--font-content-weight)',],
				'handwriting': ['var(--font-handwriting-weight)',],
			},
			fontSize: {
				// Defines extra font sizes 
				'xs': '0.56rem',
				'sm': '0.75rem',
				'base': '1rem',
				'lg': '1.33rem',
				'xl': '1.78rem',
				'2xl': '2.37rem',
				'3xl': '3.16rem',
				'4xl': '4.21rem',
				'5xl': '5.61rem',
				'6xl': '7.48rem',
				'7xl': '9.97rem',
			},
			colors: {

				border: "hsl(var(--border) / <alpha-value>)",
				input: "hsl(var(--input) / <alpha-value>)",
				ring: "hsl(var(--ring) / <alpha-value>)",
				background: "hsl(var(--background) / <alpha-value>)",
				foreground: "hsl(var(--foreground) / <alpha-value>)",

				primary: {
					DEFAULT: "hsl(var(--primary) / <alpha-value>)",
					foreground: "hsl(var(--primary-foreground) / <alpha-value>)"
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
					foreground: "hsl(var(--secondary-foreground) / <alpha-value>)"
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
					foreground: "hsl(var(--destructive-foreground) / <alpha-value>)"
				},
				muted: {
					DEFAULT: "hsl(var(--muted) / <alpha-value>)",
					foreground: "hsl(var(--muted-foreground) / <alpha-value>)"
				},
				accent: {
					DEFAULT: "hsl(var(--accent) / <alpha-value>)",
					foreground: "hsl(var(--accent-foreground) / <alpha-value>)"
				},
				popover: {
					DEFAULT: "hsl(var(--popover) / <alpha-value>)",
					foreground: "hsl(var(--popover-foreground) / <alpha-value>)"
				},
				card: {
					DEFAULT: "hsl(var(--card) / <alpha-value>)",
					foreground: "hsl(var(--card-foreground) / <alpha-value>)"
				},
				sidebar: {
					DEFAULT: "hsl(var(--sidebar-background))",
					foreground: "hsl(var(--sidebar-foreground))",
					primary: "hsl(var(--sidebar-primary))",
					"primary-foreground": "hsl(var(--sidebar-primary-foreground))",
					accent: "hsl(var(--sidebar-accent))",
					"accent-foreground": "hsl(var(--sidebar-accent-foreground))",
					border: "hsl(var(--sidebar-border))",
					ring: "hsl(var(--sidebar-ring))",
				},
			},
			borderRadius: {
				sm: "0.25rem", // 4px
				DEFAULT: "0.5rem", // 8px - Added a default
				md: "0.375rem", // 6px - Kept md smaller than default
				lg: "0.5rem", // 8px - Same as default
				xl: "0.75rem", // 12px
				"2xl": "1rem", // 16px
				"3xl": "1.5rem", // 24px
				full: "9999px", // For pills/circles
			},

			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--bits-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--bits-accordion-content-height)" },
					to: { height: "0" },
				},
				"caret-blink": {
					"0%,70%,100%": { opacity: "1" },
					"20%,50%": { opacity: "0" },
				},
			},
			themeVariables: {
				default: {
					// Defines the fonts in use by font-display, font-content, and font-handwriting
					'font-display': 'Lexend',
					'font-content': 'Lexend',
					'font-handwriting': 'Pacifico',

					light: {
						'font-display-weight': '500',
						'font-content-weight': '400',
						'font-handwriting-weight': '400',
					},
					dark: {
						'font-display-weight': '500',
						'font-content-weight': '400',
						'font-handwriting-weight': '400',

					},
				},

				playful: {
					'font-display': 'Fredoka',
					'font-content': 'Lexend',
					'font-handwriting': 'Pacifico',

					light: {
						'background': '#FFFFFF',
						'font-display-weight': '400',
						'font-content-weight': '400',
						'font-handwriting-weight': '400',

					},
					dark: {
						'background': '#2C3E50',
						'font-display-weight': '400',
						'font-content-weight': '400',
						'font-handwriting-weight': '400',
					},
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"caret-blink": "caret-blink 1.25s ease-out infinite",
			},
		},
	},
	plugins: [tailwindcssAnimate, require('tailwind-scrollbar-hide'),

		plugin(function ({ addBase, theme }) {
			addBase({
				':root': {
					'--background': theme('themeVariables.default.light.background'),

					'--font-display': theme('themeVariables.default.font-display'),
					'--font-content': theme('themeVariables.default.font-content'),
					'--font-handwriting': theme('themeVariables.default.font-handwriting'),

					'--font-display-weight': theme('themeVariables.default.light.font-display-weight'),
					'--font-content-weight': theme('themeVariables.default.light.font-content-weight'),
					'--font-handwriting-weight': theme('themeVariables.default.light.font-handwriting-weight'),


				},
				'.dark': {
					'--background': theme('themeVariables.default.dark.background'),

					'--font-display': theme('themeVariables.default.font-display'),
					'--font-content': theme('themeVariables.default.font-content'),
					'--font-handwriting': theme('themeVariables.default.font-handwriting'),

					'--font-display-weight': theme('themeVariables.default.dark.font-display-weight'),
					'--font-content-weight': theme('themeVariables.default.dark.font-content-weight'),
					'--font-handwriting-weight': theme('themeVariables.default.dark.font-handwriting-weight'),

				},

			})

		})
	],
};

export default config;
