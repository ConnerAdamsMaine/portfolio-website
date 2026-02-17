import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { getSiteSettings, updateSiteSettings } from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';
import { getCsrfToken, validateCsrfToken } from '$lib/server/csrf';

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const isSafeUrl = (value: string) => {
	if (value.startsWith('/') || value.startsWith('#')) return true;
	try {
		const url = new URL(value);
		return ['http:', 'https:', 'mailto:'].includes(url.protocol);
	} catch {
		return false;
	}
};

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return {
		siteSettings: getSiteSettings(),
		csrfToken: getCsrfToken(event)
	};
};

export const actions: Actions = {
	updateContact: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { message: 'Invalid CSRF token.' });
		}

		const contactEmail = String(data.get('contactEmail') ?? '').trim();
		if (contactEmail && !isValidEmail(contactEmail)) {
			return fail(400, { message: 'Please provide a valid email.' });
		}
		const githubUrl = String(data.get('githubUrl') ?? '').trim();
		if (githubUrl && !isSafeUrl(githubUrl)) {
			return fail(400, { message: 'GitHub URL must be http(s), mailto, or a relative path.' });
		}

			const current = getSiteSettings();
			const { id: _id, ...rest } = current;
			void _id;

			updateSiteSettings({
			...rest,
			contactTitle: String(data.get('contactTitle') ?? '').trim(),
			contactBody: String(data.get('contactBody') ?? '').trim(),
			contactEmail,
			githubUrl
		});

		return { success: true, message: 'Contact settings saved.' };
	}
};
