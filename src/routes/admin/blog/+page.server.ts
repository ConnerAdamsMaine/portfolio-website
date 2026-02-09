import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
	getSiteSettings,
	updateSiteSettings,
	getPosts,
	createPost,
	updatePost,
	deletePost
} from '$lib/server/db';
import { requireAdmin } from '$lib/server/auth';
import { getCsrfToken, validateCsrfToken } from '$lib/server/csrf';

const MAX_LENGTHS = {
	title: 120,
	excerpt: 300,
	content: 20000,
	tags: 200,
	slug: 120
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

const ensureMaxLength = (value: string, max: number, label: string) =>
	value.length > max ? `${label} must be ${max} characters or fewer.` : null;

const ensureOptionalMaxLength = (value: string | null, max: number, label: string) =>
	value ? ensureMaxLength(value, max, label) : null;

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return {
		siteSettings: getSiteSettings(),
		posts: getPosts(),
		csrfToken: getCsrfToken(event)
	};
};

export const actions: Actions = {
	updateBlogSection: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'updateBlogSection', message: 'Invalid CSRF token.' });
		}
		const current = getSiteSettings();
		const { id: _id, ...rest } = current;
		updateSiteSettings({
			...rest,
			blogTitle: String(data.get('blogTitle') ?? '').trim(),
			blogIntro: String(data.get('blogIntro') ?? '').trim()
		});
		return { success: true, message: 'Blog section saved.', action: 'updateBlogSection' };
	},
	createPost: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'createPost', message: 'Invalid CSRF token.' });
		}

		const title = String(data.get('title') ?? '').trim();
		const slug = parseText(data.get('slug'));
		const excerpt = parseText(data.get('excerpt'));
		const content = parseText(data.get('content'));
		const tags = parseText(data.get('tags'));
		const publishedAt = parseText(data.get('publishedAt'));
		const errors: Record<string, string> = {};

		if (!title) errors.title = 'Title is required.';
		const titleError = ensureMaxLength(title, MAX_LENGTHS.title, 'Title');
		if (titleError) errors.title = titleError;
		const slugError = ensureOptionalMaxLength(slug, MAX_LENGTHS.slug, 'Slug');
		if (slugError) errors.slug = slugError;
		const excerptError = ensureOptionalMaxLength(excerpt, MAX_LENGTHS.excerpt, 'Excerpt');
		if (excerptError) errors.excerpt = excerptError;
		const contentError = ensureOptionalMaxLength(content, MAX_LENGTHS.content, 'Content');
		if (contentError) errors.content = contentError;
		const tagsError = ensureOptionalMaxLength(tags, MAX_LENGTHS.tags, 'Tags');
		if (tagsError) errors.tags = tagsError;

		if (Object.keys(errors).length > 0) {
			return fail(400, { action: 'createPost', message: 'Check the highlighted fields.', fieldErrors: errors });
		}

		createPost(
			title,
			excerpt,
			content,
			tags,
			parseCheckbox(data, 'draft'),
			parseCheckbox(data, 'featured'),
			publishedAt,
			slug ?? undefined
		);

		return { success: true, message: 'Post added.', action: 'createPost' };
	},
	updatePost: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'updatePost', message: 'Invalid CSRF token.' });
		}

		const id = parseNumber(data.get('id'), -1);
		const title = String(data.get('title') ?? '').trim();
		const slug = parseText(data.get('slug'));
		const excerpt = parseText(data.get('excerpt'));
		const content = parseText(data.get('content'));
		const tags = parseText(data.get('tags'));
		const publishedAt = parseText(data.get('publishedAt'));
		const errors: Record<string, string> = {};

		if (id <= 0) errors.id = 'Invalid post.';
		if (!title) errors.title = 'Title is required.';
		const titleError = ensureMaxLength(title, MAX_LENGTHS.title, 'Title');
		if (titleError) errors.title = titleError;
		const slugError = ensureOptionalMaxLength(slug, MAX_LENGTHS.slug, 'Slug');
		if (slugError) errors.slug = slugError;
		const excerptError = ensureOptionalMaxLength(excerpt, MAX_LENGTHS.excerpt, 'Excerpt');
		if (excerptError) errors.excerpt = excerptError;
		const contentError = ensureOptionalMaxLength(content, MAX_LENGTHS.content, 'Content');
		if (contentError) errors.content = contentError;
		const tagsError = ensureOptionalMaxLength(tags, MAX_LENGTHS.tags, 'Tags');
		if (tagsError) errors.tags = tagsError;

		if (Object.keys(errors).length > 0) {
			return fail(400, { action: 'updatePost', message: 'Check the highlighted fields.', fieldErrors: errors, itemId: id });
		}

		updatePost(
			id,
			title,
			excerpt,
			content,
			tags,
			parseCheckbox(data, 'draft'),
			parseCheckbox(data, 'featured'),
			publishedAt,
			slug ?? undefined
		);

		return { success: true, message: 'Post updated.', action: 'updatePost', itemId: id };
	},
	deletePost: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'deletePost', message: 'Invalid CSRF token.' });
		}
		const id = parseNumber(data.get('id'), -1);
		if (id <= 0) {
			return fail(400, { action: 'deletePost', message: 'Invalid post.' });
		}
		deletePost(id);
		return { success: true, message: 'Post deleted.', action: 'deletePost', itemId: id };
	}
};
