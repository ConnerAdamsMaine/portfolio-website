import type { RequestHandler } from './$types';
import { createTrackingEvent } from '$lib/server/db';

const PIXEL_BASE64 = 'R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

export const GET: RequestHandler = async (event) => {
	const url = event.url;
	const name = url.searchParams.get('event') ?? url.searchParams.get('name');
	const pathValue = url.searchParams.get('path') ?? url.searchParams.get('page');
	const referrer = event.request.headers.get('referer');
	const userAgent = event.request.headers.get('user-agent');
	const payload = url.searchParams.get('payload');

	try {
		createTrackingEvent(
			'pixel',
			name,
			pathValue,
			referrer,
			userAgent,
			event.getClientAddress(),
			payload
		);
	} catch {
		// Ignore tracking failures.
	}

	const buffer = Buffer.from(PIXEL_BASE64, 'base64');
	return new Response(buffer, {
		headers: {
			'Content-Type': 'image/gif',
			'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
			Pragma: 'no-cache',
			Expires: '0',
			'Access-Control-Allow-Origin': '*'
		}
	});
};
