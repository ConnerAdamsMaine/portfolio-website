import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
	getFooterLinks,
	getSiteSettings,
	updateSiteSettings,
	createFooterLink,
	updateFooterLink,
	deleteFooterLink
} from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';
import { getCsrfToken, validateCsrfToken } from '$lib/server/csrf';

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

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return {
		siteSettings: getSiteSettings(),
		footerLinks: getFooterLinks(),
		csrfToken: getCsrfToken(event)
	};
};

export const actions: Actions = {
	updateFooterCopy: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'updateFooterCopy', message: 'Invalid CSRF token.' });
		}

		const footerCtaLabel = String(data.get('footerCtaLabel') ?? '').trim();
		const footerCtaHref = String(data.get('footerCtaHref') ?? '').trim();
		if ((footerCtaLabel && !footerCtaHref) || (!footerCtaLabel && footerCtaHref)) {
			return fail(400, {
				action: 'updateFooterCopy',
				message: 'CTA label and href must both be filled in.'
			});
		}
		if (footerCtaHref && !isSafeUrl(footerCtaHref)) {
			return fail(400, {
				action: 'updateFooterCopy',
				message: 'CTA href must be http(s), mailto, or a relative path.'
			});
		}

			const current = getSiteSettings();
			const { id: _id, ...rest } = current;
			void _id;
			updateSiteSettings({
			...rest,
			footerBadge: String(data.get('footerBadge') ?? '').trim(),
			footerHeadline: String(data.get('footerHeadline') ?? '').trim(),
			footerBody: String(data.get('footerBody') ?? '').trim(),
			footerCtaLabel,
			footerCtaHref
		});

		return { success: true, message: 'Footer copy saved.', action: 'updateFooterCopy' };
	},
	createFooterLink: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'createFooterLink', message: 'Invalid CSRF token.' });
		}

		const section = String(data.get('section') ?? '').trim();
		const label = String(data.get('label') ?? '').trim();
		const href = parseText(data.get('href'));
		const errors: Record<string, string> = {};

		if (!section) errors.section = 'Section is required.';
		if (!label) errors.label = 'Label is required.';
		if (href && !isSafeUrl(href)) errors.href = 'Href must be http(s), mailto, or a relative path.';

		if (Object.keys(errors).length > 0) {
			return fail(400, { action: 'createFooterLink', message: 'Check the highlighted fields.', fieldErrors: errors });
		}

		createFooterLink(section, label, href, parseCheckbox(data, 'external'), parseNumber(data.get('sort')));
		return { success: true, message: 'Footer link added.', action: 'createFooterLink' };
	},
	updateFooterLink: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'updateFooterLink', message: 'Invalid CSRF token.' });
		}

		const id = parseNumber(data.get('id'), -1);
		const section = String(data.get('section') ?? '').trim();
		const label = String(data.get('label') ?? '').trim();
		const href = parseText(data.get('href'));
		const errors: Record<string, string> = {};

		if (id <= 0) errors.id = 'Invalid link.';
		if (!section) errors.section = 'Section is required.';
		if (!label) errors.label = 'Label is required.';
		if (href && !isSafeUrl(href)) errors.href = 'Href must be http(s), mailto, or a relative path.';

		if (Object.keys(errors).length > 0) {
			return fail(400, { action: 'updateFooterLink', message: 'Check the highlighted fields.', fieldErrors: errors, itemId: id });
		}

		updateFooterLink(id, section, label, href, parseCheckbox(data, 'external'), parseNumber(data.get('sort')));
		return { success: true, message: 'Footer link updated.', action: 'updateFooterLink', itemId: id };
	},
	deleteFooterLink: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'deleteFooterLink', message: 'Invalid CSRF token.' });
		}
		const id = parseNumber(data.get('id'), -1);
		if (id <= 0) {
			return fail(400, { action: 'deleteFooterLink', message: 'Invalid link.' });
		}
		deleteFooterLink(id);
		return { success: true, message: 'Footer link deleted.', action: 'deleteFooterLink', itemId: id };
	}
};
