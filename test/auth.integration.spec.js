import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

const TOKEN = 'test-proxy-token';
const ORG = 'http://some.example.com';

describe('Worker auth with TOKEN configured', () => {
	it('returns 401 on org hostname without credentials', async () => {
		const res = await exports.default.fetch(`${ORG}/`);
		expect(res.status).toBe(401);
		expect(res.headers.get('WWW-Authenticate')).toContain('Basic realm="pkgproxy"');
	});

	it('returns 401 on org npm metadata with wrong bearer token', async () => {
		const res = await exports.default.fetch(`${ORG}/sax`, {
			headers: {
				'user-agent': 'npm/11.0',
				authorization: 'Bearer wrong-token',
			},
		});
		expect(res.status).toBe(401);
	});

	it('returns 401 on org npm tarball without credentials', async () => {
		const res = await exports.default.fetch(`${ORG}/npmfiles/sax/-/sax-1.2.0.tgz`);
		expect(res.status).toBe(401);
	});

	it('allows org npm metadata with matching bearer token', async () => {
		const res = await exports.default.fetch(`${ORG}/sax`, {
			headers: {
				'user-agent': 'npm/11.0',
				authorization: `Bearer ${TOKEN}`,
			},
		});
		expect(res.status).toBe(200);
	});

	it('allows org npm metadata with matching basic auth password', async () => {
		const authorization = `Basic ${Buffer.from(`developer:${TOKEN}`).toString('base64')}`;
		const res = await exports.default.fetch(`${ORG}/sax`, {
			headers: {
				'user-agent': 'npm/11.0',
				authorization,
			},
		});
		expect(res.status).toBe(200);
	});

	it('allows example.com npm metadata without credentials when TOKEN is set', async () => {
		const res = await exports.default.fetch('http://example.com/sax', {
			headers: { 'user-agent': 'npm/11.0' },
		});
		expect(res.status).toBe(200);
	});
});
