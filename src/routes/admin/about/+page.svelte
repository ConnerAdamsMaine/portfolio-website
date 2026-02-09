<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import AdminNav from '$lib/components/AdminNav.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;
</script>

<SeoHead title={formatTitle('Admin | About')} description="Edit about page content." />

<section class="section-pad">
	<div class="space-y-4">
		<p class="badge">Admin</p>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">About content</h1>
		<p class="max-w-2xl text-lg text-ink-200">Update the about headline and body copy.</p>
		<AdminNav />
	</div>
</section>

<section class="section-pad">
	<MotionReveal className="glass p-8">
		{#if form?.message}
			<p class="text-sm text-ink-200">{form.message}</p>
		{:else if form?.success}
			<p class="text-sm text-aurora-200">Saved.</p>
		{/if}
		<form class="mt-4 grid gap-4" method="POST" action="?/updateAbout">
			<input type="hidden" name="csrfToken" value={data.csrfToken} />
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="aboutHeadline">
					Headline
				</label>
				<textarea
					id="aboutHeadline"
					name="aboutHeadline"
					rows="2"
					class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
				>{data.siteSettings.aboutHeadline}</textarea>
			</div>
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="aboutBody">
					Body
				</label>
				<textarea
					id="aboutBody"
					name="aboutBody"
					rows="4"
					class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
				>{data.siteSettings.aboutBody}</textarea>
			</div>
			<div class="flex justify-end">
				<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">
					Save about
				</button>
			</div>
		</form>
	</MotionReveal>
</section>
