<script lang="ts">
	import { page } from '$app/stores';
	import { siteName } from '$lib/utils/seo';

	export let title: string;
	export let description: string;
	export let type: 'website' | 'article' = 'website';
	export let image = '/og-default.jpg';
	export let imageAlt = `${siteName} preview`;
	export let noindex = false;
	export let structuredData: Record<string, unknown> | Record<string, unknown>[] | null = null;

	$: canonical = `${$page.url.origin}${$page.url.pathname}`;
	$: imageUrl = new URL(image || '/og-default.jpg', $page.url.origin).toString();
	$: robots = noindex ? 'noindex, nofollow' : 'index, follow';
	$: twitterCard = image ? 'summary_large_image' : 'summary';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta name="robots" content={robots} />

	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={canonical} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:alt" content={imageAlt} />
	<meta property="og:locale" content="en_US" />

	<meta name="twitter:card" content={twitterCard} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />
	<meta name="twitter:image:alt" content={imageAlt} />

	{#if structuredData}
		<script type="application/ld+json">{JSON.stringify(structuredData)}</script>
	{/if}
</svelte:head>
