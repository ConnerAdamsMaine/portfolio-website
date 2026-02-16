<script lang="ts">
	import { onDestroy } from 'svelte';
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import AdminModal from '$lib/components/AdminModal.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import type { PlaygroundWsServerMessage } from '$lib/playground/types';
	import type { PageData } from './$types';

	export let data: PageData;

	type ConsoleLine = {
		id: string;
		timestamp: string;
		level: 'info' | 'warn' | 'error';
		message: string;
	};

	type ActiveSession = {
		sessionId: string;
		joinToken: string;
		playsetId: number;
		playsetName: string;
		playsetRuntime: string;
		wsUrl: string;
	};

	const usageRules = [
		'Interactive sessions run in disposable containers. Everything is temporary.',
		'Do not run abusive scans, crypto miners, or attempts to break container isolation.',
		'Sessions are logged for abuse prevention and can be terminated at any time.',
		'Idle sessions are automatically shut down based on playset policy.'
	];

	let selectedPlaysetId = data.playsets[0]?.id ?? null;
	let activeSession: ActiveSession | null = null;
	let websocketId: string | null = null;
	let socket: WebSocket | null = null;
	let connectionState: 'idle' | 'connecting' | 'connected' | 'closed' = 'idle';
	let command = '';
	let isStartingSession = false;
	let isRunningCommand = false;
	let hasAcceptedUsage = false;
	let usageModalOpen = true;
	let errorMessage = '';
	let consoleLines: ConsoleLine[] = [];

	const appendLine = (level: ConsoleLine['level'], message: string) => {
		const entry: ConsoleLine = {
			id: crypto.randomUUID(),
			timestamp: new Date().toISOString(),
			level,
			message
		};
		consoleLines = [entry, ...consoleLines].slice(0, 240);
	};

	const selectedPlayset = () => data.playsets.find((item) => item.id === selectedPlaysetId) ?? null;

	const closeSocket = () => {
		if (!socket) return;
		socket.close(1000, 'Closing client connection.');
		socket = null;
	};

	const handleWsMessage = (payload: PlaygroundWsServerMessage) => {
		if (payload.type === 'welcome') {
			websocketId = payload.wsId;
			connectionState = 'connected';
			appendLine('info', `Connected as websocket ${payload.wsId}.`);
			return;
		}

		if (payload.type === 'state') {
			if (payload.status === 'stopped' || payload.status === 'failed') {
				appendLine('warn', `Session state changed to ${payload.status}. ${payload.reason ?? ''}`.trim());
			}
			return;
		}

		if (payload.type === 'log') {
			const level = payload.entry.level === 'error' ? 'error' : payload.entry.level === 'warn' ? 'warn' : 'info';
			appendLine(level, payload.entry.message);
			return;
		}

		if (payload.type === 'command_result') {
			isRunningCommand = false;
			appendLine(payload.exitCode === 0 ? 'info' : 'error', `Command exited with code ${payload.exitCode}.`);
			if (payload.stdout) appendLine('info', payload.stdout);
			if (payload.stderr) appendLine('warn', payload.stderr);
			return;
		}

		if (payload.type === 'error') {
			isRunningCommand = false;
			appendLine('error', payload.message);
		}
	};

	const connectSocket = (session: ActiveSession) => {
		closeSocket();
		connectionState = 'connecting';
		websocketId = null;
		const endpoint = `${session.wsUrl}?sessionId=${encodeURIComponent(session.sessionId)}&token=${encodeURIComponent(session.joinToken)}`;
		socket = new WebSocket(endpoint);
		socket.addEventListener('open', () => {
			appendLine('info', 'Websocket handshake complete.');
		});
		socket.addEventListener('message', (event) => {
			try {
				const payload = JSON.parse(String(event.data)) as PlaygroundWsServerMessage;
				handleWsMessage(payload);
			} catch {
				appendLine('error', 'Received invalid websocket payload.');
			}
		});
		socket.addEventListener('close', () => {
			connectionState = 'closed';
			appendLine('warn', 'Websocket connection closed.');
		});
		socket.addEventListener('error', () => {
			connectionState = 'closed';
			appendLine('error', 'Websocket error.');
		});
	};

	const startSession = async (playsetId: number) => {
		if (!hasAcceptedUsage) {
			usageModalOpen = true;
			return;
		}
		errorMessage = '';
		isStartingSession = true;
		try {
			const response = await fetch('/api/playground/session', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ playsetId })
			});
			const payload = (await response.json()) as {
				ok: boolean;
				message?: string;
				session?: { sessionId: string; joinToken: string };
				playset?: { id: number; name: string; runtime: string };
				wsUrl?: string;
			};

			if (!response.ok || !payload.ok || !payload.session || !payload.playset || !payload.wsUrl) {
				errorMessage = payload.message ?? 'Unable to create session.';
				appendLine('error', errorMessage);
				return;
			}

			activeSession = {
				sessionId: payload.session.sessionId,
				joinToken: payload.session.joinToken,
				playsetId: payload.playset.id,
				playsetName: payload.playset.name,
				playsetRuntime: payload.playset.runtime,
				wsUrl: payload.wsUrl
			};
			consoleLines = [];
			appendLine('info', `Session created for ${payload.playset.name}.`);
			connectSocket(activeSession);
		} catch {
			errorMessage = 'Unable to contact the playground service.';
			appendLine('error', errorMessage);
		} finally {
			isStartingSession = false;
		}
	};

	const stopSession = async () => {
		if (!activeSession) return;
		try {
			await fetch('/api/playground/session', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					sessionId: activeSession.sessionId,
					joinToken: activeSession.joinToken
				})
			});
		} finally {
			appendLine('warn', 'Session closed by user.');
			closeSocket();
			activeSession = null;
			websocketId = null;
			connectionState = 'idle';
			isRunningCommand = false;
		}
	};

	const sendCommand = () => {
		if (!socket || socket.readyState !== WebSocket.OPEN) {
			appendLine('error', 'Websocket is not connected.');
			return;
		}
		const trimmed = command.trim();
		if (!trimmed) return;
		isRunningCommand = true;
		socket.send(JSON.stringify({ type: 'run', command: trimmed }));
		command = '';
	};

	onDestroy(() => {
		closeSocket();
	});
