import type { PageServerLoad } from './$types';
import { getTrackingCounts, getTrackingEvents } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return {
		counts: getTrackingCounts(),
		events: getTrackingEvents(120)
	};
};
