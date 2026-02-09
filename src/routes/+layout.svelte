<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
	import AmbientGlow from '$lib/components/AmbientGlow.svelte';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import { trackPageview } from '$lib/utils/tracking';
	import type { LayoutData } from './$types';

	let { children, data } = $props<{ data: LayoutData }>();

	const shouldTrack = (pathname: string) => !pathname.startsWith('/admin');

	onMount(() => {
		if (shouldTrack(window.location.pathname)) {
			trackPageview();
		}
		afterNavigate(({ to }) => {
			if (!to) return;
			if (!shouldTrack(to.url.pathname)) return;
			trackPageview(`${to.url.pathname}${to.url.search}`);
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a class="skip-link" href="#main-content">Skip to content</a>

<AmbientGlow />
<div class="noise-layer fixed inset-0 z-0 opacity-60"></div>

<div class="relative z-10 flex min-h-screen flex-col">
	<SiteNav githubUrl={data.siteSettings.githubUrl} />
	<main id="main-content" class="flex-1" tabindex="-1">{@render children()}</main>
	<SiteFooter
		footerLinks={data.footerLinks}
		currentYear={data.currentYear}
		footerBadge={data.siteSettings.footerBadge}
		footerHeadline={data.siteSettings.footerHeadline}
		footerBody={data.siteSettings.footerBody}
		footerCtaLabel={data.siteSettings.footerCtaLabel}
		footerCtaHref={data.siteSettings.footerCtaHref}
	/>
</div>
