<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import AdminNav from '$lib/components/AdminNav.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

	type FormFeedback = {
		action?: string;
		message?: string;
		success?: boolean;
		fieldErrors?: Record<string, string>;
		itemId?: number;
	};

	const feedback = form as FormFeedback | undefined;
	const isAction = (action: string) => feedback?.action === action;
	const fieldError = (action: string, field: string, itemId?: number) =>
		feedback?.action === action && (itemId === undefined || feedback?.itemId === itemId)
			? feedback?.fieldErrors?.[field]
			: undefined;
</script>

<SeoHead title={formatTitle('Admin | Stack')} description="Manage stack items and section intro." />

<section class="section-pad">
	<div class="space-y-4">
		<p class="badge">Admin</p>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">Stack</h1>
		<p class="max-w-2xl text-lg text-ink-200">Update the stack section and manage tools.</p>
		<AdminNav />
	</div>
</section>

<section class="section-pad">
	<MotionReveal className="glass p-8">
		<h2 class="text-2xl font-semibold text-white">Stack section</h2>
		{#if isAction('updateStackSection') && feedback?.message}
			<p class={`mt-3 text-sm ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
				{feedback?.message}
			</p>
		{/if}
		<form class="mt-6 grid gap-4" method="POST" action="?/updateStackSection">
			<input type="hidden" name="csrfToken" value={data.csrfToken} />
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="stackTitle">
					Section title
				</label>
				<input
					id="stackTitle"
					name="stackTitle"
					class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					value={data.siteSettings.stackTitle}
				/>
			</div>
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="stackIntro">
					Section intro
				</label>
				<input
					id="stackIntro"
					name="stackIntro"
					class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					value={data.siteSettings.stackIntro}
				/>
			</div>
			<div class="flex justify-end">
				<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">
					Save section
				</button>
			</div>
		</form>
	</MotionReveal>
</section>

<section class="section-pad">
	<div class="grid gap-6 lg:grid-cols-[0.4fr_0.6fr]">
		<MotionReveal className="glass p-8">
			<h2 class="text-2xl font-semibold text-white">Add stack item</h2>
			{#if isAction('createStack') && feedback?.message}
				<p class={`mt-3 text-sm ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
					{feedback?.message}
				</p>
			{/if}
			<form class="mt-4 space-y-4" method="POST" action="?/createStack">
				<input type="hidden" name="csrfToken" value={data.csrfToken} />
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="stackLabel">
						Label
					</label>
					<input
						id="stackLabel"
						name="label"
						required
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						aria-invalid={Boolean(fieldError('createStack', 'label'))}
					/>
					{#if fieldError('createStack', 'label')}
						<p class="mt-2 text-xs text-red-200">{fieldError('createStack', 'label')}</p>
					{/if}
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="stackDetail">
						Detail
					</label>
					<input
						id="stackDetail"
						name="detail"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					/>
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="stackSort">
						Sort order
					</label>
					<input
						id="stackSort"
						name="sort"
						type="number"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					/>
				</div>
				<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Add stack</button>
			</form>
		</MotionReveal>
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold text-white">
				Stack items <span class="text-sm font-normal text-ink-200">({data.stackItems.length})</span>
			</h2>
			{#if data.stackItems.length}
				{#each data.stackItems as item}
					<form class="card grid gap-3" method="POST" action="?/updateStack">
						<input type="hidden" name="csrfToken" value={data.csrfToken} />
						<input type="hidden" name="id" value={item.id} />
						{#if isAction('updateStack') && feedback?.itemId === item.id && feedback?.message}
							<p class={`text-xs ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
								{feedback?.message}
							</p>
						{/if}
						<input
							name="label"
							value={item.label}
							required
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
							aria-invalid={Boolean(fieldError('updateStack', 'label', item.id))}
						/>
						{#if fieldError('updateStack', 'label', item.id)}
							<p class="text-xs text-red-200">{fieldError('updateStack', 'label', item.id)}</p>
						{/if}
						<input
							name="detail"
							value={item.detail ?? ''}
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
						/>
						<input
							name="sort"
							type="number"
							value={item.sort}
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
						/>
						<div class="flex flex-wrap gap-3">
							<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">
								Update
							</button>
							<button
								class="nav-pill"
								type="submit"
								formaction="?/deleteStack"
								on:click={(event) => {
									if (!confirm('Delete this stack item?')) event.preventDefault();
								}}
							>
								Delete
							</button>
						</div>
					</form>
				{/each}
			{:else}
				<div class="card text-sm text-ink-200">No stack items yet.</div>
			{/if}
		</div>
	</div>
</section>
