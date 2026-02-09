<script lang="ts">
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { formatTitle } from '$lib/utils/seo';
</script>

<SeoHead title={formatTitle('Journey')} description="A timeline of projects and lessons is coming soon." />

<section class="section-pad">
	<MotionReveal className="glass mx-auto max-w-3xl space-y-5 p-10 text-center">
		<p class="badge">Journey</p>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">Timeline in progress</h1>
		<p class="text-lg text-ink-200">
			I am assembling a timeline of projects, pivots, and lessons learned. Check back soon.
		</p>
		<div class="flex flex-wrap justify-center gap-3">
			<a class="nav-pill border-ink-100 bg-ink-900 text-white" href="/subscribe">
				Follow along
			</a>
			<a class="nav-pill" href="/work">View work</a>
		</div>
	</MotionReveal>
</section>
