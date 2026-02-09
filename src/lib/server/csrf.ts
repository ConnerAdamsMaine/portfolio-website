import { dev } from '$app/environment';
import crypto from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';

const CSRF_COOKIE = 'csrf_token';
const CSRF_MAX_AGE_SECONDS = 60 * 60;

const generateToken = () => crypto.randomBytes(32).toString('base64url');

const createTokenValue = (issuedAt: number) => `${issuedAt}.${generateToken()}`;

const parseIssuedAt = (value: string) => {
	const parts = value.split('.');
	if (parts.length !== 2) return null;
	const issuedAt = Number(parts[0]);
	if (!Number.isFinite(issuedAt)) return null;
	return issuedAt;
};

const isExpired = (issuedAt: number) => Date.now() - issuedAt > CSRF_MAX_AGE_SECONDS * 1000;

const setCsrfCookie = (event: RequestEvent, value: string) => {
	event.cookies.set(CSRF_COOKIE, value, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev,
		maxAge: CSRF_MAX_AGE_SECONDS
	});
};

export const getCsrfToken = (event: RequestEvent) => {
	const existing = event.cookies.get(CSRF_COOKIE);
	if (existing) {
		const issuedAt = parseIssuedAt(existing);
		if (issuedAt && !isExpired(issuedAt)) {
			return existing;
		}
	}

	const token = createTokenValue(Date.now());
	setCsrfCookie(event, token);
	return token;
};

export const validateCsrfToken = (event: RequestEvent, formData: FormData) => {
	const token = event.cookies.get(CSRF_COOKIE);
	const provided = formData.get('csrfToken');
	if (!token || typeof provided !== 'string') return false;
	if (token !== provided) return false;
	const issuedAt = parseIssuedAt(token);
	if (!issuedAt || isExpired(issuedAt)) return false;

	// Rotate token after successful validation.
	const nextToken = createTokenValue(Date.now());
	setCsrfCookie(event, nextToken);
	return true;
};
