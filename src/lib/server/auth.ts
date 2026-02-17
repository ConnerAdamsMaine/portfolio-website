import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import crypto from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';
import { getRedisClient, withRedisPrefix } from '$lib/server/redis';

const SESSION_COOKIE = 'admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;
const INVALID_SESSION_CACHE_SECONDS = 60;

const safeEqual = (a: string, b: string) => {
	const aBuf = Buffer.from(a);
	const bBuf = Buffer.from(b);
	if (aBuf.length !== bBuf.length) return false;
	return crypto.timingSafeEqual(aBuf, bBuf);
};

const getSessionVersion = () => {
	const version = env.ADMIN_SESSION_VERSION?.trim();
	return version && version.length > 0 ? version : '1';
};

const getAdminCredentials = () => {
	const email = env.ADMIN_EMAIL;
	const password = env.ADMIN_PASSWORD;
	if (!email || !password) {
		throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required for admin login.');
	}
	return {
		email: email.trim().toLowerCase(),
		password
	};
};

export const verifyAdminCredentials = (email: string, password: string) => {
	const admin = getAdminCredentials();
	const emailMatch = safeEqual(email.trim().toLowerCase(), admin.email);
	const passwordMatch = safeEqual(password, admin.password);
	return emailMatch && passwordMatch;
};

const getSessionSecret = () => {
	const secret = env.ADMIN_SESSION_SECRET;
	if (!secret) {
		throw new Error('ADMIN_SESSION_SECRET is required to sign admin sessions.');
	}
	return secret;
};

const sign = (payload: string, secret: string) =>
	crypto.createHmac('sha256', secret).update(payload).digest('base64url');

const getSessionSecretFingerprint = () =>
	crypto.createHash('sha256').update(getSessionSecret()).digest('hex').slice(0, 16);

const sessionCacheKey = (token: string) =>
	withRedisPrefix(
		`auth:admin:session:v${getSessionVersion()}:s${getSessionSecretFingerprint()}:${crypto
			.createHash('sha256')
			.update(token)
			.digest('hex')}`
	);

const getSessionIssuedAtMs = (token: string) => {
	const parts = token.split('.');
	if (parts.length !== 4) return null;
	const issuedAt = Number(parts[2]);
	if (!Number.isFinite(issuedAt)) return null;
	return issuedAt;
};

const getSessionTtlSeconds = (token: string) => {
	const issuedAtMs = getSessionIssuedAtMs(token);
	if (!issuedAtMs) return INVALID_SESSION_CACHE_SECONDS;
	const expiresAtMs = issuedAtMs + SESSION_MAX_AGE_SECONDS * 1000;
	const remainingMs = expiresAtMs - Date.now();
	return Math.max(1, Math.floor(remainingMs / 1000));
};

const cacheSessionDecision = async (token: string, isValid: boolean) => {
	const client = await getRedisClient();
	if (!client) return;
	try {
		await client.set(sessionCacheKey(token), isValid ? '1' : '0', {
			EX: isValid ? getSessionTtlSeconds(token) : INVALID_SESSION_CACHE_SECONDS
		});
	} catch {
		// No-op if Redis is unavailable.
	}
};

const clearSessionCache = async (token: string) => {
	const client = await getRedisClient();
	if (!client) return;
	try {
		await client.del(sessionCacheKey(token));
	} catch {
		// No-op if Redis is unavailable.
	}
};

export const createSessionToken = () => {
	const issuedAt = Date.now();
	const version = getSessionVersion();
	const payload = `admin.${version}.${issuedAt}`;
	const signature = sign(payload, getSessionSecret());
	return `${payload}.${signature}`;
};

export const verifySessionToken = (token: string) => {
	try {
		const parts = token.split('.');
		if (parts.length !== 4) return false;
		const [scope, version, issuedAtRaw, signature] = parts;
		if (scope !== 'admin') return false;
		if (version !== getSessionVersion()) return false;
		const issuedAt = Number(issuedAtRaw);
		if (!Number.isFinite(issuedAt)) return false;

		const payload = `${scope}.${version}.${issuedAtRaw}`;
		const expectedSignature = sign(payload, getSessionSecret());
		if (!safeEqual(signature, expectedSignature)) return false;

		const ageSeconds = (Date.now() - issuedAt) / 1000;
		if (ageSeconds > SESSION_MAX_AGE_SECONDS) return false;

		return true;
	} catch {
		return false;
	}
};

export const setAdminSession = (event: RequestEvent) => {
	const token = createSessionToken();
	event.cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev,
		maxAge: SESSION_MAX_AGE_SECONDS
	});
	void cacheSessionDecision(token, true);
};

export const clearAdminSession = (event: RequestEvent) => {
	const token = event.cookies.get(SESSION_COOKIE);
	event.cookies.delete(SESSION_COOKIE, { path: '/' });
	if (token) {
		void clearSessionCache(token);
	}
};

export const isAdminAuthenticated = (event: RequestEvent) => {
	const token = event.cookies.get(SESSION_COOKIE);
	if (!token) return false;
	return verifySessionToken(token);
};

export const requireAdmin = (event: RequestEvent) => {
	if (!isAdminAuthenticated(event)) {
		throw redirect(303, '/admin/login');
	}
};

export const isAdminAuthenticatedCached = async (event: RequestEvent) => {
	const token = event.cookies.get(SESSION_COOKIE);
	if (!token) return false;

	const client = await getRedisClient();
	if (client) {
		try {
			const cached = await client.get(sessionCacheKey(token));
			if (cached === '1') return true;
			if (cached === '0') return false;
		} catch {
			// Fall back to local verification.
		}
	}

	const valid = verifySessionToken(token);
	await cacheSessionDecision(token, valid);
	return valid;
};

export const requireAdminCached = async (event: RequestEvent) => {
	if (!(await isAdminAuthenticatedCached(event))) {
		throw redirect(303, '/admin/login');
	}
};

export const ADMIN_SESSION_COOKIE = SESSION_COOKIE;
