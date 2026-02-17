import type { PageServerLoad } from './$types';
import { getFeaturedWork, getSiteSettings, getWorkItems } from '$lib/server/dataStore';
import { getOrSetCached } from '$lib/server/cache';

export const load: PageServerLoad = async () => {
	return getOrSetCached('page:work', 20, async () => ({
		siteSettings: await getSiteSettings(),
		workItems: await getWorkItems(),
		featuredWork: await getFeaturedWork()
	}));
};
