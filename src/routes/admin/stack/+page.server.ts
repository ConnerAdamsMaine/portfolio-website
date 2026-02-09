import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { getSiteSettings, updateSiteSettings, getStackItems, createStackItem, updateStackItem, deleteStackItem } from '$lib/server/db';
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
		siteSettings: getSiteSettings(),
		stackItems: getStackItems(),
		csrfToken: getCsrfToken(event)
	};
};

export const actions: Actions = {
	updateStackSection: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'updateStackSection', message: 'Invalid CSRF token.' });
		}

		const current = getSiteSettings();
		const { id: _id, ...rest } = current;
		updateSiteSettings({
			...rest,
			stackTitle: String(data.get('stackTitle') ?? '').trim(),
			stackIntro: String(data.get('stackIntro') ?? '').trim()
		});

		return { success: true, message: 'Stack section saved.', action: 'updateStackSection' };
	},
	createStack: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'createStack', message: 'Invalid CSRF token.' });
		}

		const label = String(data.get('label') ?? '').trim();
		const detail = String(data.get('detail') ?? '').trim();
		if (!label) {
			return fail(400, { action: 'createStack', message: 'Label is required.', fieldErrors: { label: 'Label is required.' } });
		}

		createStackItem(label, detail || null, parseNumber(data.get('sort')));
		return { success: true, message: 'Stack item added.', action: 'createStack' };
	},
	updateStack: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'updateStack', message: 'Invalid CSRF token.' });
		}

		const id = parseNumber(data.get('id'), -1);
		const label = String(data.get('label') ?? '').trim();
		const detail = String(data.get('detail') ?? '').trim();
		if (id <= 0 || !label) {
			return fail(400, { action: 'updateStack', message: 'Label is required.', itemId: id, fieldErrors: { label: 'Label is required.' } });
		}

		updateStackItem(id, label, detail || null, parseNumber(data.get('sort')));
		return { success: true, message: 'Stack item updated.', action: 'updateStack', itemId: id };
	},
	deleteStack: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'deleteStack', message: 'Invalid CSRF token.' });
		}
		const id = parseNumber(data.get('id'), -1);
		if (id <= 0) {
			return fail(400, { action: 'deleteStack', message: 'Invalid item.' });
		}
		deleteStackItem(id);
		return { success: true, message: 'Stack item deleted.', action: 'deleteStack', itemId: id };
	}
};
