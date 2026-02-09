import type { PageServerLoad } from './$types';
import { getFeaturedWork, getSiteSettings, getStackItems } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	return {
		siteSettings: getSiteSettings(),
		featuredWork: getFeaturedWork(),
		stackItems: getStackItems()
	};
};
