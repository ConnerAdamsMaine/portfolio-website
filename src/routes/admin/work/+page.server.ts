import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
	getSiteSettings,
	updateSiteSettings,
	getWorkItems,
	createWorkItem,
	updateWorkItem,
	deleteWorkItem
} from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';
import { getCsrfToken, validateCsrfToken } from '$lib/server/csrf';

const MAX_LENGTHS = {
	title: 120,
	description: 500,
	longDescription: 1500,
	highlights: 600,
	role: 80,
	tech: 80,
	link: 2048
};

const parseNumber = (value: FormDataEntryValue | null, fallback = 0) => {
	if (typeof value !== 'string') return fallback;
	const parsed = Number(value);
	return Number.isNaN(parsed) ? fallback : parsed;
};

const parseText = (value: FormDataEntryValue | null) => {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
};

const parseCheckbox = (data: FormData, name: string) =>
	data.getAll(name).some((value) => value === '1') ? 1 : 0;

const isSafeUrl = (value: string) => {
	if (value.startsWith('/') || value.startsWith('#')) return true;
	try {
		const url = new URL(value);
		return ['http:', 'https:', 'mailto:'].includes(url.protocol);
	} catch {
		return false;
	}
};

const ensureMaxLength = (value: string, max: number, label: string) =>
	value.length > max ? `${label} must be ${max} characters or fewer.` : null;

const ensureOptionalMaxLength = (value: string | null, max: number, label: string) =>
	value ? ensureMaxLength(value, max, label) : null;

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return {
		siteSettings: getSiteSettings(),
		workItems: getWorkItems(),
		csrfToken: getCsrfToken(event)
	};
};

export const actions: Actions = {
	updateWorkSection: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'updateWorkSection', message: 'Invalid CSRF token.' });
		}
		const current = getSiteSettings();
		const { id: _id, ...rest } = current;
		updateSiteSettings({
			...rest,
			workTitle: String(data.get('workTitle') ?? '').trim(),
			workIntro: String(data.get('workIntro') ?? '').trim()
		});
		return { success: true, message: 'Work section saved.', action: 'updateWorkSection' };
	},
	createWork: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'createWork', message: 'Invalid CSRF token.' });
		}

		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const longDescription = parseText(data.get('longDescription'));
		const highlights = parseText(data.get('highlights'));
		const role = parseText(data.get('role'));
		const tech = parseText(data.get('tech'));
		const linkRaw = parseText(data.get('link'));
		const errors: Record<string, string> = {};

		if (!title) errors.title = 'Title is required.';
		if (!description) errors.description = 'Description is required.';
		const titleError = ensureMaxLength(title, MAX_LENGTHS.title, 'Title');
		if (titleError) errors.title = titleError;
		const descError = ensureMaxLength(description, MAX_LENGTHS.description, 'Description');
		if (descError) errors.description = descError;
		const longError = ensureOptionalMaxLength(longDescription, MAX_LENGTHS.longDescription, 'Long description');
		if (longError) errors.longDescription = longError;
		const highlightError = ensureOptionalMaxLength(highlights, MAX_LENGTHS.highlights, 'Highlights');
		if (highlightError) errors.highlights = highlightError;
		const roleError = ensureOptionalMaxLength(role, MAX_LENGTHS.role, 'Role');
		if (roleError) errors.role = roleError;
		const techError = ensureOptionalMaxLength(tech, MAX_LENGTHS.tech, 'Tech');
		if (techError) errors.tech = techError;
		if (linkRaw && !isSafeUrl(linkRaw)) {
			errors.link = 'Link must be http(s), mailto, or a relative path.';
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, { action: 'createWork', message: 'Check the highlighted fields.', fieldErrors: errors });
		}

		createWorkItem(
			title,
			description,
			longDescription,
			highlights,
			role,
			tech,
			linkRaw,
			parseCheckbox(data, 'featured'),
			parseNumber(data.get('sort'))
		);

		return { success: true, message: 'Work item added.', action: 'createWork' };
	},
	updateWork: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'updateWork', message: 'Invalid CSRF token.' });
		}

		const id = parseNumber(data.get('id'), -1);
		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const longDescription = parseText(data.get('longDescription'));
		const highlights = parseText(data.get('highlights'));
		const role = parseText(data.get('role'));
		const tech = parseText(data.get('tech'));
		const linkRaw = parseText(data.get('link'));
		const errors: Record<string, string> = {};

		if (id <= 0) errors.id = 'Invalid item.';
		if (!title) errors.title = 'Title is required.';
		if (!description) errors.description = 'Description is required.';
		const titleError = ensureMaxLength(title, MAX_LENGTHS.title, 'Title');
		if (titleError) errors.title = titleError;
		const descError = ensureMaxLength(description, MAX_LENGTHS.description, 'Description');
		if (descError) errors.description = descError;
		const longError = ensureOptionalMaxLength(longDescription, MAX_LENGTHS.longDescription, 'Long description');
		if (longError) errors.longDescription = longError;
		const highlightError = ensureOptionalMaxLength(highlights, MAX_LENGTHS.highlights, 'Highlights');
		if (highlightError) errors.highlights = highlightError;
		const roleError = ensureOptionalMaxLength(role, MAX_LENGTHS.role, 'Role');
		if (roleError) errors.role = roleError;
		const techError = ensureOptionalMaxLength(tech, MAX_LENGTHS.tech, 'Tech');
		if (techError) errors.tech = techError;
		if (linkRaw && !isSafeUrl(linkRaw)) {
			errors.link = 'Link must be http(s), mailto, or a relative path.';
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, {
				action: 'updateWork',
				message: 'Check the highlighted fields.',
				fieldErrors: errors,
				itemId: id
			});
		}

		updateWorkItem(
			id,
			title,
			description,
			longDescription,
			highlights,
			role,
			tech,
			linkRaw,
			parseCheckbox(data, 'featured'),
			parseNumber(data.get('sort'))
		);

		return { success: true, message: 'Work item updated.', action: 'updateWork', itemId: id };
	},
	deleteWork: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'deleteWork', message: 'Invalid CSRF token.' });
		}
		const id = parseNumber(data.get('id'), -1);
		if (id <= 0) {
			return fail(400, { action: 'deleteWork', message: 'Invalid item.' });
		}
		deleteWorkItem(id);
		return { success: true, message: 'Work item deleted.', action: 'deleteWork', itemId: id };
	}
};
