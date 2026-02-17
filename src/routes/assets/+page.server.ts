import type { PageServerLoad } from './$types';
import { getPublicAssets } from '$lib/server/dataStore';

export const load: PageServerLoad = async () => {
	return {
		assets: await getPublicAssets()
	};
};
