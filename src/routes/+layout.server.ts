import type { LayoutServerLoad } from './$types';
import { getFooterLinks, getSiteSettings } from '$lib/server/db';

export const load: LayoutServerLoad = async () => {
	return {
		siteSettings: getSiteSettings(),
		footerLinks: getFooterLinks(),
		currentYear: new Date().getFullYear()
	};
};
