export function extractProxyToken(authorization: string | null): string | null {
	if (!authorization) {
		return null;
	}

	const spaceIdx = authorization.indexOf(' ');
	if (spaceIdx === -1) {
		return null;
	}

	const scheme = authorization.slice(0, spaceIdx).toLowerCase();
	const value = authorization.slice(spaceIdx + 1).trim();
	if (!value) {
		return null;
	}

	if (scheme === 'bearer') {
		return value;
	}

	if (scheme === 'basic') {
		try {
			const credentials = Buffer.from(value, 'base64').toString().split(':');
			return credentials[1] || null;
		} catch {
			return null;
		}
	}

	return null;
}

export function usesOrgHostname(origin: string): boolean {
	return origin.split('.').length >= 3;
}

export function isLegacyAuthExempt(reqType: string): boolean {
	return reqType === 'CargoFiles' || reqType === 'NpmFiles' || reqType === 'PypiFiles' || reqType === 'ApprovePackage';
}

export function isStrictAuthExempt(reqType: string): boolean {
	return reqType === 'ApprovePackage';
}

export type ProxyAuthDecision = 'allow' | 'unauthorized' | 'legacy_missing_header';

export function evaluateProxyAuth(
	origin: string,
	reqType: string,
	authorization: string | null,
	expectedToken: string | undefined,
	requireTokenAuth: boolean,
): ProxyAuthDecision {
	if (!requireTokenAuth || !usesOrgHostname(origin) || isStrictAuthExempt(reqType)) {
		return 'allow';
	}

	if (expectedToken) {
		return extractProxyToken(authorization) === expectedToken ? 'allow' : 'unauthorized';
	}

	if (!authorization && !isLegacyAuthExempt(reqType)) {
		return 'legacy_missing_header';
	}

	return 'allow';
}
