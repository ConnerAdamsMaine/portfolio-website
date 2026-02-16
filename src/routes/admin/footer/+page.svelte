<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import AdminNav from '$lib/components/AdminNav.svelte';
	import AdminModal from '$lib/components/AdminModal.svelte';
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

	let isCreateModalOpen = feedback?.action === 'createFooterLink' && feedback?.success !== true;
	let editingLinkId: number | null =
		feedback?.action === 'updateFooterLink' && feedback?.success !== true ? (feedback.itemId ?? null) : null;
	let deletingLinkId: number | null =
		feedback?.action === 'deleteFooterLink' && feedback?.success !== true ? (feedback.itemId ?? null) : null;

	const closeCreateModal = () => {
		isCreateModalOpen = false;
	};

	const closeEditModal = () => {
		editingLinkId = null;
	};

	const closeDeleteModal = () => {
		deletingLinkId = null;
	};
</script>

<SeoHead title={formatTitle('Admin | Footer')} description="Manage footer links." />

<section class="section-pad">
	<div class="space-y-4">
		<p class="badge">Admin</p>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">Footer links</h1>
		<p class="max-w-2xl text-lg text-ink-200">Update site-wide footer navigation.</p>
		<AdminNav />
	</div>
</section>

<section class="section-pad">
	<MotionReveal className="glass p-8">
		<h2 class="text-2xl font-semibold text-white">Footer copy</h2>
		{#if isAction('updateFooterCopy') && feedback?.message}
			<p class={`mt-3 text-sm ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
				{feedback?.message}
			</p>
		{/if}
		<form class="mt-4 grid gap-4" method="POST" action="?/updateFooterCopy">
			<input type="hidden" name="csrfToken" value={data.csrfToken} />
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="footerBadge">
						Badge
					</label>
					<input
						id="footerBadge"
						name="footerBadge"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						value={data.siteSettings.footerBadge}
					/>
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="footerHeadline">
						Headline
					</label>
					<input
						id="footerHeadline"
						name="footerHeadline"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						value={data.siteSettings.footerHeadline}
					/>
				</div>
			</div>
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="footerBody">
					Body
				</label>
				<textarea
					id="footerBody"
					name="footerBody"
					rows="3"
					class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
				>{data.siteSettings.footerBody}</textarea>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="footerCtaLabel">
						CTA label
					</label>
					<input
						id="footerCtaLabel"
						name="footerCtaLabel"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						value={data.siteSettings.footerCtaLabel}
					/>
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="footerCtaHref">
						CTA href
					</label>
					<input
						id="footerCtaHref"
						name="footerCtaHref"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						value={data.siteSettings.footerCtaHref}
					/>
				</div>
			</div>
			<div class="flex justify-end">
				<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">
					Save footer copy
				</button>
			</div>
		</form>
	</MotionReveal>
</section>

<section class="section-pad">
	<div class="grid gap-6 lg:grid-cols-[0.4fr_0.6fr]">
		<MotionReveal className="glass p-8">
			<h2 class="text-2xl font-semibold text-white">Footer link workflows</h2>
			<p class="mt-3 text-sm text-ink-200">Add and edit footer navigation links in modals.</p>
			{#if isAction('createFooterLink') && feedback?.success && feedback?.message}
				<p class="mt-3 text-sm text-aurora-200">{feedback?.message}</p>
			{/if}
			<button
				class="nav-pill mt-6 border-ink-100 bg-ink-900 text-white"
				type="button"
				on:click={() => (isCreateModalOpen = true)}
			>
				Add link
			</button>
		</MotionReveal>
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold text-white">
				Footer links <span class="text-sm font-normal text-ink-200">({data.footerLinks.length})</span>
			</h2>
			{#if data.footerLinks.length}
				{#each data.footerLinks as link}
					<MotionReveal className="card space-y-4">
						{#if isAction('updateFooterLink') && feedback?.itemId === link.id && feedback?.message}
							<p class={`text-xs ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
								{feedback?.message}
							</p>
						{/if}
						{#if isAction('deleteFooterLink') && feedback?.itemId === link.id && feedback?.message}
							<p class={`text-xs ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
								{feedback?.message}
							</p>
						{/if}
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="space-y-2">
								<div class="flex flex-wrap items-center gap-2">
									<h3 class="text-lg font-semibold text-white">{link.label}</h3>
									<span class="badge">{link.section}</span>
									<span class="badge">{link.external === 1 ? 'External' : 'Internal'}</span>
								</div>
								<p class="text-sm text-ink-200 break-all">{link.href ?? 'No href set'}</p>
								<p class="text-xs uppercase tracking-[0.2em] text-ink-300">Sort {link.sort}</p>
							</div>
							<div class="flex flex-wrap gap-2">
								{#if link.href}
									<a class="nav-pill" href={link.href} target="_blank" rel="noreferrer noopener">Open</a>
								{/if}
								<button
									class="nav-pill border-ink-100 bg-ink-900 text-white"
									type="button"
									on:click={() => (editingLinkId = link.id)}
								>
									Edit
								</button>
								<button class="nav-pill" type="button" on:click={() => (deletingLinkId = link.id)}>
									Delete
								</button>
							</div>
						</div>
					</MotionReveal>

					<AdminModal
						open={editingLinkId === link.id}
						title={`Edit footer link: ${link.label}`}
						description="Update footer navigation details."
						on:close={closeEditModal}
					>
						{#if isAction('updateFooterLink') && feedback?.itemId === link.id && feedback?.message}
							<p class={`mb-4 text-sm ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
								{feedback?.message}
							</p>
						{/if}
						<form class="space-y-4" method="POST" action="?/updateFooterLink">
							<input type="hidden" name="csrfToken" value={data.csrfToken} />
							<input type="hidden" name="id" value={link.id} />
							<div>
								<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`footer-section-${link.id}`}>
									Section
								</label>
								<input
									id={`footer-section-${link.id}`}
									name="section"
									value={link.section}
									required
									maxlength="40"
									class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
									aria-invalid={Boolean(fieldError('updateFooterLink', 'section', link.id))}
								/>
								{#if fieldError('updateFooterLink', 'section', link.id)}
									<p class="mt-2 text-xs text-red-200">{fieldError('updateFooterLink', 'section', link.id)}</p>
								{/if}
							</div>
							<div>
								<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`footer-label-${link.id}`}>
									Label
								</label>
								<input
									id={`footer-label-${link.id}`}
									name="label"
									value={link.label}
									required
									maxlength="80"
									class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
									aria-invalid={Boolean(fieldError('updateFooterLink', 'label', link.id))}
								/>
								{#if fieldError('updateFooterLink', 'label', link.id)}
									<p class="mt-2 text-xs text-red-200">{fieldError('updateFooterLink', 'label', link.id)}</p>
								{/if}
							</div>
							<div>
								<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`footer-href-${link.id}`}>
									Href
								</label>
								<input
									id={`footer-href-${link.id}`}
									name="href"
									value={link.href ?? ''}
									maxlength="2048"
									type="url"
									inputmode="url"
									class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
									aria-invalid={Boolean(fieldError('updateFooterLink', 'href', link.id))}
								/>
								{#if fieldError('updateFooterLink', 'href', link.id)}
									<p class="mt-2 text-xs text-red-200">{fieldError('updateFooterLink', 'href', link.id)}</p>
								{/if}
							</div>
							<div class="grid gap-4 md:grid-cols-2">
								<div class="flex items-center gap-3 text-sm text-ink-200">
									<input type="hidden" name="external" value="0" />
									<input
										id={`footer-external-${link.id}`}
										name="external"
										type="checkbox"
										value="1"
										class="h-4 w-4"
										checked={link.external === 1}
									/>
									<label for={`footer-external-${link.id}`}>External</label>
								</div>
								<div>
									<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`footer-sort-${link.id}`}>
										Sort order
									</label>
									<input
										id={`footer-sort-${link.id}`}
										name="sort"
										type="number"
										value={link.sort}
										class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
									/>
								</div>
							</div>
							<div class="flex flex-wrap gap-3">
								<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Save link</button>
								<button class="nav-pill" type="button" on:click={closeEditModal}>Cancel</button>
							</div>
						</form>
					</AdminModal>

					<AdminModal
						open={deletingLinkId === link.id}
						title={`Delete footer link: ${link.label}?`}
						description="This removes the link from footer navigation."
						on:close={closeDeleteModal}
						maxWidthClass="max-w-2xl"
					>
						<form class="space-y-4" method="POST" action="?/deleteFooterLink">
							<input type="hidden" name="csrfToken" value={data.csrfToken} />
							<input type="hidden" name="id" value={link.id} />
							<p class="text-sm text-ink-200 break-all">{link.href ?? 'No href set'}</p>
							<div class="flex flex-wrap gap-3">
								<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Delete link</button>
								<button class="nav-pill" type="button" on:click={closeDeleteModal}>Cancel</button>
							</div>
						</form>
					</AdminModal>
				{/each}
			{:else}
				<div class="card text-sm text-ink-200">No footer links yet.</div>
			{/if}
		</div>
	</div>
</section>

<AdminModal
	open={isCreateModalOpen}
	title="Add footer link"
	description="Create a new footer navigation item."
	on:close={closeCreateModal}
>
	{#if isAction('createFooterLink') && feedback?.message}
		<p class={`mb-4 text-sm ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
			{feedback?.message}
		</p>
	{/if}
	<form class="space-y-4" method="POST" action="?/createFooterLink">
		<input type="hidden" name="csrfToken" value={data.csrfToken} />
		<div>
			<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="footerSection">
				Section
			</label>
			<input
				id="footerSection"
				name="section"
				required
				maxlength="40"
				class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
				aria-invalid={Boolean(fieldError('createFooterLink', 'section'))}
			/>
			{#if fieldError('createFooterLink', 'section')}
				<p class="mt-2 text-xs text-red-200">{fieldError('createFooterLink', 'section')}</p>
			{/if}
		</div>
		<div>
			<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="footerLabel">
				Label
			</label>
			<input
				id="footerLabel"
				name="label"
				required
				maxlength="80"
				class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
				aria-invalid={Boolean(fieldError('createFooterLink', 'label'))}
			/>
			{#if fieldError('createFooterLink', 'label')}
				<p class="mt-2 text-xs text-red-200">{fieldError('createFooterLink', 'label')}</p>
			{/if}
		</div>
		<div>
			<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="footerHref">
				Href
			</label>
			<input
				id="footerHref"
				name="href"
				maxlength="2048"
				type="url"
				inputmode="url"
				class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
				aria-invalid={Boolean(fieldError('createFooterLink', 'href'))}
			/>
			{#if fieldError('createFooterLink', 'href')}
				<p class="mt-2 text-xs text-red-200">{fieldError('createFooterLink', 'href')}</p>
			{/if}
		</div>
		<div class="grid gap-4 md:grid-cols-2">
			<div class="flex items-center gap-3 text-sm text-ink-200">
				<input type="hidden" name="external" value="0" />
				<input id="footerExternal" name="external" type="checkbox" value="1" class="h-4 w-4" />
				<label for="footerExternal">External</label>
			</div>
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="footerSort">
					Sort order
				</label>
				<input
					id="footerSort"
					name="sort"
					type="number"
					class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
				/>
			</div>
		</div>
		<div class="flex flex-wrap gap-3">
			<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Add link</button>
			<button class="nav-pill" type="button" on:click={closeCreateModal}>Cancel</button>
		</div>
	</form>
</AdminModal>
