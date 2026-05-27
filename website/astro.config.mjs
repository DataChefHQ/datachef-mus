// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://mus.datachef.co',
	integrations: [
		starlight({
			title: 'MUS',
			description: 'Contextual feedback toolbar for React apps — voice recording, thumbs, and Slack support exactly where it matters.',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/DataChefHQ/datachef-mus' },
				{ icon: 'npm', label: 'npm', href: 'https://www.npmjs.com/package/@datachefhq/mus' },
			],
			logo: {
				light: './src/assets/logo-light.svg',
				dark: './src/assets/logo-dark.svg',
				replacesTitle: false,
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
						{ label: 'Customizing Actions', slug: 'guides/actions' },
						{ label: 'Message Formatting', slug: 'guides/formatting' },
						{ label: 'CLI (mus init)', slug: 'guides/cli' },
						{ label: 'Troubleshooting', slug: 'guides/troubleshooting' },
					],
				},
				{ label: 'Migration (v0.x → v1.0)', slug: 'migration' },
			],
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
