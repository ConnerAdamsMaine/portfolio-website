import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { getSiteSettings, updateSiteSettings } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';
import { getCsrfToken, validateCsrfToken } from '$lib/server/csrf';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return {
		siteSettings: getSiteSettings(),
		csrfToken: getCsrfToken(event)
	};
};

export const actions: Actions = {
	updateAbout: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { message: 'Invalid CSRF token.' });
		}

		const current = getSiteSettings();
		const { id: _id, ...rest } = current;

		updateSiteSettings({
			...rest,
			aboutHeadline: String(data.get('aboutHeadline') ?? '').trim(),
			aboutBody: String(data.get('aboutBody') ?? '').trim()
		});

		return { success: true, message: 'About content saved.' };
	}
};
