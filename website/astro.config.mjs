// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	site: 'https://mus.datachef.co',
	vite: {
		resolve: {
			alias: [
				// Point main entry directly at source TS — no dist rebuild needed for component changes
				{ find: '@datachef/mus', replacement: path.resolve(__dirname, '../src/index.ts') },
				// Resolve the package's internal @/ alias
				{ find: '@/', replacement: path.resolve(__dirname, '../src/') + '/' },
				// styles.css resolves via package exports to dist/mus.css (pre-compiled Tailwind)
			],
		},
	},
	integrations: [
		react(),
		starlight({
			title: 'MUS',
			description: 'Explainability and feedback, embedded exactly where AI output is served.',
			head: [
				// Open Graph
				{ tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
				{ tag: 'meta', attrs: { property: 'og:url', content: 'https://mus.datachef.co' } },
				{ tag: 'meta', attrs: { property: 'og:title', content: 'MUS — Explainability and feedback, embedded exactly where AI output is served' } },
				{ tag: 'meta', attrs: { property: 'og:description', content: 'When AI outputs need to be questioned, explained, or challenged, that should happen right there on the screen. Not in a form. Not in a meeting.' } },
				{ tag: 'meta', attrs: { property: 'og:image', content: 'https://mus.datachef.co/og-image.png' } },
				{ tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
				{ tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
				// Twitter card
				{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
				{ tag: 'meta', attrs: { name: 'twitter:title', content: 'MUS — Explainability and feedback, embedded exactly where AI output is served' } },
				{ tag: 'meta', attrs: { name: 'twitter:description', content: 'When AI outputs need to be questioned, explained, or challenged, that should happen right there on the screen.' } },
				{ tag: 'meta', attrs: { name: 'twitter:image', content: 'https://mus.datachef.co/og-image.png' } },
				// Theme color
				{ tag: 'meta', attrs: { name: 'theme-color', content: '#2d6a4f' } },
			],
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/DataChefHQ/datachef-mus' },
				{ icon: 'npm', label: 'npm', href: 'https://www.npmjs.com/package/@datachef/mus' },
			],
			logo: {
				light: './src/assets/logo-light.svg',
				dark: './src/assets/logo-dark.svg',
				replacesTitle: true,
			},
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'index' },
						{ label: 'Installation', slug: 'getting-started' },
						{ label: 'Configuration', slug: 'configuration' },
					],
				},
				{
					label: 'Server Setup',
					items: [
						{ label: 'Overview', slug: 'server/overview' },
						{ label: 'Next.js', slug: 'server/nextjs' },
						{ label: 'Express / Fastify / Hono', slug: 'server/express' },
						{ label: 'Vite SPA + Docker', slug: 'server/vite' },
					],
				},
				{
					label: 'Deployment',
					items: [
						{ label: 'Docker Compose', slug: 'deployment/docker' },
						{ label: 'nginx', slug: 'deployment/nginx' },
						{ label: 'Kubernetes', slug: 'deployment/kubernetes' },
					],
				},
				{
					label: 'Adapters',
					items: [
						{ label: 'Overview', slug: 'adapters/overview' },
						{ label: 'Slack', slug: 'adapters/slack' },
						{ label: 'Discord', slug: 'adapters/discord' },
						{ label: 'Microsoft Teams', slug: 'adapters/teams' },
						{ label: 'Webhook', slug: 'adapters/webhook' },
						{ label: 'Custom Adapters', slug: 'adapters/custom' },
					],
				},
				{
					label: 'User Resolvers',
					items: [
						{ label: 'Overview', slug: 'resolvers/overview' },
						{ label: 'Custom Resolvers', slug: 'resolvers/custom' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'MusConfig', slug: 'reference/config' },
						{ label: 'Event Types', slug: 'reference/events' },
						{ label: 'Package Exports', slug: 'reference/exports' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Theming & Icons', slug: 'guides/theming' },
						{ label: 'Customizing Actions', slug: 'guides/actions' },
						{ label: 'Message Formatting', slug: 'guides/formatting' },
						{ label: 'CLI (mus init)', slug: 'guides/cli' },
						{ label: 'Troubleshooting', slug: 'guides/troubleshooting' },
					],
				},
				{ label: 'Upgrade Guide', slug: 'migration' },
			],
			components: {
				Header: './src/components/Header.astro',
			},
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
