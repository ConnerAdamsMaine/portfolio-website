import type { RequestHandler } from './$types';
import { getPublishedPosts, getSiteSettings } from '$lib/server/db';

const escapeXml = (value: string) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

const escapeCdata = (value: string) => value.replaceAll(']]>', ']]]]><![CDATA[>');

export const GET: RequestHandler = ({ url }) => {
	const origin = url.origin;
	const siteSettings = getSiteSettings();
	const posts = getPublishedPosts();

	const items = posts
		.map((post) => {
			const link = `${origin}/blog/${post.slug}`;
			const pubDate = new Date(post.publishedAt ?? post.createdAt).toUTCString();
			const description = escapeCdata(post.excerpt ?? post.content ?? '');
			return `
				<item>
					<title>${escapeXml(post.title)}</title>
					<link>${link}</link>
					<guid isPermaLink="true">${link}</guid>
					<pubDate>${pubDate}</pubDate>
					<description><![CDATA[${description}]]></description>
				</item>
			`;
		})
		.join('');

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
	<channel>
		<title>${escapeXml(siteSettings.blogTitle)}</title>
		<link>${origin}/blog</link>
		<description>${escapeXml(siteSettings.blogIntro)}</description>
		${items}
	</channel>
</rss>`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/rss+xml'
		}
	});
};
