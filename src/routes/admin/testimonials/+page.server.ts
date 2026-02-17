import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { getTestimonials, updateTestimonialApproval, deleteTestimonial } from '$lib/server/dataStore';
import { requireAdminCached } from '$lib/server/auth';
import { getCsrfToken, validateCsrfToken } from '$lib/server/csrf';

const parseNumber = (value: FormDataEntryValue | null, fallback = 0) => {
	if (typeof value !== 'string') return fallback;
	const parsed = Number(value);
	return Number.isNaN(parsed) ? fallback : parsed;
};

export const load: PageServerLoad = async (event) => {
	await requireAdminCached(event);
	return {
		testimonials: await getTestimonials(),
		csrfToken: getCsrfToken(event)
	};
};

export const actions: Actions = {
	approve: async (event) => {
		await requireAdminCached(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'approve', message: 'Invalid CSRF token.' });
		}
		const id = parseNumber(data.get('id'), -1);
		if (id <= 0) {
			return fail(400, { action: 'approve', message: 'Invalid testimonial.' });
		}
		await updateTestimonialApproval(id, 1);
		return { success: true, message: 'Testimonial approved.', action: 'approve', itemId: id };
	},
	unapprove: async (event) => {
		await requireAdminCached(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'unapprove', message: 'Invalid CSRF token.' });
		}
		const id = parseNumber(data.get('id'), -1);
		if (id <= 0) {
			return fail(400, { action: 'unapprove', message: 'Invalid testimonial.' });
		}
		await updateTestimonialApproval(id, 0);
		return { success: true, message: 'Testimonial moved to pending.', action: 'unapprove', itemId: id };
	},
	delete: async (event) => {
		await requireAdminCached(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'delete', message: 'Invalid CSRF token.' });
		}
		const id = parseNumber(data.get('id'), -1);
		if (id <= 0) {
			return fail(400, { action: 'delete', message: 'Invalid testimonial.' });
		}
		await deleteTestimonial(id);
		return { success: true, message: 'Testimonial deleted.', action: 'delete', itemId: id };
	}
};
