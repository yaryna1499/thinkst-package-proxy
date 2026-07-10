import { describe, expect, it } from 'vitest';
import { evaluateProxyAuth, extractProxyToken } from '../src/auth';

const TOKEN = 'test-proxy-token';
const ORIGIN = 'https://proxy.example.com';
const LOCAL_ORIGIN = 'http://example.com';

describe('extractProxyToken', () => {
	it('reads npm bearer tokens', () => {
		expect(extractProxyToken(`Bearer ${TOKEN}`)).toBe(TOKEN);
	});

	it('reads basic-auth passwords', () => {
		const authorization = `Basic ${Buffer.from(`developer:${TOKEN}`).toString('base64')}`;
		expect(extractProxyToken(authorization)).toBe(TOKEN);
	});

	it('returns null when authorization is missing', () => {
		expect(extractProxyToken(null)).toBeNull();
	});
});

describe('evaluateProxyAuth', () => {
	it('allows local example.com requests without a token', () => {
		expect(
			evaluateProxyAuth(LOCAL_ORIGIN, 'NpmFiles', null, TOKEN, true),
		).toBe('allow');
	});

	it('rejects org metadata requests without a token when the secret is configured', () => {
		expect(
			evaluateProxyAuth(ORIGIN, 'NpmMetadata', null, TOKEN, true),
		).toBe('unauthorized');
	});

	it('rejects org tarball requests without a token when the secret is configured', () => {
		expect(
			evaluateProxyAuth(ORIGIN, 'NpmFiles', null, TOKEN, true),
		).toBe('unauthorized');
	});

	it('allows org requests with a matching bearer token', () => {
		expect(
			evaluateProxyAuth(ORIGIN, 'NpmFiles', `Bearer ${TOKEN}`, TOKEN, true),
		).toBe('allow');
	});

	it('rejects org requests with the wrong token', () => {
		expect(
			evaluateProxyAuth(ORIGIN, 'NpmMetadata', 'Bearer wrong-token', TOKEN, true),
		).toBe('unauthorized');
	});

	it('keeps legacy behavior when the secret is not configured', () => {
		expect(
			evaluateProxyAuth(ORIGIN, 'NpmMetadata', null, undefined, true),
		).toBe('legacy_missing_header');
		expect(
			evaluateProxyAuth(ORIGIN, 'NpmFiles', null, undefined, true),
		).toBe('allow');
	});
});
