import type { PageServerLoad } from './$types';
import { getPublicAssets } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	return {
		assets: getPublicAssets()
	};
};
