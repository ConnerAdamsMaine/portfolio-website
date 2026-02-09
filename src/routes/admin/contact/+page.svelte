<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import AdminNav from '$lib/components/AdminNav.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;
</script>

<SeoHead title={formatTitle('Admin | Contact')} description="Update contact page content." />

<section class="section-pad">
	<div class="space-y-4">
		<p class="badge">Admin</p>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">Contact</h1>
		<p class="max-w-2xl text-lg text-ink-200">Update contact messaging and email.</p>
		<AdminNav />
	</div>
</section>

<section class="section-pad">
	<MotionReveal className="glass p-8">
		{#if form?.message}
			<p class={`text-sm ${form?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
				{form.message}
			</p>
		{/if}
		<form class="mt-4 grid gap-4" method="POST" action="?/updateContact">
			<input type="hidden" name="csrfToken" value={data.csrfToken} />
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="contactTitle">
					Title
				</label>
				<input
					id="contactTitle"
					name="contactTitle"
					class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					value={data.siteSettings.contactTitle}
				/>
			</div>
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="contactBody">
					Body
				</label>
				<textarea
					id="contactBody"
					name="contactBody"
					rows="3"
					class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
				>{data.siteSettings.contactBody}</textarea>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="contactEmail">
						Email
					</label>
					<input
						id="contactEmail"
						name="contactEmail"
						type="email"
						autocomplete="email"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						value={data.siteSettings.contactEmail}
					/>
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="githubUrl">
						GitHub URL
					</label>
					<input
						id="githubUrl"
						name="githubUrl"
						type="url"
						inputmode="url"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						value={data.siteSettings.githubUrl}
					/>
				</div>
			</div>
			<div class="flex justify-end">
				<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">
					Save contact
				</button>
			</div>
		</form>
	</MotionReveal>
</section>
