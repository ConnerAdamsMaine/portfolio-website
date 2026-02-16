<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import AdminNav from '$lib/components/AdminNav.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import type { PageData } from './$types';

	export let data: PageData;

	const sections = [
		{ label: 'Site settings', href: '/admin/site', detail: 'Hero, focus, and global copy.' },
		{ label: 'About', href: '/admin/about', detail: 'About page content.' },
		{ label: 'Stack', href: '/admin/stack', detail: 'Stack items and section intro.' },
		{ label: 'Work', href: '/admin/work', detail: 'Projects and featured work.' },
		{ label: 'Blog', href: '/admin/blog', detail: 'Posts, drafts, and blog intro.' },
		{ label: 'Testimonials', href: '/admin/testimonials', detail: 'Approve and publish testimonials.' },
		{ label: 'Contact', href: '/admin/contact', detail: 'Contact copy and email.' },
		{ label: 'Errors', href: '/admin/errors', detail: 'Maintenance + error messaging.' },
		{ label: 'Footer', href: '/admin/footer', detail: 'Footer navigation links.' },
		{ label: 'Assets', href: '/admin/assets', detail: 'Upload and publish files.' },
		{ label: 'Tracking', href: '/admin/tracking', detail: 'Metrics and event activity.' },
		{ label: 'Playground', href: '/admin/playground', detail: 'Manage playsets and live runtime sessions.' },
		{ label: 'Resume', href: '/admin/resume', detail: 'Upload your PDF resume.' }
	];
</script>

<SeoHead title={formatTitle('Admin')} description="Admin dashboard for site content updates." />

<section class="section-pad">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div class="space-y-4">
			<p class="badge">Admin</p>
			<h1 class="text-4xl font-semibold text-white sm:text-5xl">Control center</h1>
			<p class="max-w-2xl text-lg text-ink-200">
				Manage content, assets, and system settings from the sections below.
			</p>
		</div>
		<form method="POST" action="?/logout">
			<input type="hidden" name="csrfToken" value={data.csrfToken} />
			<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">
				Log out
			</button>
		</form>
	</div>
	<div class="mt-8">
		<AdminNav />
	</div>
</section>

<section class="section-pad">
	<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
		{#each sections as section, index}
			<MotionReveal delay={0.06 * index} className="card space-y-3">
				<p class="text-xs uppercase tracking-[0.2em] text-ink-200">Section</p>
				<h2 class="text-2xl font-semibold text-white">{section.label}</h2>
				<p class="text-sm text-ink-200">{section.detail}</p>
				<a class="link-underline" href={section.href}>Open {section.label}</a>
			</MotionReveal>
		{/each}
	</div>
</section>
