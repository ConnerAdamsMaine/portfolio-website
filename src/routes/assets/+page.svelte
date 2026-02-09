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

<SeoHead title={formatTitle('Assets')} description="Public assets, files, and downloadable resources." />

<section class="section-pad">
	<div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
		<div class="space-y-4">
			<p class="badge">Assets</p>
			<h1 class="text-4xl font-semibold text-white sm:text-5xl">Public assets</h1>
			<p class="max-w-2xl text-lg text-ink-200">
				Logos, PDFs, and downloadable resources made available for public use.
			</p>
		</div>
		<a class="nav-pill" href="/contact">Need something else?</a>
	</div>
</section>

{#if data.assets.length}
	<section class="section-pad">
		<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
			{#each data.assets as asset, index}
				<MotionReveal delay={0.06 * index} className="card flex h-full flex-col gap-4">
					<div class="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-ink-200">
						<span>{asset.mime}</span>
						<span>{formatSize(asset.size)}</span>
					</div>
					<h2 class="text-xl font-semibold text-white">{asset.label}</h2>
					<p class="text-sm text-ink-200">{asset.filename}</p>
					<a class="link-underline mt-auto" href={asset.path} target="_blank" rel="noreferrer noopener">
						Download
					</a>
				</MotionReveal>
			{/each}
		</div>
	</section>
{:else}
	<section class="section-pad">
		<MotionReveal className="glass space-y-4 p-10">
			<h2 class="text-2xl font-semibold text-white">No public assets yet</h2>
			<p class="text-sm text-ink-200">
				Assets shared publicly will appear here once published.
			</p>
		</MotionReveal>
	</section>
{/if}
