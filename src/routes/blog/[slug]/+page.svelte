<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import type { PageData } from './$types';

	export let data: PageData;

	const description =
		data.post.excerpt ?? (data.post.content ? data.post.content.slice(0, 160) : 'Blog entry.');
</script>

<SeoHead title={formatTitle(data.post.title)} description={description} type="article" />

<section class="section-pad">
	<div class="space-y-4">
		<a class="link-underline" href="/blog">Back to blog</a>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">{data.post.title}</h1>
		<div class="flex flex-wrap gap-4 text-xs uppercase tracking-[0.2em] text-ink-200">
			{#if data.post.publishedAt}
				<span>{data.post.publishedAt}</span>
			{/if}
			{#if data.post.tags}
				<span>{data.post.tags}</span>
			{/if}
		</div>
		{#if data.post.content}
			<div class="whitespace-pre-wrap text-base text-ink-200">{data.post.content}</div>
		{:else if data.post.excerpt}
			<div class="text-base text-ink-200">{data.post.excerpt}</div>
		{:else}
			<div class="text-base text-ink-200">No content yet.</div>
		{/if}
	</div>
</section>
