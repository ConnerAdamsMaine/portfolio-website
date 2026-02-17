import type { PageServerLoad } from './$types';
import { getTrackingCounts, getTrackingEvents } from '$lib/server/telemetryStore';
import { requireAdminCached } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
	await requireAdminCached(event);
	const [counts, events] = await Promise.all([getTrackingCounts(), getTrackingEvents(120)]);
	return {
		counts,
		events
	};
};
