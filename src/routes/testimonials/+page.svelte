<script lang="ts">
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<SeoHead
	title={formatTitle('Testimonials')}
	description="Reflections from collaborators on product launches and design partnerships."
/>

<section class="section-pad">
	<div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
		<div class="space-y-4">
			<p class="badge">Testimonials</p>
			<h1 class="text-4xl font-semibold text-white sm:text-5xl">Moments worth sharing</h1>
			<p class="max-w-2xl text-lg text-ink-200">
				Notes from partners and teams will live here once published.
			</p>
		</div>
		<a class="nav-pill border-ink-100 bg-ink-900 text-white" href="/create-testimonials">
			Share a testimonial
		</a>
	</div>
</section>

{#if data.testimonials.length}
	<section class="section-pad">
		<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
			{#each data.testimonials as item, index}
				{@const attribution = [item.role, item.company].filter(Boolean).join(' · ')}
				<MotionReveal delay={0.06 * index} className="card flex h-full flex-col gap-4">
					<blockquote class="text-lg text-white">{item.quote}</blockquote>
					<div class="text-sm text-ink-200">
						<p class="font-semibold text-white">{item.name}</p>
						{#if attribution}
							<p>{attribution}</p>
						{/if}
					</div>
					{#if item.project || item.result}
						<div class="mt-auto space-y-2 text-xs uppercase tracking-[0.2em] text-ink-200">
							{#if item.project}
								<p>{item.project}</p>
							{/if}
							{#if item.result}
								<p class="text-ink-100">{item.result}</p>
							{/if}
						</div>
					{/if}
				</MotionReveal>
			{/each}
		</div>
	</section>
{:else}
	<section class="section-pad">
		<MotionReveal className="glass space-y-4 p-10">
			<h2 class="text-2xl font-semibold text-white">No testimonials published yet</h2>
			<p class="text-sm text-ink-200">
				Once testimonials are shared and approved, they will appear here.
			</p>
			<a class="nav-pill border-ink-100 bg-ink-900 text-white" href="/create-testimonials">
				Be the first to share
			</a>
		</MotionReveal>
	</section>
{/if}
