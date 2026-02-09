import type { PageServerLoad } from './$types';
import { getFeaturedWork, getSiteSettings, getWorkItems } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	return {
		siteSettings: getSiteSettings(),
		workItems: getWorkItems(),
		featuredWork: getFeaturedWork()
	};
};
