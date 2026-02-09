<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;
</script>

<SeoHead title={formatTitle('Admin Login')} description="Sign in to manage site content." />

<section class="section-pad">
	<div class="mx-auto max-w-xl space-y-6">
		<p class="badge">Admin</p>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">Sign in to continue.</h1>
		<p class="text-lg text-ink-200">
			Use your admin credentials to access the content control center.
		</p>
		{#if form?.message}
			<p class="text-sm text-ink-200">{form.message}</p>
		{/if}

		<form class="glass space-y-4 p-8" method="POST">
			<input type="hidden" name="csrfToken" value={data.csrfToken} />
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="email">
					Email
				</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="username"
					required
					class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
				/>
			</div>
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="password">
					Password
				</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
				/>
			</div>
			<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">
				Sign in
			</button>
		</form>
	</div>
</section>
