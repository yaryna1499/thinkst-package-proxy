import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

const TOKEN = 'test-proxy-token';

const workersBase = {
	wrangler: { configPath: './wrangler.jsonc' },
	main: './src/index.ts',
};

export default defineConfig({
	test: {
		projects: [
			{
				plugins: [
					cloudflareTest({
						...workersBase,
						miniflare: {
							// Override .dev.vars so legacy integration tests stay token-free.
							bindings: { TOKEN: '' },
						},
					}),
				],
				test: {
					name: 'integration',
					include: ['test/**/*.spec.js'],
					exclude: ['test/auth.integration.spec.js', 'test/auth.unit.spec.js'],
				},
			},
			{
				plugins: [
					cloudflareTest({
						...workersBase,
						miniflare: {
							bindings: { TOKEN },
						},
					}),
				],
				test: {
					name: 'auth-integration',
					include: ['test/auth.integration.spec.js'],
				},
			},
			{
				test: {
					name: 'auth-unit',
					include: ['test/auth.unit.spec.js'],
				},
			},
		],
	},
});
