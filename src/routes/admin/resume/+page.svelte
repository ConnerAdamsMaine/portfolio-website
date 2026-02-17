<script lang="ts">
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import AdminNav from '$lib/components/AdminNav.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

	const formatSize = (value: number) => {
		if (!Number.isFinite(value)) return '0 B';
		if (value < 1024) return `${value} B`;
		if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
		return `${(value / (1024 * 1024)).toFixed(1)} MB`;
	};
</script>

<SeoHead title={formatTitle('Admin | Resume')} description="Upload and manage the public resume PDF." />

<section class="section-pad">
	<div class="space-y-4">
		<p class="badge">Admin</p>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">Resume</h1>
		<p class="max-w-2xl text-lg text-ink-200">Upload and manage your public resume PDF.</p>
		<AdminNav />
	</div>
</section>

<section class="section-pad">
	<div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
		<MotionReveal className="space-y-5">
			<h2 class="text-2xl font-semibold text-white">Current file</h2>
			<p class="text-sm text-ink-200">Replace the current public resume PDF.</p>
			{#if data.resume}
				<div class="glass space-y-2 p-5 text-sm text-ink-200">
					<p class="text-xs uppercase tracking-[0.2em] text-ink-200">Current file</p>
					<p class="text-white">{formatSize(data.resume.size)}</p>
					<p>Updated {data.resume.updatedAt}</p>
					<a class="link-underline" href={data.resume.path} target="_blank" rel="noreferrer noopener">
						Open public resume
					</a>
				</div>
			{:else}
				<p class="text-sm text-ink-200">No resume uploaded yet.</p>
			{/if}
			<a class="link-underline" href="/resume">View public page</a>
		</MotionReveal>
		<MotionReveal delay={0.08} className="glass p-8">
			<form class="space-y-4" method="POST" enctype="multipart/form-data" action="?/upload">
				<input type="hidden" name="csrfToken" value={data.csrfToken} />
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="resume">
						PDF file
					</label>
					<input
						id="resume"
						name="resume"
						required
						type="file"
						accept="application/pdf"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					/>
				</div>
				<div class="space-y-2" role="status" aria-live="polite">
					{#if form?.message}
						<p class="text-sm text-ink-200">{form.message}</p>
					{:else if form?.success}
						<p class="text-sm text-aurora-200">Resume uploaded.</p>
					{/if}
					<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">
						Upload resume
					</button>
				</div>
			</form>
		</MotionReveal>
	</div>
</section>
