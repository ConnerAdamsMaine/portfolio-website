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
		itemId?: number;
	};

	const feedback = form as FormFeedback | undefined;
	const isAction = (action: string) => feedback?.action === action;

	const formatSize = (value: number) => {
		if (!Number.isFinite(value)) return '0 B';
		if (value < 1024) return `${value} B`;
		if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
		return `${(value / (1024 * 1024)).toFixed(1)} MB`;
	};

	let isCreateModalOpen = feedback?.action === 'createAsset' && feedback?.success !== true;
	let editingAssetId: number | null =
		feedback?.action === 'updateAsset' && feedback?.success !== true ? (feedback.itemId ?? null) : null;
	let deletingAssetId: number | null =
		feedback?.action === 'deleteAsset' && feedback?.success !== true ? (feedback.itemId ?? null) : null;

	const closeCreateModal = () => {
		isCreateModalOpen = false;
	};

	const closeEditModal = () => {
		editingAssetId = null;
	};

	const closeDeleteModal = () => {
		deletingAssetId = null;
	};
</script>

<SeoHead title={formatTitle('Admin | Assets')} description="Upload and manage public assets." />

<section class="section-pad">
	<div class="space-y-4">
		<p class="badge">Admin</p>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">Assets</h1>
		<p class="max-w-2xl text-lg text-ink-200">Upload files and toggle public visibility.</p>
		<AdminNav />
	</div>
</section>

<section class="section-pad">
	<div class="grid gap-6 lg:grid-cols-[0.4fr_0.6fr]">
		<MotionReveal className="glass p-8">
			<h2 class="text-2xl font-semibold text-white">Asset workflows</h2>
			<p class="mt-3 text-sm text-ink-200">Use modals to upload, rename, and control visibility without losing list context.</p>
			{#if isAction('createAsset') && feedback?.success && feedback?.message}
				<p class="mt-3 text-sm text-aurora-200">{feedback?.message}</p>
			{/if}
			<button
				class="nav-pill mt-6 border-ink-100 bg-ink-900 text-white"
				type="button"
				on:click={() => (isCreateModalOpen = true)}
			>
				Upload asset
			</button>
		</MotionReveal>
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold text-white">
				Assets <span class="text-sm font-normal text-ink-200">({data.assets.length})</span>
			</h2>
			{#if data.assets.length}
				{#each data.assets as asset}
					<MotionReveal className="card space-y-4">
						{#if isAction('updateAsset') && feedback?.itemId === asset.id && feedback?.message}
							<p class={`text-xs ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
								{feedback?.message}
							</p>
						{/if}
						{#if isAction('deleteAsset') && feedback?.itemId === asset.id && feedback?.message}
							<p class={`text-xs ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
								{feedback?.message}
							</p>
						{/if}
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="space-y-2">
								<div class="flex flex-wrap items-center gap-2">
									<h3 class="text-lg font-semibold text-white">{asset.label}</h3>
									<span class="badge">{asset.public === 1 ? 'Public' : 'Private'}</span>
								</div>
								<p class="text-xs uppercase tracking-[0.2em] text-ink-300">{asset.mime} · {formatSize(asset.size)}</p>
								<p class="text-sm text-ink-200 break-all">{asset.filename}</p>
							</div>
							<div class="flex flex-wrap gap-2">
								<a class="nav-pill" href={asset.path} target="_blank" rel="noreferrer noopener">Open file</a>
								<button
									class="nav-pill border-ink-100 bg-ink-900 text-white"
									type="button"
									on:click={() => (editingAssetId = asset.id)}
								>
									Edit
								</button>
								<button class="nav-pill" type="button" on:click={() => (deletingAssetId = asset.id)}>
									Delete
								</button>
							</div>
						</div>
					</MotionReveal>

					<AdminModal
						open={editingAssetId === asset.id}
						title={`Edit asset: ${asset.label}`}
						description="Update the label and visibility for this file."
						on:close={closeEditModal}
					>
						{#if isAction('updateAsset') && feedback?.itemId === asset.id && feedback?.message}
							<p class={`mb-4 text-sm ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
								{feedback?.message}
							</p>
						{/if}
						<form class="space-y-4" method="POST" action="?/updateAsset">
							<input type="hidden" name="csrfToken" value={data.csrfToken} />
							<input type="hidden" name="id" value={asset.id} />
							<div>
								<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`asset-label-${asset.id}`}>
									Label
								</label>
								<input
									id={`asset-label-${asset.id}`}
									name="label"
									value={asset.label}
									required
									class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
								/>
							</div>
							<div class="flex items-center gap-3 text-sm text-ink-200">
								<input type="hidden" name="public" value="0" />
								<input
									id={`asset-public-${asset.id}`}
									name="public"
									type="checkbox"
									value="1"
									class="h-4 w-4"
									checked={asset.public === 1}
								/>
								<label for={`asset-public-${asset.id}`}>Public</label>
							</div>
							<div class="flex flex-wrap gap-3">
								<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Save asset</button>
								<button class="nav-pill" type="button" on:click={closeEditModal}>Cancel</button>
							</div>
						</form>
					</AdminModal>

					<AdminModal
						open={deletingAssetId === asset.id}
						title={`Delete asset: ${asset.label}?`}
						description="This permanently removes the file and database record."
						on:close={closeDeleteModal}
						maxWidthClass="max-w-2xl"
					>
						<form class="space-y-4" method="POST" action="?/deleteAsset">
							<input type="hidden" name="csrfToken" value={data.csrfToken} />
							<input type="hidden" name="id" value={asset.id} />
							<p class="text-sm text-ink-200 break-all">{asset.filename}</p>
							<div class="flex flex-wrap gap-3">
								<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Delete asset</button>
								<button class="nav-pill" type="button" on:click={closeDeleteModal}>Cancel</button>
							</div>
						</form>
					</AdminModal>
				{/each}
			{:else}
				<div class="card text-sm text-ink-200">No assets yet.</div>
			{/if}
		</div>
	</div>
</section>

<AdminModal
	open={isCreateModalOpen}
	title="Upload asset"
	description="Add a new file and control visibility immediately."
	on:close={closeCreateModal}
>
	{#if isAction('createAsset') && feedback?.message}
		<p class={`mb-4 text-sm ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
			{feedback?.message}
		</p>
	{/if}
	<form class="space-y-4" method="POST" enctype="multipart/form-data" action="?/createAsset">
		<input type="hidden" name="csrfToken" value={data.csrfToken} />
		<div>
			<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="assetLabel">
				Label
			</label>
			<input
				id="assetLabel"
				name="label"
				class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
				placeholder="Asset label"
			/>
		</div>
		<div>
			<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="assetFile">
				File
			</label>
			<input
				id="assetFile"
				name="file"
				required
				type="file"
				class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
			/>
		</div>
		<div class="flex items-center gap-3 text-sm text-ink-200">
			<input type="hidden" name="public" value="0" />
			<input id="assetPublic" name="public" type="checkbox" value="1" class="h-4 w-4" checked />
			<label for="assetPublic">Public</label>
		</div>
		<div class="flex flex-wrap gap-3">
			<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Upload</button>
			<button class="nav-pill" type="button" on:click={closeCreateModal}>Cancel</button>
		</div>
	</form>
</AdminModal>
