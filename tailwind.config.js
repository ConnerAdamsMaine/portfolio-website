/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
				mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
			},
			colors: {
				ink: {
					50: '#f3f4f8',
					100: '#e3e6f1',
					200: '#c0c7e0',
					300: '#9aa3c8',
					400: '#6f7aa7',
					500: '#4c547f',
					600: '#353a5f',
					700: '#252743',
					800: '#17192d',
					900: '#0b0c17'
				},
				signal: {
					100: '#ede7ff',
					300: '#c9b6ff',
					500: '#a47bff',
					700: '#7d3bff'
				},
				aurora: {
					200: '#8fb2ff',
					400: '#5b79ff',
					600: '#2f47ff'
				},
				night: {
					500: '#0a0a14',
					700: '#06060c',
					900: '#040407'
				}
			},
			boxShadow: {
				soft: '0 20px 60px -30px rgba(15, 13, 11, 0.7)',
				glow: '0 0 30px rgba(122, 162, 255, 0.25)'
			}
		}
	},
	plugins: []
};
