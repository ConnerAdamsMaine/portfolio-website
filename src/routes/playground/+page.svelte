<script lang="ts">
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { formatTitle } from '$lib/utils/seo';
</script>

<SeoHead title={formatTitle('Playground')} description="Experiments and prototypes are on the way." />

<section class="section-pad">
	<MotionReveal className="glass mx-auto max-w-3xl space-y-5 p-10 text-center">
		<p class="badge">Playground</p>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">Experiments incoming</h1>
		<p class="text-lg text-ink-200">
			The playground is being built for prototypes, motion tests, and bold UI experiments.
		</p>
		<div class="flex flex-wrap justify-center gap-3">
			<a class="nav-pill border-ink-100 bg-ink-900 text-white" href="/subscribe">
				Get updates
			</a>
			<a class="nav-pill" href="/contact">Have an idea?</a>
		</div>
	</MotionReveal>
</section>
