import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { getTestimonials, updateTestimonialApproval, deleteTestimonial } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';
import { getCsrfToken, validateCsrfToken } from '$lib/server/csrf';

const parseNumber = (value: FormDataEntryValue | null, fallback = 0) => {
	if (typeof value !== 'string') return fallback;
	const parsed = Number(value);
	return Number.isNaN(parsed) ? fallback : parsed;
};

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return {
		testimonials: getTestimonials(),
		csrfToken: getCsrfToken(event)
	};
};

export const actions: Actions = {
	approve: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'approve', message: 'Invalid CSRF token.' });
		}
		const id = parseNumber(data.get('id'), -1);
		if (id <= 0) {
			return fail(400, { action: 'approve', message: 'Invalid testimonial.' });
		}
		updateTestimonialApproval(id, 1);
		return { success: true, message: 'Testimonial approved.', action: 'approve', itemId: id };
	},
	unapprove: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'unapprove', message: 'Invalid CSRF token.' });
		}
		const id = parseNumber(data.get('id'), -1);
		if (id <= 0) {
			return fail(400, { action: 'unapprove', message: 'Invalid testimonial.' });
		}
		updateTestimonialApproval(id, 0);
		return { success: true, message: 'Testimonial moved to pending.', action: 'unapprove', itemId: id };
	},
	delete: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'delete', message: 'Invalid CSRF token.' });
		}
		const id = parseNumber(data.get('id'), -1);
		if (id <= 0) {
			return fail(400, { action: 'delete', message: 'Invalid testimonial.' });
		}
		deleteTestimonial(id);
		return { success: true, message: 'Testimonial deleted.', action: 'delete', itemId: id };
	}
};
