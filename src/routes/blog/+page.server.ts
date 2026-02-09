import type { PageServerLoad } from './$types';
import { getPublishedPosts, getSiteSettings } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	return {
		siteSettings: getSiteSettings(),
		blogPosts: getPublishedPosts()
	};
};
