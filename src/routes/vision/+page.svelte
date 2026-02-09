<script lang="ts">
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { formatTitle } from '$lib/utils/seo';

	const pillars = [
		{
			title: 'Clarity before polish',
			body: 'Every project starts with crisp positioning and a simple narrative before styling or motion.'
		},
		{
			title: 'Systems that scale',
			body: 'Reusable components, documentation, and guardrails keep launches fast and steady.'
		},
		{
			title: 'Momentum over perfection',
			body: 'Shipping creates feedback loops. I optimize for learning and iteration in public.'
		}
	];

	const standards = [
		'Accessible by default with motion that respects user preferences.',
		'Performance budgets agreed before build, enforced through the final cut.',
		'No unclear handoffs. Everything documented and future-proofed.',
		'Launch outcomes tracked, measured, and translated into next steps.'
	];

	const commitments = [
		{
			title: 'Collaborate with intent',
			body: 'Tight feedback loops, honest tradeoffs, and steady communication.'
		},
		{
			title: 'Protect focus',
			body: 'Less noise, more deep work. Each sprint has a defined outcome.'
		},
		{
			title: 'Leave a system behind',
			body: 'Every engagement ends with a toolset the team can run without me.'
		}
	];
</script>

<SeoHead title={formatTitle('Vision')} description="Personal vision, standards, and working philosophy." />

<section class="section-pad">
	<div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
		<MotionReveal className="space-y-5">
			<p class="badge">Vision</p>
			<h1 class="text-4xl font-semibold text-white sm:text-5xl">Build the experience, not the noise</h1>
			<p class="text-lg text-ink-200">
				A clear direction for how I design, build, and collaborate — focused on durable
				outcomes and honest craft.
			</p>
		</MotionReveal>
		<MotionReveal delay={0.08} className="glass space-y-4 p-6">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200">Why it matters</p>
			<p class="text-sm text-ink-200">
				Teams ship faster when the story, system, and execution all align. This page keeps the
				bar explicit.
			</p>
			<a class="link-underline" href="/collaborate">Work together</a>
		</MotionReveal>
	</div>
</section>

<section class="section-pad">
	<MotionReveal className="space-y-4">
		<h2 class="text-3xl font-semibold text-white">Pillars</h2>
		<p class="text-sm text-ink-200">The guiding principles behind every engagement.</p>
	</MotionReveal>
	<div class="mt-8 grid gap-6 md:grid-cols-3">
		{#each pillars as pillar, index}
			<MotionReveal delay={0.08 * index} className="card space-y-3">
				<h3 class="text-xl font-semibold text-white">{pillar.title}</h3>
				<p class="text-sm text-ink-200">{pillar.body}</p>
			</MotionReveal>
		{/each}
	</div>
</section>

<section class="section-pad">
	<div class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
		<MotionReveal className="space-y-4">
			<h2 class="text-3xl font-semibold text-white">Standards</h2>
			<p class="text-sm text-ink-200">Baseline expectations that every project should meet.</p>
			<ul class="space-y-3 text-sm text-ink-200">
				{#each standards as standard}
					<li>{standard}</li>
				{/each}
			</ul>
		</MotionReveal>
		<MotionReveal delay={0.1} className="glass space-y-4 p-6">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200">Accountability</p>
			<p class="text-sm text-ink-200">
				If a standard cannot be met, the tradeoff is documented before launch.
			</p>
		</MotionReveal>
	</div>
</section>

<section class="section-pad">
	<MotionReveal className="space-y-4">
		<h2 class="text-3xl font-semibold text-white">Commitments</h2>
		<p class="text-sm text-ink-200">How I show up for partners and teams.</p>
	</MotionReveal>
	<div class="mt-8 grid gap-6 md:grid-cols-3">
		{#each commitments as commitment, index}
			<MotionReveal delay={0.08 * index} className="card space-y-3">
				<h3 class="text-xl font-semibold text-white">{commitment.title}</h3>
				<p class="text-sm text-ink-200">{commitment.body}</p>
			</MotionReveal>
		{/each}
	</div>
</section>
