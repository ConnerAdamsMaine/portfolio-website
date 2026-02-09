import type { Handle } from '@sveltejs/kit';
import { getSiteSettings } from '$lib/server/db';

const shouldBypassMaintenance = (pathname: string) =>
	pathname.startsWith('/admin') || pathname === '/maintenance';

const statusOverride = (pathname: string) => {
	if (pathname === '/403') return 403;
	if (pathname === '/404') return 404;
	if (pathname === '/500') return 500;
	return null;
};

export const handle: Handle = async ({ event, resolve }) => {
	const settings = getSiteSettings();
	const pathname = event.url.pathname;

	if (settings.maintenanceEnabled === 1 && !shouldBypassMaintenance(pathname)) {
		return new Response(null, {
			status: 307,
			headers: {
				location: '/maintenance'
			}
		});
	}

	const response = await resolve(event);
	const override = statusOverride(pathname);
	if (override) {
		return new Response(response.body, {
			status: override,
			headers: response.headers
		});
	}

	return response;
};
