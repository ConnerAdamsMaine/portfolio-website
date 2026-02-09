import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import crypto from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';

const SESSION_COOKIE = 'admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

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
};

export const clearAdminSession = (event: RequestEvent) => {
	event.cookies.delete(SESSION_COOKIE, { path: '/' });
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

export const ADMIN_SESSION_COOKIE = SESSION_COOKIE;