</script>

<SeoHead
	title={formatTitle('Playground')}
	description="Run isolated Node, Python, and Rust sandbox sessions over live websockets."
/>

<section class="section-pad">
	<div class="space-y-4">
		<p class="badge">Playground</p>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">Remote app test lab</h1>
		<p class="max-w-3xl text-lg text-ink-200">
			Start isolated runtime sessions, execute commands over websocket, and inspect live logs.
		</p>
		{#if !data.playgroundEnabled}
			<p class="rounded-2xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
				Playground runtime is currently disabled.
			</p>
		{/if}
	</div>
</section>

<section class="section-pad">
	<div class="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
		<MotionReveal className="glass p-8 space-y-5">
			<div class="space-y-2">
				<p class="text-xs uppercase tracking-[0.2em] text-ink-200">Playsets</p>
				<h2 class="text-2xl font-semibold text-white">Choose runtime</h2>
			</div>
			{#if data.playsets.length}
				<div class="space-y-3">
					{#each data.playsets as playset}
						<button
							type="button"
							class="w-full rounded-2xl border border-ink-200/30 bg-white/5 p-4 text-left transition hover:border-ink-100/70"
							class:border-ink-100={selectedPlaysetId === playset.id}
							on:click={() => (selectedPlaysetId = playset.id)}
						>
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="text-base font-semibold text-white">{playset.name}</p>
									<p class="mt-1 text-xs uppercase tracking-[0.2em] text-ink-300">{playset.runtime}</p>
								</div>
								<span class="text-xs text-ink-200">Max {playset.maxSessions}</span>
							</div>
							<p class="mt-2 text-sm text-ink-200">{playset.description}</p>
						</button>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-ink-200">No enabled playsets are available yet.</p>
			{/if}
			<div class="grid gap-3 md:grid-cols-2">
				<button
					class="nav-pill border-ink-100 bg-ink-900 text-white"
					type="button"
					disabled={!data.playgroundEnabled || isStartingSession || !selectedPlayset() || Boolean(activeSession)}
					on:click={() => selectedPlayset() && startSession(selectedPlayset()!.id)}
				>
					{isStartingSession ? 'Starting session...' : 'Start session'}
				</button>
				<button class="nav-pill" type="button" disabled={!activeSession} on:click={stopSession}>End session</button>
			</div>
			{#if errorMessage}
				<p class="text-sm text-red-200">{errorMessage}</p>
			{/if}
			<div class="rounded-2xl border border-ink-200/30 bg-white/5 p-4 text-sm text-ink-200">
				<p><span class="text-white">Mode:</span> {data.runtimeMode}</p>
				<p class="mt-1"><span class="text-white">Connection:</span> {connectionState}</p>
				{#if activeSession}
					<p class="mt-1"><span class="text-white">Session:</span> {activeSession.sessionId}</p>
					{#if websocketId}
						<p class="mt-1"><span class="text-white">Websocket:</span> {websocketId}</p>
					{/if}
				{/if}
			</div>
		</MotionReveal>

		<MotionReveal delay={0.08} className="glass p-8 space-y-5">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p class="text-xs uppercase tracking-[0.2em] text-ink-200">Console</p>
					<h2 class="text-2xl font-semibold text-white">Session terminal</h2>
				</div>
			</div>
			<form
				class="flex flex-col gap-3 md:flex-row"
				on:submit|preventDefault={sendCommand}
			>
				<input
					class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					placeholder="Enter command (example: node -v, python --version, rustc --version)"
					bind:value={command}
					disabled={!activeSession || connectionState !== 'connected' || isRunningCommand}
				/>
				<button
					class="nav-pill border-ink-100 bg-ink-900 text-white"
					type="submit"
					disabled={!activeSession || connectionState !== 'connected' || isRunningCommand}
				>
					{isRunningCommand ? 'Running...' : 'Run'}
				</button>
			</form>
			<div class="max-h-[32rem] overflow-auto rounded-2xl border border-ink-200/30 bg-ink-950/70 p-4 font-mono text-xs">
				{#if consoleLines.length}
					<ul class="space-y-3">
						{#each consoleLines as line}
							<li class="leading-relaxed" class:text-red-200={line.level === 'error'} class:text-amber-200={line.level === 'warn'} class:text-ink-200={line.level === 'info'}>
								<span class="text-ink-300">[{line.timestamp}]</span> {line.message}
							</li>
						{/each}
					</ul>
				{:else}
					<p class="text-ink-300">No logs yet. Start a session to begin streaming runtime activity.</p>
				{/if}
			</div>
		</MotionReveal>
	</div>
</section>

<AdminModal
	open={usageModalOpen}
	title="Playground usage policy"
	description="Confirm the usage policy before starting any container session."
	on:close={() => {
		if (hasAcceptedUsage) usageModalOpen = false;
	}}
>
	<div class="space-y-4 text-sm text-ink-200">
		<ul class="space-y-2">
			{#each usageRules as rule}
				<li class="rounded-xl border border-ink-200/20 bg-white/5 px-3 py-2">{rule}</li>
			{/each}
		</ul>
		<div class="flex flex-wrap justify-end gap-3">
			<button class="nav-pill" type="button" on:click={() => (usageModalOpen = false)} disabled={!hasAcceptedUsage}>
				Close
			</button>
			<button
				class="nav-pill border-ink-100 bg-ink-900 text-white"
				type="button"
				on:click={() => {
					hasAcceptedUsage = true;
					usageModalOpen = false;
				}}
			>
				I accept
			</button>
		</div>
	</div>
</AdminModal>
