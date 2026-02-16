<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import AdminNav from '$lib/components/AdminNav.svelte';
	import AdminModal from '$lib/components/AdminModal.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

	type FormFeedback = {
		action?: string;
		success?: boolean;
		message?: string;
		fieldErrors?: Record<string, string>;
		itemId?: number;
	};

	const feedback = form as FormFeedback | undefined;
	const isAction = (action: string) => feedback?.action === action;
	const fieldError = (action: string, field: string, itemId?: number) =>
		feedback?.action === action && (itemId === undefined || feedback?.itemId === itemId)
			? feedback?.fieldErrors?.[field]
			: undefined;

	let createModalOpen = feedback?.action === 'createPlayset' && feedback?.success !== true;
	let editingPlaysetId: number | null =
		feedback?.action === 'updatePlayset' && feedback?.success !== true ? (feedback.itemId ?? null) : null;
	let deletePlaysetId: number | null = null;
</script>

<SeoHead title={formatTitle('Admin | Playground')} description="Manage playsets, live sessions, sockets, and logs." />

<section class="section-pad">
	<div class="space-y-4">
		<p class="badge">Admin</p>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">Playground control plane</h1>
		<p class="max-w-3xl text-lg text-ink-200">
			Manage playsets, monitor websocket connections, and terminate live usage in real time.
		</p>
		<AdminNav />
	</div>
</section>

<section class="section-pad">
	<div class="grid gap-6 md:grid-cols-5">
		<MotionReveal className="card space-y-2">
			<p class="text-xs uppercase tracking-[0.2em] text-ink-200">Runtime mode</p>
			<p class="text-2xl font-semibold text-white">{data.playgroundConfig.runtimeMode}</p>
		</MotionReveal>
		<MotionReveal delay={0.04} className="card space-y-2">
			<p class="text-xs uppercase tracking-[0.2em] text-ink-200">Live sessions</p>
			<p class="text-2xl font-semibold text-white">{data.counts.activeSessions}</p>
		</MotionReveal>
		<MotionReveal delay={0.08} className="card space-y-2">
			<p class="text-xs uppercase tracking-[0.2em] text-ink-200">Active sockets</p>
			<p class="text-2xl font-semibold text-white">{data.counts.activeSocketConnections}</p>
		</MotionReveal>
		<MotionReveal delay={0.12} className="card space-y-2">
			<p class="text-xs uppercase tracking-[0.2em] text-ink-200">Total sessions</p>
			<p class="text-2xl font-semibold text-white">{data.counts.totalSessions}</p>
		</MotionReveal>
		<MotionReveal delay={0.16} className="card space-y-2">
			<p class="text-xs uppercase tracking-[0.2em] text-ink-200">Failed sessions</p>
			<p class="text-2xl font-semibold text-white">{data.counts.failedSessions}</p>
		</MotionReveal>
	</div>
</section>

