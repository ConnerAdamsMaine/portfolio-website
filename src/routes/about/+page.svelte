<script lang="ts">
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<SeoHead title={formatTitle('About')} description={data.siteSettings.aboutBody} />

<section class="section-pad">
	<div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
		<MotionReveal className="space-y-5">
			<p class="badge">About</p>
			<h1 class="text-4xl font-semibold text-white sm:text-5xl">{data.siteSettings.aboutHeadline}</h1>
			<p class="text-lg text-ink-200">{data.siteSettings.aboutBody}</p>
			<a class="link-underline" href="/contact">Let’s connect</a>
		</MotionReveal>
		{#if data.stackItems.length}
			<MotionReveal delay={0.08} className="glass space-y-4 p-8">
				<p class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200">Current stack</p>
				<ul class="space-y-3 text-sm text-ink-200">
					{#each data.stackItems.slice(0, 4) as item}
						<li>{item.label}{item.detail ? ` — ${item.detail}` : ''}</li>
					{/each}
				</ul>
			</MotionReveal>
		{/if}
	</div>
</section>

{#if data.stackItems.length}
	<section class="section-pad">
		<div class="glass grid gap-8 p-10 lg:grid-cols-[1.1fr_0.9fr]">
			<MotionReveal className="space-y-3">
				<h2 class="text-3xl font-semibold text-white">{data.siteSettings.stackTitle}</h2>
				<p class="text-sm text-ink-200">{data.siteSettings.stackIntro}</p>
			</MotionReveal>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each data.stackItems as item, index}
					<MotionReveal delay={0.04 * index} className="rounded-2xl border border-ink-200/30 bg-white/5 p-5">
						<p class="text-xs uppercase tracking-[0.2em] text-ink-200">{item.label}</p>
						{#if item.detail}
							<p class="mt-2 text-lg font-semibold text-white">{item.detail}</p>
						{/if}
					</MotionReveal>
				{/each}
			</div>
		</div>
	</section>
{/if}
