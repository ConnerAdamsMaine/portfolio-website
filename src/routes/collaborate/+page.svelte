<script lang="ts">
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import { trackEvent } from '$lib/utils/tracking';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

	const handleSubmit = () => trackEvent({ type: 'form_submit', name: 'collaborate' });
</script>

<SeoHead
	title={formatTitle('Collaborate')}
	description="Start a collaboration, share a brief, or ask about availability."
/>

<section class="section-pad">
	<div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
		<div class="space-y-5">
			<p class="badge">Collaborate</p>
			<h1 class="text-4xl font-semibold text-white sm:text-5xl">Let’s build something sharp</h1>
			<p class="text-lg text-ink-200">
				Share your project goals, timelines, and constraints. I will follow up with next
				steps.
			</p>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="glass p-5">
					<p class="text-xs uppercase tracking-[0.2em] text-ink-200">Email</p>
					<p class="mt-2 text-lg font-semibold text-white">
						{data.siteSettings.contactEmail}
					</p>
				</div>
				<div class="glass p-5">
					<p class="text-xs uppercase tracking-[0.2em] text-ink-200">Availability</p>
					<p class="mt-2 text-lg font-semibold text-white">Limited slots monthly</p>
				</div>
			</div>
		</div>
		<MotionReveal className="glass p-8">
			<form class="space-y-4" method="POST" action="?/send" on:submit={handleSubmit}>
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
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="email">
						Email
					</label>
					<input
						id="email"
						name="email"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						type="email"
						autocomplete="email"
						required
					/>
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="scope">
						Project brief
					</label>
					<textarea
						id="scope"
						name="scope"
						class="mt-2 min-h-[140px] w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						autocomplete="off"
						required
					></textarea>
				</div>
				<div class="space-y-2">
					{#if form?.message}
						<p class="text-sm text-ink-200">{form.message}</p>
					{:else if form?.success}
						<p class="text-sm text-aurora-200">Thanks — I’ll be in touch soon.</p>
					{/if}
					<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">
						Send request
					</button>
				</div>
			</form>
		</MotionReveal>
	</div>
</section>
