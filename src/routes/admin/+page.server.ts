import type { Actions, PageServerLoad } from './$types';
import { requireAdmin, clearAdminSession } from '$lib/server/auth';
import { getCsrfToken, validateCsrfToken } from '$lib/server/csrf';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return {
		csrfToken: getCsrfToken(event)
	};
};

export const actions: Actions = {
	logout: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { message: 'Invalid CSRF token.' });
		}
		clearAdminSession(event);
		throw redirect(303, '/admin/login');
	}
};
