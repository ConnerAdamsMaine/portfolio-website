import type { PageServerLoad } from './$types';
import { getPublishedPosts, getSiteSettings } from '$lib/server/dataStore';
import { getOrSetCached } from '$lib/server/cache';

export const load: PageServerLoad = async () => {
	return getOrSetCached('page:blog', 20, async () => ({
		siteSettings: await getSiteSettings(),
		blogPosts: await getPublishedPosts()
	}));
};
