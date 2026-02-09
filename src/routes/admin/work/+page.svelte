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

<SeoHead title={formatTitle('Admin | Work')} description="Manage work items and section intro." />

<section class="section-pad">
	<div class="space-y-4">
		<p class="badge">Admin</p>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">Work</h1>
		<p class="max-w-2xl text-lg text-ink-200">Update work intro copy and manage projects.</p>
		<AdminNav />
	</div>
</section>

<section class="section-pad">
	<MotionReveal className="glass p-8">
		<h2 class="text-2xl font-semibold text-white">Work section</h2>
		{#if isAction('updateWorkSection') && feedback?.message}
			<p class={`mt-3 text-sm ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
				{feedback?.message}
			</p>
		{/if}
		<form class="mt-6 grid gap-4" method="POST" action="?/updateWorkSection">
			<input type="hidden" name="csrfToken" value={data.csrfToken} />
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="workTitle">
					Title
				</label>
				<input
					id="workTitle"
					name="workTitle"
					class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					value={data.siteSettings.workTitle}
				/>
			</div>
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="workIntro">
					Intro
				</label>
				<input
					id="workIntro"
					name="workIntro"
					class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					value={data.siteSettings.workIntro}
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
			<h2 class="text-2xl font-semibold text-white">Add work item</h2>
			{#if isAction('createWork') && feedback?.message}
				<p class={`mt-3 text-sm ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
					{feedback?.message}
				</p>
			{/if}
			<form class="mt-4 space-y-4" method="POST" action="?/createWork">
				<input type="hidden" name="csrfToken" value={data.csrfToken} />
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="workTitleItem">
						Title
					</label>
					<input
						id="workTitleItem"
						name="title"
						required
						maxlength="120"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						aria-invalid={Boolean(fieldError('createWork', 'title'))}
					/>
					{#if fieldError('createWork', 'title')}
						<p class="mt-2 text-xs text-red-200">{fieldError('createWork', 'title')}</p>
					{/if}
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="workDescription">
						Description
					</label>
					<textarea
						id="workDescription"
						name="description"
						required
						maxlength="500"
						rows="3"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						aria-invalid={Boolean(fieldError('createWork', 'description'))}
					></textarea>
					{#if fieldError('createWork', 'description')}
						<p class="mt-2 text-xs text-red-200">{fieldError('createWork', 'description')}</p>
					{/if}
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="workLongDescription">
						Long description
					</label>
					<textarea
						id="workLongDescription"
						name="longDescription"
						maxlength="1500"
						rows="4"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						aria-invalid={Boolean(fieldError('createWork', 'longDescription'))}
					></textarea>
					{#if fieldError('createWork', 'longDescription')}
						<p class="mt-2 text-xs text-red-200">{fieldError('createWork', 'longDescription')}</p>
					{/if}
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="workHighlights">
						Highlights (one per line)
					</label>
					<textarea
						id="workHighlights"
						name="highlights"
						maxlength="600"
						rows="3"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						aria-invalid={Boolean(fieldError('createWork', 'highlights'))}
					></textarea>
					{#if fieldError('createWork', 'highlights')}
						<p class="mt-2 text-xs text-red-200">{fieldError('createWork', 'highlights')}</p>
					{/if}
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="workRole">
						Role
					</label>
					<input
						id="workRole"
						name="role"
						maxlength="80"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						aria-invalid={Boolean(fieldError('createWork', 'role'))}
					/>
					{#if fieldError('createWork', 'role')}
						<p class="mt-2 text-xs text-red-200">{fieldError('createWork', 'role')}</p>
					{/if}
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="workTech">
						Tech
					</label>
					<input
						id="workTech"
						name="tech"
						maxlength="80"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						aria-invalid={Boolean(fieldError('createWork', 'tech'))}
					/>
					{#if fieldError('createWork', 'tech')}
						<p class="mt-2 text-xs text-red-200">{fieldError('createWork', 'tech')}</p>
					{/if}
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="workLink">
						Link
					</label>
					<input
						id="workLink"
						name="link"
						maxlength="2048"
						type="url"
						inputmode="url"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						aria-invalid={Boolean(fieldError('createWork', 'link'))}
					/>
					{#if fieldError('createWork', 'link')}
						<p class="mt-2 text-xs text-red-200">{fieldError('createWork', 'link')}</p>
					{/if}
				</div>
				<div class="flex items-center gap-3 text-sm text-ink-200">
					<input type="hidden" name="featured" value="0" />
					<input id="workFeatured" name="featured" type="checkbox" value="1" class="h-4 w-4" />
					<label for="workFeatured">Featured</label>
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="workSort">
						Sort order
					</label>
					<input
						id="workSort"
						name="sort"
						type="number"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					/>
				</div>
				<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Add work</button>
			</form>
		</MotionReveal>
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold text-white">
				Work items <span class="text-sm font-normal text-ink-200">({data.workItems.length})</span>
			</h2>
			{#if data.workItems.length}
				{#each data.workItems as item}
					<form class="card grid gap-3" method="POST" action="?/updateWork">
						<input type="hidden" name="csrfToken" value={data.csrfToken} />
						<input type="hidden" name="id" value={item.id} />
						{#if isAction('updateWork') && feedback?.itemId === item.id && feedback?.message}
							<p class={`text-xs ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
								{feedback?.message}
							</p>
						{/if}
						<div class="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-ink-300">
							<span>Work item</span>
							{#if item.link}
								<a class="link-underline" href={item.link} target="_blank" rel="noreferrer noopener">Open</a>
							{/if}
						</div>
						<input
							name="title"
							value={item.title}
							required
							maxlength="120"
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
							aria-invalid={Boolean(fieldError('updateWork', 'title', item.id))}
						/>
						{#if fieldError('updateWork', 'title', item.id)}
							<p class="text-xs text-red-200">{fieldError('updateWork', 'title', item.id)}</p>
						{/if}
						<textarea
							name="description"
							required
							maxlength="500"
							rows="3"
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
							aria-invalid={Boolean(fieldError('updateWork', 'description', item.id))}
						>{item.description}</textarea>
						{#if fieldError('updateWork', 'description', item.id)}
							<p class="text-xs text-red-200">{fieldError('updateWork', 'description', item.id)}</p>
						{/if}
						<textarea
							name="longDescription"
							maxlength="1500"
							rows="4"
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
							aria-invalid={Boolean(fieldError('updateWork', 'longDescription', item.id))}
						>{item.longDescription ?? ''}</textarea>
						{#if fieldError('updateWork', 'longDescription', item.id)}
							<p class="text-xs text-red-200">{fieldError('updateWork', 'longDescription', item.id)}</p>
						{/if}
						<textarea
							name="highlights"
							maxlength="600"
							rows="3"
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
							aria-invalid={Boolean(fieldError('updateWork', 'highlights', item.id))}
						>{item.highlights ?? ''}</textarea>
						{#if fieldError('updateWork', 'highlights', item.id)}
							<p class="text-xs text-red-200">{fieldError('updateWork', 'highlights', item.id)}</p>
						{/if}
						<input
							name="role"
							value={item.role ?? ''}
							maxlength="80"
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
							aria-invalid={Boolean(fieldError('updateWork', 'role', item.id))}
						/>
						{#if fieldError('updateWork', 'role', item.id)}
							<p class="text-xs text-red-200">{fieldError('updateWork', 'role', item.id)}</p>
						{/if}
						<input
							name="tech"
							value={item.tech ?? ''}
							maxlength="80"
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
							aria-invalid={Boolean(fieldError('updateWork', 'tech', item.id))}
						/>
						{#if fieldError('updateWork', 'tech', item.id)}
							<p class="text-xs text-red-200">{fieldError('updateWork', 'tech', item.id)}</p>
						{/if}
						<input
							name="link"
							value={item.link ?? ''}
							maxlength="2048"
							type="url"
							inputmode="url"
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
							aria-invalid={Boolean(fieldError('updateWork', 'link', item.id))}
						/>
						{#if fieldError('updateWork', 'link', item.id)}
							<p class="text-xs text-red-200">{fieldError('updateWork', 'link', item.id)}</p>
						{/if}
						<div class="flex items-center gap-3 text-sm text-ink-200">
							<input type="hidden" name="featured" value="0" />
							<input
								id={`featured-${item.id}`}
								name="featured"
								type="checkbox"
								value="1"
								class="h-4 w-4"
								checked={item.featured === 1}
							/>
							<label for={`featured-${item.id}`}>Featured</label>
						</div>
						<input
							name="sort"
							type="number"
							value={item.sort}
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
						/>
						<div class="flex flex-wrap gap-3">
							<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Update</button>
							<button
								class="nav-pill"
								type="submit"
								formaction="?/deleteWork"
								on:click={(event) => {
									if (!confirm('Delete this work item?')) event.preventDefault();
								}}
							>
								Delete
							</button>
						</div>
					</form>
				{/each}
			{:else}
				<div class="card text-sm text-ink-200">No work items yet.</div>
			{/if}
		</div>
	</div>
</section>
