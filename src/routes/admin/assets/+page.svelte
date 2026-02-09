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
			<h2 class="text-2xl font-semibold text-white">Upload asset</h2>
			{#if isAction('createAsset') && feedback?.message}
				<p class={`mt-3 text-sm ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
					{feedback?.message}
				</p>
			{/if}
			<form class="mt-4 space-y-4" method="POST" enctype="multipart/form-data" action="?/createAsset">
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
				<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Upload</button>
			</form>
		</MotionReveal>
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold text-white">
				Assets <span class="text-sm font-normal text-ink-200">({data.assets.length})</span>
			</h2>
			{#if data.assets.length}
				{#each data.assets as asset}
					<form class="card grid gap-3" method="POST" action="?/updateAsset">
						<input type="hidden" name="csrfToken" value={data.csrfToken} />
						<input type="hidden" name="id" value={asset.id} />
						{#if isAction('updateAsset') && feedback?.itemId === asset.id && feedback?.message}
							<p class={`text-xs ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
								{feedback?.message}
							</p>
						{/if}
						<div class="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-ink-300">
							<span>{asset.mime}</span>
							<span>{formatSize(asset.size)}</span>
						</div>
						<input
							name="label"
							value={asset.label}
							required
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
						/>
						<p class="text-xs text-ink-200">{asset.filename}</p>
						<a class="link-underline" href={asset.path} target="_blank" rel="noreferrer noopener">Open file</a>
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
							<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Update</button>
							<button
								class="nav-pill"
								type="submit"
								formaction="?/deleteAsset"
								on:click={(event) => {
									if (!confirm('Delete this asset?')) event.preventDefault();
								}}
							>
								Delete
							</button>
						</div>
					</form>
				{/each}
			{:else}
				<div class="card text-sm text-ink-200">No assets yet.</div>
			{/if}
		</div>
	</div>
</section>
