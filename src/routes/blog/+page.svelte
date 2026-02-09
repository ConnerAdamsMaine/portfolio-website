<script lang="ts">
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<SeoHead title={formatTitle('Blog')} description={data.siteSettings.blogIntro} />

<section class="section-pad">
	<div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
		<div class="space-y-4">
			<p class="badge">Blog</p>
			<h1 class="text-4xl font-semibold text-white sm:text-5xl">{data.siteSettings.blogTitle}</h1>
			<p class="max-w-2xl text-lg text-ink-200">{data.siteSettings.blogIntro}</p>
		</div>
		<a class="nav-pill" href="/contact">Get in touch</a>
	</div>
</section>

{#if data.blogPosts.length}
	<section class="section-pad">
		<div class="grid gap-6 md:grid-cols-2">
			{#each data.blogPosts as post, index}
				<MotionReveal delay={0.08 * index} className="card">
					{#if post.publishedAt}
						<p class="text-xs uppercase tracking-[0.2em] text-ink-200">
							{post.publishedAt}
						</p>
					{/if}
					<h3 class="mt-3 text-2xl font-semibold text-white">{post.title}</h3>
					{#if post.excerpt}
						<p class="mt-2 text-sm text-ink-200">{post.excerpt}</p>
					{/if}
					{#if post.tags}
						<p class="mt-4 text-xs uppercase tracking-[0.2em] text-ink-200">{post.tags}</p>
					{/if}
					<a class="link-underline mt-4" href={`/blog/${post.slug}`}>Read entry</a>
				</MotionReveal>
			{/each}
		</div>
	</section>
{:else}
	<section class="section-pad">
		<div class="glass p-8 text-sm text-ink-200">No posts yet. Check back soon.</div>
	</section>
{/if}
