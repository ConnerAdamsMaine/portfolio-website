import type { PageServerLoad } from './$types';
import { getApprovedTestimonials } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	return {
		testimonials: getApprovedTestimonials()
	};
};
