<script lang="ts">
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { formatTitle } from '$lib/utils/seo';

	const lastUpdated = 'February 6, 2026';
</script>

<SeoHead
	title={formatTitle('Cookie Policy')}
	description="Details on how cookies and similar technologies are used on this site."
/>

<section class="section-pad">
	<div class="grid gap-10 lg:grid-cols-[0.7fr_0.3fr]">
		<MotionReveal className="space-y-5">
			<p class="badge">Legal</p>
			<h1 class="text-4xl font-semibold text-white sm:text-5xl">Cookie Policy</h1>
			<p class="text-lg text-ink-200">
				Cookies help this site run smoothly and understand what content is most helpful. This
				policy describes the types of cookies used and how you can manage them.
			</p>
			<p class="text-xs uppercase tracking-[0.2em] text-ink-300">Last updated: {lastUpdated}</p>
		</MotionReveal>
		<MotionReveal delay={0.08} className="glass space-y-4 p-6">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200">Quick summary</p>
			<ul class="space-y-2 text-sm text-ink-200">
				<li>Essential cookies keep the site secure and usable.</li>
				<li>Analytics cookies help improve content quality.</li>
				<li>You can control cookies from your browser settings.</li>
			</ul>
		</MotionReveal>
	</div>
</section>

<section class="section-pad">
	<MotionReveal className="space-y-4">
		<h2 class="text-3xl font-semibold text-white">Cookie categories</h2>
		<p class="text-sm text-ink-200">
			Cookies are grouped by purpose. Not every category may be used at all times.
		</p>
	</MotionReveal>
	<div class="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		<MotionReveal delay={0.05} className="card space-y-3">
			<p class="text-xs uppercase tracking-[0.2em] text-ink-200">Essential</p>
			<h3 class="text-xl font-semibold text-white">Site operation</h3>
			<p class="text-sm text-ink-200">
				Required for page navigation, security, and basic functionality like remembering
				preferences.
			</p>
		</MotionReveal>
		<MotionReveal delay={0.1} className="card space-y-3">
			<p class="text-xs uppercase tracking-[0.2em] text-ink-200">Analytics</p>
			<h3 class="text-xl font-semibold text-white">Performance insight</h3>
			<p class="text-sm text-ink-200">
				Tracks aggregated usage trends so pages can be refined and broken flows can be fixed.
			</p>
		</MotionReveal>
		<MotionReveal delay={0.15} className="card space-y-3">
			<p class="text-xs uppercase tracking-[0.2em] text-ink-200">Functional</p>
			<h3 class="text-xl font-semibold text-white">Enhanced experiences</h3>
			<p class="text-sm text-ink-200">
				Helps load embedded content or remember settings, but is not required to use the site.
			</p>
		</MotionReveal>
	</div>
</section>

<section class="section-pad">
	<div class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
		<MotionReveal className="space-y-4">
			<h2 class="text-3xl font-semibold text-white">Managing cookies</h2>
			<p class="text-sm text-ink-200">
				Most browsers let you review, delete, or block cookies. Keep in mind that disabling
				essential cookies may prevent some parts of the site from working correctly.
			</p>
			<ul class="space-y-2 text-sm text-ink-200">
				<li>Review cookie settings in your browser preferences.</li>
				<li>Clear cookies on shared devices after your session ends.</li>
				<li>Opt out of analytics cookies if offered by your browser.</li>
			</ul>
		</MotionReveal>
		<MotionReveal delay={0.1} className="glass space-y-4 p-6">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200">Questions</p>
			<p class="text-sm text-ink-200">
				If you want clarification about specific cookies or providers, reach out and I will
				share details.
			</p>
			<a class="link-underline" href="/contact">Ask about cookies</a>
		</MotionReveal>
	</div>
</section>
