import type { PageServerLoad } from './$types';
import { getSiteSettings, getStackItems } from '$lib/server/dataStore';
import { getOrSetCached } from '$lib/server/cache';

export const load: PageServerLoad = async () => {
	return getOrSetCached('page:about', 20, async () => ({
		siteSettings: await getSiteSettings(),
		stackItems: await getStackItems()
	}));
};
