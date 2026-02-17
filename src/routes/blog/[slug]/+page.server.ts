import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getPublishedPostBySlug, getSiteSettings } from '$lib/server/dataStore';
import { getOrSetCached } from '$lib/server/cache';

export const load: PageServerLoad = async ({ params }) => {
	const post = await getOrSetCached(`page:blog:post:${params.slug}`, 20, async () =>
		getPublishedPostBySlug(params.slug)
	);
	if (!post) {
		throw error(404, 'Post not found');
	}

	const siteSettings = await getOrSetCached('site-settings', 20, () => getSiteSettings());

	return {
		siteSettings,
		post
	};
};
