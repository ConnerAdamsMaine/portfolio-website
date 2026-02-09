import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getPublishedPostBySlug, getSiteSettings } from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
	const post = getPublishedPostBySlug(params.slug);
	if (!post) {
		throw error(404, 'Post not found');
	}

	return {
		siteSettings: getSiteSettings(),
		post
	};
};
