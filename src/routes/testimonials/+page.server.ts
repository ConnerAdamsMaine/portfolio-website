import type { PageServerLoad } from './$types';
import { getApprovedTestimonials } from '$lib/server/dataStore';

export const load: PageServerLoad = async () => {
	return {
		testimonials: await getApprovedTestimonials()
	};
};
