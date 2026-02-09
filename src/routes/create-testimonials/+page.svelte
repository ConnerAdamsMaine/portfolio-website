<script lang="ts">
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import { trackEvent } from '$lib/utils/tracking';
	import type { ActionData } from './$types';

	export let form: ActionData | undefined;

	const handleSubmit = () => trackEvent({ type: 'form_submit', name: 'testimonial' });

	const tips = [
		'Share the outcome or impact in a sentence or two.',
		'Keep it specific: what changed after launch?',
		'Include your role or company so the context is clear.'
	];
</script>

<SeoHead
	title={formatTitle('Create Testimonial')}
	description="Share a short testimonial about working together."
/>

<section class="section-pad">
	<div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
		<MotionReveal className="space-y-5">
			<p class="badge">Create testimonial</p>
			<h1 class="text-4xl font-semibold text-white sm:text-5xl">Share your experience</h1>
			<p class="text-lg text-ink-200">
				If we have worked together, a short note helps others understand what it is like to
				collaborate. Submissions are reviewed before publishing.
			</p>
			<ul class="space-y-2 text-sm text-ink-200">
				{#each tips as tip}
					<li>{tip}</li>
				{/each}
			</ul>
			<p class="text-xs uppercase tracking-[0.2em] text-ink-300">
				Your details are kept private and only the testimonial is published.
			</p>
		</MotionReveal>
		<MotionReveal delay={0.08} className="glass p-8">
			<form class="space-y-4" method="POST" on:submit={handleSubmit}>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="name">
						Name
					</label>
					<input
						id="name"
						name="name"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						type="text"
						autocomplete="name"
						required
					/>
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="role">
							Role
						</label>
						<input
							id="role"
							name="role"
							class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
							type="text"
							autocomplete="organization-title"
						/>
					</div>
					<div>
						<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="company">
							Company
						</label>
						<input
							id="company"
							name="company"
							class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
							type="text"
							autocomplete="organization"
						/>
					</div>
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="email">
						Email (optional)
					</label>
					<input
						id="email"
						name="email"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						type="email"
						autocomplete="email"
					/>
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="quote">
						Testimonial
					</label>
					<textarea
						id="quote"
						name="quote"
						class="mt-2 min-h-[140px] w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						required
					></textarea>
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="project">
							Project (optional)
						</label>
						<input
							id="project"
							name="project"
							class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
							type="text"
						/>
					</div>
					<div>
						<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="result">
							Result (optional)
						</label>
						<input
							id="result"
							name="result"
							class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
							type="text"
						/>
					</div>
				</div>
				<label class="flex items-start gap-3 text-xs text-ink-200">
					<input
						class="mt-1 h-4 w-4"
						type="checkbox"
						name="consent"
						required
					/>
					<span>
						I have permission to share this testimonial publicly.
					</span>
				</label>
				<div class="space-y-2" role="status" aria-live="polite">
					{#if form?.message}
						<p class="text-sm text-ink-200">{form.message}</p>
					{:else if form?.success}
						<p class="text-sm text-aurora-200">
							Thanks for sharing. Once approved, it will appear on the testimonials page.
						</p>
					{/if}
					<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">
						Submit testimonial
					</button>
				</div>
			</form>
		</MotionReveal>
	</div>
</section>

<section class="section-pad">
	<MotionReveal className="glass space-y-4 p-8">
		<p class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200">Privacy note</p>
		<p class="text-sm text-ink-200">
			Your email is only used for follow-up if clarification is needed. It is never displayed
			publicly.
		</p>
		<a class="link-underline" href="/privacy-policy">Read the privacy policy</a>
	</MotionReveal>
</section>
