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

	let searchQuery = '';
	let categoryFilter = 'all';
	let isCreateModalOpen = feedback?.action === 'createStack' && feedback?.success !== true;
	let editingItemId: number | null =
		feedback?.action === 'updateStack' && feedback?.success !== true ? (feedback.itemId ?? null) : null;
	let deletingItemId: number | null =
		feedback?.action === 'deleteStack' && feedback?.success !== true ? (feedback.itemId ?? null) : null;
	let draggedId: number | null = null;
	let dropTargetId: number | null = null;
	let orderValue = data.stackItems.map((item) => item.id).join(',');
	let orderedItems = data.stackItems.map((item) => ({ ...item }));
	let reorderForm: HTMLFormElement;

	$: categories = Array.from(
		new Set(orderedItems.map((item) => item.category?.trim()).filter((value): value is string => Boolean(value)))
	).sort((a, b) => a.localeCompare(b));

	$: normalizedQuery = searchQuery.trim().toLowerCase();
	$: filteredItems = orderedItems.filter((item) => {
		const itemCategory = item.category?.trim() ?? '';
		const matchesCategory = categoryFilter === 'all' || itemCategory === categoryFilter;
		if (!matchesCategory) return false;
		if (!normalizedQuery) return true;
		return [item.label, item.detail ?? '', itemCategory].join(' ').toLowerCase().includes(normalizedQuery);
	});
	$: canDragReorder = normalizedQuery.length === 0 && categoryFilter === 'all';

	const closeCreateModal = () => {
		isCreateModalOpen = false;
	};

	const closeEditModal = () => {
		editingItemId = null;
	};

	const closeDeleteModal = () => {
		deletingItemId = null;
	};

	const dragStart = (id: number) => {
		if (!canDragReorder) return;
		draggedId = id;
	};

	const dragOver = (event: DragEvent, id: number) => {
		if (!canDragReorder || draggedId === null || draggedId === id) return;
		event.preventDefault();
		dropTargetId = id;
	};

	const dragEnd = () => {
		draggedId = null;
		dropTargetId = null;
	};

	const applyReorder = (targetId: number) => {
		if (!canDragReorder || draggedId === null || draggedId === targetId) return;
		const fromIndex = orderedItems.findIndex((item) => item.id === draggedId);
		const toIndex = orderedItems.findIndex((item) => item.id === targetId);
		if (fromIndex === -1 || toIndex === -1) return;

		const next = [...orderedItems];
		const [moved] = next.splice(fromIndex, 1);
		next.splice(toIndex, 0, moved);
		orderedItems = next;
		orderValue = orderedItems.map((item) => item.id).join(',');
		reorderForm.requestSubmit();
		dragEnd();
	};
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
			<h2 class="text-2xl font-semibold text-white">Stack workflows</h2>
			<p class="mt-3 text-sm text-ink-200">Use modals to add and edit stack entries while keeping reorder tools visible.</p>
			{#if isAction('createStack') && feedback?.success && feedback?.message}
				<p class="mt-3 text-sm text-aurora-200">{feedback?.message}</p>
			{/if}
			<button
				class="nav-pill mt-6 border-ink-100 bg-ink-900 text-white"
				type="button"
				on:click={() => (isCreateModalOpen = true)}
			>
				Add stack item
			</button>
		</MotionReveal>
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold text-white">
				Stack items <span class="text-sm font-normal text-ink-200">({data.stackItems.length})</span>
			</h2>
			{#if isAction('reorderStack') && feedback?.message}
				<p class={`text-sm ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
					{feedback?.message}
				</p>
			{/if}
			{#if data.stackItems.length}
				<div class="card grid gap-4">
					<div class="grid gap-4 md:grid-cols-[1fr_220px]">
						<input
							bind:value={searchQuery}
							placeholder="Search by label, detail, or category"
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						/>
						<select
							bind:value={categoryFilter}
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						>
							<option value="all">All categories</option>
							{#each categories as category}
								<option value={category}>{category}</option>
							{/each}
						</select>
					</div>
					<p class="text-xs text-ink-200">
						Showing {filteredItems.length} of {orderedItems.length}. Drag and drop is enabled only when no search/category filter is active.
					</p>
				</div>

				<form method="POST" action="?/reorderStack" bind:this={reorderForm} class="hidden">
					<input type="hidden" name="csrfToken" value={data.csrfToken} />
					<input type="hidden" name="order" bind:value={orderValue} />
				</form>

				{#if filteredItems.length}
					<div class="space-y-3">
						{#each filteredItems as item}
							<div
								class={`card grid gap-3 ${dropTargetId === item.id ? 'border-aurora-200/70' : ''}`}
								role="listitem"
								draggable={canDragReorder}
								on:dragstart={() => dragStart(item.id)}
								on:dragover={(event) => dragOver(event, item.id)}
								on:drop={() => applyReorder(item.id)}
								on:dragend={dragEnd}
							>
								{#if isAction('updateStack') && feedback?.success && feedback?.itemId === item.id && feedback?.message}
									<p class="text-xs text-aurora-200">{feedback?.message}</p>
								{/if}
								{#if isAction('deleteStack') && feedback?.itemId === item.id && feedback?.message}
									<p class={`text-xs ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
										{feedback?.message}
									</p>
								{/if}
								<div class="flex flex-wrap items-start justify-between gap-3">
									<div class="space-y-2">
										<div class="flex flex-wrap items-center gap-2">
											<h3 class="text-lg font-semibold text-white">{item.label}</h3>
											{#if item.category}
												<span class="badge">{item.category}</span>
											{/if}
											<span class="text-xs text-ink-200">Sort {item.sort}</span>
										</div>
										{#if item.detail}
											<p class="text-sm text-ink-200">{item.detail}</p>
										{/if}
									</div>
									<div class="flex flex-wrap gap-2">
										{#if canDragReorder}
											<span class="nav-pill cursor-move text-xs">Drag</span>
										{/if}
										<button
											class="nav-pill border-ink-100 bg-ink-900 text-white"
											type="button"
											on:click={() => (editingItemId = item.id)}
										>
											Edit
										</button>
										<button class="nav-pill" type="button" on:click={() => (deletingItemId = item.id)}>
											Delete
										</button>
									</div>
								</div>
							</div>

							<AdminModal
								open={editingItemId === item.id}
								title={`Edit stack: ${item.label}`}
								description="Update labels, categories, and sorting without leaving the list."
								on:close={closeEditModal}
							>
								{#if isAction('updateStack') && feedback?.itemId === item.id && feedback?.message}
									<p class={`mb-4 text-sm ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
										{feedback?.message}
									</p>
								{/if}
								<form class="grid gap-4" method="POST" action="?/updateStack">
									<input type="hidden" name="csrfToken" value={data.csrfToken} />
									<input type="hidden" name="id" value={item.id} />
									<div class="grid gap-4 md:grid-cols-2">
										<div>
											<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`label-${item.id}`}>
												Label
											</label>
											<input
												id={`label-${item.id}`}
												name="label"
												value={item.label}
												required
												class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
												aria-invalid={Boolean(fieldError('updateStack', 'label', item.id))}
											/>
											{#if fieldError('updateStack', 'label', item.id)}
												<p class="mt-2 text-xs text-red-200">{fieldError('updateStack', 'label', item.id)}</p>
											{/if}
										</div>
										<div>
											<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`category-${item.id}`}>
												Category
											</label>
											<input
												id={`category-${item.id}`}
												name="category"
												value={item.category ?? ''}
												class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
											/>
										</div>
									</div>
									<div>
										<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`detail-${item.id}`}>
											Description
										</label>
										<input
											id={`detail-${item.id}`}
											name="detail"
											value={item.detail ?? ''}
											class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
										/>
									</div>
									<div>
										<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`sort-${item.id}`}>
											Sort order
										</label>
										<input
											id={`sort-${item.id}`}
											name="sort"
											type="number"
											value={item.sort}
											class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
										/>
									</div>
									<div class="flex flex-wrap gap-3">
										<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Save stack</button>
										<button class="nav-pill" type="button" on:click={closeEditModal}>Cancel</button>
									</div>
								</form>
							</AdminModal>

							<AdminModal
								open={deletingItemId === item.id}
								title={`Delete stack item: ${item.label}?`}
								description="This permanently removes the stack item."
								on:close={closeDeleteModal}
								maxWidthClass="max-w-2xl"
							>
								<form class="space-y-4" method="POST" action="?/deleteStack">
									<input type="hidden" name="csrfToken" value={data.csrfToken} />
									<input type="hidden" name="id" value={item.id} />
									<p class="text-sm text-ink-200">Category: {item.category ?? 'Uncategorized'}</p>
									<div class="flex flex-wrap gap-3">
										<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Delete stack item</button>
										<button class="nav-pill" type="button" on:click={closeDeleteModal}>Cancel</button>
									</div>
								</form>
							</AdminModal>
						{/each}
					</div>
				{:else}
					<div class="card text-sm text-ink-200">No stack items match the current search/filter.</div>
				{/if}
			{:else}
				<div class="card text-sm text-ink-200">No stack items yet.</div>
			{/if}
		</div>
	</div>
</section>

<AdminModal
	open={isCreateModalOpen}
	title="Add stack item"
	description="Create a new stack entry and keep list context visible."
	on:close={closeCreateModal}
>
	{#if isAction('createStack') && feedback?.message}
		<p class={`mb-4 text-sm ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
			{feedback?.message}
		</p>
	{/if}
	<form class="space-y-4" method="POST" action="?/createStack">
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
			<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="stackCategory">
				Category
			</label>
			<input
				id="stackCategory"
				name="category"
				placeholder="Language, Runtime, Motion, Tooling..."
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
		<div class="flex flex-wrap gap-3">
			<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Add stack</button>
			<button class="nav-pill" type="button" on:click={closeCreateModal}>Cancel</button>
		</div>
	</form>
</AdminModal>
