import type { PageServerLoad } from './$types';
import { getSiteSettings, getStackItems } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	return {
		siteSettings: getSiteSettings(),
		stackItems: getStackItems()
	};
};
