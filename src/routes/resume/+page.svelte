<script lang="ts">
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import type { PageData } from './$types';

	export let data: PageData;

	const formatSize = (value: number) => {
		if (!Number.isFinite(value)) return '0 B';
		if (value < 1024) return `${value} B`;
		if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
		return `${(value / (1024 * 1024)).toFixed(1)} MB`;
	};
</script>

<SeoHead
	title={formatTitle('Resume')}
	description="View the latest resume inline and download the PDF."
/>

<section class="section-pad">
	<div class="space-y-4">
		<p class="badge">Resume</p>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">Resume</h1>
		<p class="max-w-2xl text-lg text-ink-200">
			View the latest resume below, or download the PDF for offline review.
		</p>
	</div>
</section>

{#if data.resume}
	<section class="section-pad">
		<MotionReveal className="glass p-6">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<h2 class="text-2xl font-semibold text-white">Inline preview</h2>
				<a class="link-underline" href={data.resume.path} target="_blank" rel="noreferrer noopener">
					Open in new tab
				</a>
			</div>
			<div class="mt-4 overflow-hidden rounded-2xl border border-ink-200/20 bg-white">
				<iframe
					src={`${data.resume.path}#zoom=94`}
					title="Resume PDF preview"
					class="mx-auto h-[74vh] w-[85%]"
					loading="lazy"
				></iframe>
			</div>
		</MotionReveal>
	</section>
{/if}

<section class="section-pad">
	<div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
		<MotionReveal className="space-y-5">
			<h2 class="text-2xl font-semibold text-white">Current file</h2>
			<p class="text-sm text-ink-200">
				This file is refreshed whenever new work ships.
			</p>
			{#if data.resume}
				<div class="glass space-y-2 p-5 text-sm text-ink-200">
					<p class="text-xs uppercase tracking-[0.2em] text-ink-200">PDF</p>
					<p class="text-white">{formatSize(data.resume.size)}</p>
					<p>Updated {data.resume.updatedAt}</p>
					<a class="link-underline" href={data.resume.path} target="_blank" rel="noreferrer noopener">
						Open in new tab
					</a>
				</div>
			{:else}
				<p class="text-sm text-ink-200">Resume is not available yet. Please check back shortly.</p>
			{/if}
		</MotionReveal>
		<MotionReveal delay={0.08} className="glass space-y-4 p-8">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200">Quick actions</p>
			<p class="text-sm text-ink-200">
				Need a tailored version or additional details for a specific role?
			</p>
			<div class="flex flex-wrap gap-3">
				{#if data.resume}
					<a class="nav-pill border-ink-100 bg-ink-900 text-white" href={data.resume.path} download>
						Download PDF
					</a>
				{/if}
				<a class="nav-pill" href="/contact">Request custom version</a>
			</div>
		</MotionReveal>
	</div>
</section>
