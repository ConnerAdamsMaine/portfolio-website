import type { LayoutServerLoad } from './$types';
import { getFooterLinks, getSiteSettings } from '$lib/server/dataStore';
import { getOrSetCached } from '$lib/server/cache';

export const load: LayoutServerLoad = async () => {
	return getOrSetCached('layout:global', 20, async () => ({
		siteSettings: await getSiteSettings(),
		footerLinks: await getFooterLinks(),
		currentYear: new Date().getFullYear()
	}));
};
