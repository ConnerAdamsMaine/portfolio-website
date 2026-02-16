import type { RequestHandler } from './$types';
import { createTrackingEvent } from '$lib/server/db';

const parsePayload = async (request: Request) => {
	const contentType = request.headers.get('content-type') ?? '';
	if (contentType.includes('application/json')) {
		const json = (await request.json()) as Record<string, unknown>;
		return { data: json, raw: JSON.stringify(json) };
	}
	if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
		const form = await request.formData();
		const entries = Object.fromEntries(form.entries()) as Record<string, unknown>;
		return { data: entries, raw: JSON.stringify(entries) };
	}
	return { data: {} as Record<string, unknown>, raw: null };
};

export const OPTIONS: RequestHandler = () =>
	new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});

export const POST: RequestHandler = async (event) => {
	const { data, raw } = await parsePayload(event.request);
	const name = typeof data.event === 'string' ? data.event : typeof data.name === 'string' ? data.name : null;
	const type = typeof data.type === 'string' ? data.type : 'event';
	const pathValue = typeof data.path === 'string' ? data.path : null;
	const referrer = event.request.headers.get('referer');
	const userAgent = event.request.headers.get('user-agent');

	try {
		createTrackingEvent(
			type,
			name,
			pathValue,
			referrer,
			userAgent,
			event.getClientAddress(),
			raw
		);
	} catch {
		// Ignore tracking failures.
	}

	return new Response(JSON.stringify({ ok: true }), {
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*'
		}
	});
};
