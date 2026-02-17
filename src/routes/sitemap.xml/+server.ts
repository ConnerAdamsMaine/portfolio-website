import type { RequestHandler } from './$types';
import { getPublishedPosts } from '$lib/server/db';

const buildUrlEntry = (loc: string, lastmod?: string) => {
	const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
	return `<url><loc>${loc}</loc>${lastmodTag}</url>`;
};

export const GET: RequestHandler = ({ url }) => {
	const origin = url.origin;
	const now = new Date().toISOString();
	const posts = getPublishedPosts();

	const staticPaths = [
		'/',
		'/about',
		'/work',
		'/resume',
		'/blog',
		'/contact',
		'/privacy-policy',
		'/cookie-policy',
		'/testimonials',
		'/create-testimonials',
		'/subscribe',
		'/assets',
		'/playground',
		'/journey',
		'/collaborate',
		'/vision'
	];
	const staticUrls = staticPaths.map((path) => buildUrlEntry(`${origin}${path}`, now));

	const postUrls = posts.map((post) => {
		const lastmod = post.publishedAt ?? post.createdAt;
		return buildUrlEntry(`${origin}/blog/${post.slug}`, lastmod);
	});

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...postUrls].join('')}
</urlset>`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml'
		}
	});
};
