<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import AdminNav from '$lib/components/AdminNav.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;
</script>

<SeoHead title={formatTitle('Admin | Errors')} description="Update maintenance and error pages." />

<section class="section-pad">
	<div class="space-y-4">
		<p class="badge">Admin</p>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">System pages</h1>
		<p class="max-w-2xl text-lg text-ink-200">Edit maintenance and error page copy.</p>
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
		<form class="mt-4 grid gap-4" method="POST" action="?/updateErrors">
			<input type="hidden" name="csrfToken" value={data.csrfToken} />
			<div class="flex items-center gap-3 text-sm text-ink-200">
				<input type="hidden" name="maintenanceEnabled" value="0" />
				<input
					id="maintenanceEnabled"
					name="maintenanceEnabled"
					type="checkbox"
					value="1"
					class="h-4 w-4"
					checked={data.siteSettings.maintenanceEnabled === 1}
				/>
				<label for="maintenanceEnabled">Enable maintenance mode</label>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="maintenanceTitle">
						Maintenance title
					</label>
					<input
						id="maintenanceTitle"
						name="maintenanceTitle"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						value={data.siteSettings.maintenanceTitle}
					/>
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="maintenanceBody">
						Maintenance body
					</label>
					<textarea
						id="maintenanceBody"
						name="maintenanceBody"
						rows="3"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					>{data.siteSettings.maintenanceBody}</textarea>
				</div>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="error403Title">
						403 title
					</label>
					<input
						id="error403Title"
						name="error403Title"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						value={data.siteSettings.error403Title}
					/>
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="error403Body">
						403 body
					</label>
					<textarea
						id="error403Body"
						name="error403Body"
						rows="3"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					>{data.siteSettings.error403Body}</textarea>
				</div>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="error404Title">
						404 title
					</label>
					<input
						id="error404Title"
						name="error404Title"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						value={data.siteSettings.error404Title}
					/>
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="error404Body">
						404 body
					</label>
					<textarea
						id="error404Body"
						name="error404Body"
						rows="3"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					>{data.siteSettings.error404Body}</textarea>
				</div>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="error500Title">
						500 title
					</label>
					<input
						id="error500Title"
						name="error500Title"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						value={data.siteSettings.error500Title}
					/>
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="error500Body">
						500 body
					</label>
					<textarea
						id="error500Body"
						name="error500Body"
						rows="3"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					>{data.siteSettings.error500Body}</textarea>
				</div>
			</div>
			<div class="flex justify-end">
				<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">
					Save system pages
				</button>
			</div>
		</form>
	</MotionReveal>
</section>