<section class="section-pad">
	<div class="grid gap-6 lg:grid-cols-[0.55fr_0.45fr]">
		<MotionReveal className="glass p-8">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div class="space-y-2">
					<p class="text-xs uppercase tracking-[0.2em] text-ink-200">Playsets</p>
					<h2 class="text-2xl font-semibold text-white">
						Configured playsets <span class="text-sm font-normal text-ink-200">({data.playsets.length})</span>
					</h2>
					<p class="text-sm text-ink-200">Websocket endpoint: {data.playgroundConfig.wsUrl}</p>
				</div>
				<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="button" on:click={() => (createModalOpen = true)}>
					Create playset
				</button>
			</div>
			{#if feedback?.message && ['createPlayset', 'updatePlayset', 'deletePlayset', 'stopByPlayset'].includes(feedback?.action ?? '')}
				<p class={`mt-4 text-sm ${feedback?.success ? 'text-aurora-200' : 'text-red-200'}`}>
					{feedback?.message}
				</p>
			{/if}
			<div class="mt-6 space-y-4">
				{#if data.playsets.length}
					{#each data.playsets as playset}
						<div class="rounded-2xl border border-ink-200/30 bg-white/5 p-4">
							<div class="flex flex-wrap items-start justify-between gap-3">
								<div class="space-y-1">
									<p class="text-base font-semibold text-white">{playset.name}</p>
									<p class="text-xs uppercase tracking-[0.2em] text-ink-300">{playset.runtime} • {playset.slug}</p>
									<p class="text-sm text-ink-200">{playset.description}</p>
									<p class="text-xs text-ink-300">
										{playset.dockerImage} | max {playset.maxSessions} | idle {playset.idleTimeoutSeconds}s
									</p>
								</div>
								<div class="flex flex-wrap gap-2">
									<form method="POST" action="?/stopByPlayset">
										<input type="hidden" name="csrfToken" value={data.csrfToken} />
										<input type="hidden" name="playsetId" value={playset.id} />
										<button class="nav-pill" type="submit">Stop live</button>
									</form>
									<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="button" on:click={() => (editingPlaysetId = playset.id)}>
										Edit
									</button>
									<button class="nav-pill" type="button" on:click={() => (deletePlaysetId = playset.id)}>
										Delete
									</button>
								</div>
							</div>
						</div>

						<AdminModal
							open={editingPlaysetId === playset.id}
							title={`Edit playset: ${playset.name}`}
							description="Update runtime metadata and limits."
							on:close={() => (editingPlaysetId = null)}
						>
							<form class="space-y-4" method="POST" action="?/updatePlayset">
								<input type="hidden" name="csrfToken" value={data.csrfToken} />
								<input type="hidden" name="id" value={playset.id} />
								<div class="grid gap-4 md:grid-cols-2">
									<div>
										<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`edit-name-${playset.id}`}>
											Name
										</label>
										<input id={`edit-name-${playset.id}`} name="name" value={playset.name} maxlength="100" class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" />
										{#if fieldError('updatePlayset', 'name', playset.id)}
											<p class="mt-2 text-xs text-red-200">{fieldError('updatePlayset', 'name', playset.id)}</p>
										{/if}
									</div>
									<div>
										<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`edit-slug-${playset.id}`}>
											Slug
										</label>
										<input id={`edit-slug-${playset.id}`} name="slug" value={playset.slug} maxlength="100" class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" />
										{#if fieldError('updatePlayset', 'slug', playset.id)}
											<p class="mt-2 text-xs text-red-200">{fieldError('updatePlayset', 'slug', playset.id)}</p>
										{/if}
									</div>
								</div>
								<div class="grid gap-4 md:grid-cols-2">
									<div>
										<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`edit-runtime-${playset.id}`}>
											Runtime
										</label>
										<input id={`edit-runtime-${playset.id}`} name="runtime" value={playset.runtime} maxlength="40" class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" />
										{#if fieldError('updatePlayset', 'runtime', playset.id)}
											<p class="mt-2 text-xs text-red-200">{fieldError('updatePlayset', 'runtime', playset.id)}</p>
										{/if}
									</div>
									<div>
										<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`edit-image-${playset.id}`}>
											Docker image
										</label>
										<input id={`edit-image-${playset.id}`} name="dockerImage" value={playset.dockerImage} maxlength="200" class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" />
										{#if fieldError('updatePlayset', 'dockerImage', playset.id)}
											<p class="mt-2 text-xs text-red-200">{fieldError('updatePlayset', 'dockerImage', playset.id)}</p>
										{/if}
									</div>
								</div>
								<div>
									<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`edit-description-${playset.id}`}>
										Description
									</label>
									<textarea id={`edit-description-${playset.id}`} name="description" rows="3" maxlength="500" class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white">{playset.description}</textarea>
									{#if fieldError('updatePlayset', 'description', playset.id)}
										<p class="mt-2 text-xs text-red-200">{fieldError('updatePlayset', 'description', playset.id)}</p>
									{/if}
								</div>
								<div class="grid gap-4 md:grid-cols-2">
									<div>
										<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`edit-start-${playset.id}`}>
											Start command
										</label>
										<input id={`edit-start-${playset.id}`} name="startCommand" value={playset.startCommand ?? ''} maxlength="800" class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" />
									</div>
									<div>
										<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`edit-default-${playset.id}`}>
											Default command
										</label>
										<input id={`edit-default-${playset.id}`} name="defaultCommand" value={playset.defaultCommand ?? ''} maxlength="800" class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" />
									</div>
								</div>
								<div class="grid gap-4 md:grid-cols-3">
									<div>
										<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`edit-max-${playset.id}`}>
											Max sessions
										</label>
										<input id={`edit-max-${playset.id}`} name="maxSessions" type="number" min="1" max="100" value={playset.maxSessions} class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" />
									</div>
									<div>
										<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for={`edit-idle-${playset.id}`}>
											Idle timeout (s)
										</label>
										<input id={`edit-idle-${playset.id}`} name="idleTimeoutSeconds" type="number" min="30" max="86400" value={playset.idleTimeoutSeconds} class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" />
									</div>
									<label class="mt-7 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink-200">
										<input type="checkbox" name="enabled" value="1" checked={playset.enabled === 1} />
										Enabled
									</label>
								</div>
								<div class="flex justify-end">
									<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Save playset</button>
								</div>
							</form>
						</AdminModal>

						<AdminModal
							open={deletePlaysetId === playset.id}
							title={`Delete playset: ${playset.name}`}
							description="This removes the playset definition. Existing session records stay in logs."
							on:close={() => (deletePlaysetId = null)}
						>
							<form class="space-y-4" method="POST" action="?/deletePlayset">
								<input type="hidden" name="csrfToken" value={data.csrfToken} />
								<input type="hidden" name="id" value={playset.id} />
								<p class="text-sm text-ink-200">Delete this playset now?</p>
								<div class="flex justify-end gap-3">
									<button class="nav-pill" type="button" on:click={() => (deletePlaysetId = null)}>Cancel</button>
									<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Delete</button>
								</div>
							</form>
						</AdminModal>
					{/each}
				{:else}
					<p class="text-sm text-ink-200">No playsets configured.</p>
				{/if}
			</div>
		</MotionReveal>

		<MotionReveal delay={0.08} className="glass p-8 space-y-5">
			<p class="text-xs uppercase tracking-[0.2em] text-ink-200">Live controls</p>
			<h2 class="text-2xl font-semibold text-white">Session shutdown actions</h2>
			{#if feedback?.message && ['stopBySession', 'stopBySocket', 'stopAll'].includes(feedback?.action ?? '')}
				<p class={`text-sm ${feedback?.success ? 'text-aurora-200' : 'text-red-200'}`}>{feedback?.message}</p>
			{/if}
			<form class="space-y-3" method="POST" action="?/stopBySession">
				<input type="hidden" name="csrfToken" value={data.csrfToken} />
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="stop-session-id">Stop by session id</label>
				<input id="stop-session-id" name="sessionId" class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" placeholder="session UUID" />
				<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Stop session</button>
			</form>
			<form class="space-y-3" method="POST" action="?/stopBySocket">
				<input type="hidden" name="csrfToken" value={data.csrfToken} />
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="stop-ws-id">Stop by websocket id</label>
				<input id="stop-ws-id" name="wsId" class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" placeholder="websocket UUID" />
				<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Stop websocket session</button>
			</form>
			<form method="POST" action="?/stopAll">
				<input type="hidden" name="csrfToken" value={data.csrfToken} />
				<button class="nav-pill" type="submit">Stop all live sessions</button>
			</form>
		</MotionReveal>
	</div>
</section>

<section class="section-pad">
	<div class="grid gap-6 lg:grid-cols-2">
		<MotionReveal className="glass p-6">
			<h2 class="text-2xl font-semibold text-white">Live runtime sessions</h2>
			<div class="mt-4 space-y-3">
				{#if data.runtime.sessions.length}
					{#each data.runtime.sessions as item}
						<div class="rounded-2xl border border-ink-200/30 bg-white/5 p-4 text-sm text-ink-200">
							<div class="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-ink-300">
								<span>{item.status}</span>
								<span>{item.createdAt}</span>
							</div>
							<p class="mt-2 text-white">{item.playsetName} ({item.playsetRuntime})</p>
							<p class="mt-1">Session: {item.sessionId}</p>
							<p class="mt-1">Sockets: {item.socketCount}</p>
							<div class="mt-3 flex justify-end">
								<form method="POST" action="?/stopBySession">
									<input type="hidden" name="csrfToken" value={data.csrfToken} />
									<input type="hidden" name="sessionId" value={item.sessionId} />
									<button class="nav-pill" type="submit">Stop</button>
								</form>
							</div>
						</div>
					{/each}
				{:else}
					<p class="text-sm text-ink-200">No live sessions in memory.</p>
				{/if}
			</div>
		</MotionReveal>

		<MotionReveal delay={0.08} className="glass p-6">
			<h2 class="text-2xl font-semibold text-white">Live websocket connections</h2>
			<div class="mt-4 space-y-3">
				{#if data.runtime.sockets.length}
					{#each data.runtime.sockets as item}
						<div class="rounded-2xl border border-ink-200/30 bg-white/5 p-4 text-sm text-ink-200">
							<p class="text-white">{item.wsId}</p>
							<p class="mt-1">Session: {item.sessionId}</p>
							<p class="mt-1">Remote: {item.remoteAddress ?? 'unknown'}</p>
							<div class="mt-3 flex justify-end">
								<form method="POST" action="?/stopBySocket">
									<input type="hidden" name="csrfToken" value={data.csrfToken} />
									<input type="hidden" name="wsId" value={item.wsId} />
									<button class="nav-pill" type="submit">Stop session</button>
								</form>
							</div>
						</div>
					{/each}
				{:else}
					<p class="text-sm text-ink-200">No live websocket connections.</p>
				{/if}
			</div>
		</MotionReveal>
	</div>
</section>

<section class="section-pad">
	<div class="grid gap-6 lg:grid-cols-2">
		<MotionReveal className="glass p-6">
			<h2 class="text-2xl font-semibold text-white">Recent sessions</h2>
			<div class="mt-4 max-h-[28rem] space-y-3 overflow-auto pr-1">
				{#if data.recentSessions.length}
					{#each data.recentSessions as item}
						<div class="rounded-2xl border border-ink-200/30 bg-white/5 p-4 text-sm text-ink-200">
							<div class="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-ink-300">
								<span>{item.status}</span>
								<span>{item.createdAt}</span>
							</div>
							<p class="mt-2 text-white">{item.playsetName} ({item.playsetRuntime})</p>
							<p class="mt-1">Session: {item.sessionId}</p>
							{#if item.reason}
								<p class="mt-1">Reason: {item.reason}</p>
							{/if}
						</div>
					{/each}
				{:else}
					<p class="text-sm text-ink-200">No session records yet.</p>
				{/if}
			</div>
		</MotionReveal>

		<MotionReveal delay={0.08} className="glass p-6">
			<h2 class="text-2xl font-semibold text-white">Recent logs</h2>
			<div class="mt-4 max-h-[28rem] space-y-3 overflow-auto pr-1">
				{#if data.recentLogs.length}
					{#each data.recentLogs as log}
						<div class="rounded-2xl border border-ink-200/30 bg-white/5 p-4 text-sm text-ink-200">
							<div class="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-ink-300">
								<span>{log.level}</span>
								<span>{log.createdAt}</span>
							</div>
							<p class="mt-2 text-white">{log.event}</p>
							<p class="mt-1">{log.message}</p>
							<p class="mt-1 text-xs text-ink-300">Session: {log.sessionId} {log.wsId ? `| WS: ${log.wsId}` : ''}</p>
						</div>
					{/each}
				{:else}
					<p class="text-sm text-ink-200">No playground logs yet.</p>
				{/if}
			</div>
		</MotionReveal>
	</div>
</section>

<AdminModal
	open={createModalOpen}
	title="Create playset"
	description="Define a new docker-backed playground runtime."
	on:close={() => (createModalOpen = false)}
>
	<form class="space-y-4" method="POST" action="?/createPlayset">
		<input type="hidden" name="csrfToken" value={data.csrfToken} />
		<div class="grid gap-4 md:grid-cols-2">
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="create-playset-name">Name</label>
				<input id="create-playset-name" name="name" maxlength="100" class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" />
				{#if fieldError('createPlayset', 'name')}
					<p class="mt-2 text-xs text-red-200">{fieldError('createPlayset', 'name')}</p>
				{/if}
			</div>
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="create-playset-slug">Slug</label>
				<input id="create-playset-slug" name="slug" maxlength="100" class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" placeholder="node-shell" />
				{#if fieldError('createPlayset', 'slug')}
					<p class="mt-2 text-xs text-red-200">{fieldError('createPlayset', 'slug')}</p>
				{/if}
			</div>
		</div>
		<div class="grid gap-4 md:grid-cols-2">
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="create-playset-runtime">Runtime</label>
				<input id="create-playset-runtime" name="runtime" maxlength="40" class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" placeholder="node" />
				{#if fieldError('createPlayset', 'runtime')}
					<p class="mt-2 text-xs text-red-200">{fieldError('createPlayset', 'runtime')}</p>
				{/if}
			</div>
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="create-playset-image">Docker image</label>
				<input id="create-playset-image" name="dockerImage" maxlength="200" class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" placeholder="node:22-alpine" />
				{#if fieldError('createPlayset', 'dockerImage')}
					<p class="mt-2 text-xs text-red-200">{fieldError('createPlayset', 'dockerImage')}</p>
				{/if}
			</div>
		</div>
		<div>
			<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="create-playset-description">Description</label>
			<textarea id="create-playset-description" name="description" rows="3" maxlength="500" class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"></textarea>
			{#if fieldError('createPlayset', 'description')}
				<p class="mt-2 text-xs text-red-200">{fieldError('createPlayset', 'description')}</p>
			{/if}
		</div>
		<div class="grid gap-4 md:grid-cols-2">
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="create-playset-start">Start command</label>
				<input id="create-playset-start" name="startCommand" maxlength="800" class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" value="tail -f /dev/null" />
			</div>
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="create-playset-default">Default command</label>
				<input id="create-playset-default" name="defaultCommand" maxlength="800" class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" />
			</div>
		</div>
		<div class="grid gap-4 md:grid-cols-3">
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="create-playset-max">Max sessions</label>
				<input id="create-playset-max" name="maxSessions" type="number" min="1" max="100" value="5" class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" />
				{#if fieldError('createPlayset', 'maxSessions')}
					<p class="mt-2 text-xs text-red-200">{fieldError('createPlayset', 'maxSessions')}</p>
				{/if}
			</div>
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="create-playset-idle">Idle timeout (s)</label>
				<input id="create-playset-idle" name="idleTimeoutSeconds" type="number" min="30" max="86400" value="900" class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white" />
				{#if fieldError('createPlayset', 'idleTimeoutSeconds')}
					<p class="mt-2 text-xs text-red-200">{fieldError('createPlayset', 'idleTimeoutSeconds')}</p>
				{/if}
			</div>
			<label class="mt-7 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink-200">
				<input type="checkbox" name="enabled" value="1" checked />
				Enabled
			</label>
		</div>
		<div class="flex justify-end">
			<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Create playset</button>
		</div>
	</form>
</AdminModal>
