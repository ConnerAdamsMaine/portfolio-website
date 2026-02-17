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
	updateSite: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { message: 'Invalid CSRF token.' });
		}

			const current = getSiteSettings();
			const { id: _id, ...rest } = current;
			void _id;

			updateSiteSettings({
			...rest,
			heroHeadline: String(data.get('heroHeadline') ?? '').trim(),
			heroSubheadline: String(data.get('heroSubheadline') ?? '').trim(),
			heroNoteTitle: String(data.get('heroNoteTitle') ?? '').trim(),
			heroNoteBody: String(data.get('heroNoteBody') ?? '').trim(),
			heroHighlightsTitle: String(data.get('heroHighlightsTitle') ?? '').trim(),
			heroHighlightsBody: String(data.get('heroHighlightsBody') ?? '').trim(),
			focusHeadline: String(data.get('focusHeadline') ?? '').trim(),
			focusBody: String(data.get('focusBody') ?? '').trim()
		});

		return { success: true, message: 'Site settings saved.' };
	}
};
