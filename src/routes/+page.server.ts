import type { PageServerLoad } from './$types';
import { getFeaturedWork, getSiteSettings, getStackItems } from '$lib/server/dataStore';
import { getOrSetCached } from '$lib/server/cache';

export const load: PageServerLoad = async () => {
	return getOrSetCached('page:home', 20, async () => ({
		siteSettings: await getSiteSettings(),
		featuredWork: await getFeaturedWork(),
		stackItems: await getStackItems()
	}));
};
