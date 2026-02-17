import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import WebSocket from 'ws';
import type { RawData } from 'ws';
import type { IncomingMessage } from 'node:http';
import {
	countActivePlaygroundSessionsForPlayset,
	createPlaygroundLog,
	createPlaygroundSession,
	createPlaygroundSocketConnection,
	closePlaygroundSocketConnection,
	getPlaygroundSessionBySessionId,
	getPlaysetById,
	type Playset,
	updatePlaygroundSessionStatus
} from '$lib/server/dataStore';
import { invalidateCachedPrefix } from '$lib/server/cache';
import { playgroundConfig } from '$lib/server/playground/config';
import type { PlaygroundWsClientMessage, PlaygroundWsServerMessage } from '$lib/playground/types';

type RuntimeSessionStatus = 'starting' | 'active' | 'failed' | 'stopped';

type RuntimeSession = {
	sessionId: string;
	joinToken: string;
	playset: Playset;
	status: RuntimeSessionStatus;
	containerId: string | null;
	reason: string | null;
	createdAt: number;
	lastActivityAt: number;
	commandCount: number;
	commandWindowStartedAt: number;
	commandWindowCount: number;
	sockets: Map<string, WebSocket>;
};

type RuntimeSocket = {
	wsId: string;
	sessionId: string;
	socket: WebSocket;
	connectedAt: number;
	remoteAddress: string | null;
};

type RunCommandResult = {
	exitCode: number;
	stdout: string;
	stderr: string;
};

const execFileAsync = promisify(execFile);
const sessions = new Map<string, RuntimeSession>();
const sockets = new Map<string, RuntimeSocket>();
const invalidatePlaygroundStatusCache = () => {
	void invalidateCachedPrefix('playground:status:');
};

const safeJson = (value: unknown) => {
	try {
		return JSON.stringify(value);
	} catch {
		return null;
	}
};

const nowIso = () => new Date().toISOString();

const safeTokenEqual = (a: string, b: string) => {
	const aBuf = Buffer.from(a);
	const bBuf = Buffer.from(b);
	if (aBuf.length !== bBuf.length) return false;
	return crypto.timingSafeEqual(aBuf, bBuf);
};

const clampOutput = (value: string) => {
	if (Buffer.byteLength(value) <= playgroundConfig.maxOutputBytes) return value;
	const max = Math.max(128, playgroundConfig.maxOutputBytes - 96);
	return `${value.slice(0, max)}\n...[truncated]`;
};

const sendWsMessage = (socket: WebSocket, message: PlaygroundWsServerMessage) => {
	if (socket.readyState !== WebSocket.OPEN) return;
	socket.send(JSON.stringify(message));
};

const broadcastToSession = (session: RuntimeSession, message: PlaygroundWsServerMessage) => {
	for (const socket of session.sockets.values()) {
		sendWsMessage(socket, message);
	}
};

const emitSessionLog = (
	session: RuntimeSession,
	wsId: string | null,
	level: string,
	event: string,
	message: string,
	payload?: unknown
) => {
	const entry = {
		sessionId: session.sessionId,
		wsId,
		level,
		event,
		message,
		payload: payload === undefined ? null : safeJson(payload),
		createdAt: nowIso()
	};

	try {
		void createPlaygroundLog(session.sessionId, wsId, level, event, message, entry.payload);
	} catch (error) {
		console.error('[playground] failed to persist log', error);
	}

	broadcastToSession(session, { type: 'log', entry });
};

const sanitizeContainerName = (sessionId: string) => {
	const cleaned = sessionId.replace(/[^a-z0-9]/gi, '').toLowerCase();
	return `pg-${cleaned.slice(0, 40) || crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
};

const runDockerContainer = async (session: RuntimeSession) => {
	const startCommand = session.playset.startCommand?.trim() || 'tail -f /dev/null';
	const containerName = sanitizeContainerName(session.sessionId);
	const args = [
		'run',
		'-d',
		'--rm',
		'--network',
		'none',
		'--name',
		containerName,
		session.playset.dockerImage,
		'sh',
		'-lc',
		startCommand
	];

	try {
		const { stdout } = await execFileAsync(playgroundConfig.dockerBinary, args, {
			timeout: playgroundConfig.commandTimeoutMs,
			maxBuffer: playgroundConfig.maxOutputBytes
		});
		const containerId = stdout.trim().split(/\s+/).at(-1) ?? '';
		if (!containerId) {
			throw new Error('Docker did not return a container id.');
		}
		return containerId;
	} catch (error) {
		const err = error as NodeJS.ErrnoException & { stderr?: string };
		const stderr = typeof err.stderr === 'string' ? err.stderr.trim() : '';
		const detail = stderr || err.message || 'Unable to start docker container.';
		throw new Error(detail);
	}
};

const removeDockerContainer = async (containerId: string | null) => {
	if (!containerId) return;
	try {
		await execFileAsync(playgroundConfig.dockerBinary, ['rm', '-f', containerId], {
			timeout: playgroundConfig.commandTimeoutMs,
			maxBuffer: playgroundConfig.maxOutputBytes
		});
	} catch {
		// Container may already be gone.
	}
};

const runCommandInSession = async (session: RuntimeSession, command: string): Promise<RunCommandResult> => {
	if (playgroundConfig.runtimeMode === 'mock') {
		return {
			exitCode: 0,
			stdout: `mock:${session.playset.runtime}$ ${command}`,
			stderr: ''
		};
	}

	if (!session.containerId) {
		return {
			exitCode: 1,
			stdout: '',
			stderr: 'Session container is not available.'
		};
	}

	try {
		const { stdout, stderr } = await execFileAsync(
			playgroundConfig.dockerBinary,
			['exec', session.containerId, 'sh', '-lc', command],
			{
				timeout: playgroundConfig.commandTimeoutMs,
				maxBuffer: playgroundConfig.maxOutputBytes
			}
		);
		return {
			exitCode: 0,
			stdout: clampOutput(stdout),
			stderr: clampOutput(stderr)
		};
	} catch (error) {
		const err = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number | string };
		const exitCode = typeof err.code === 'number' ? err.code : 1;
		return {
			exitCode,
			stdout: clampOutput(typeof err.stdout === 'string' ? err.stdout : ''),
			stderr: clampOutput(typeof err.stderr === 'string' ? err.stderr : err.message)
		};
	}
};

const touchSession = (session: RuntimeSession) => {
	session.lastActivityAt = Date.now();
};

const broadcastSessionState = (session: RuntimeSession) => {
	broadcastToSession(session, {
		type: 'state',
		sessionId: session.sessionId,
		status: session.status,
		reason: session.reason
	});
};

const bootSession = async (session: RuntimeSession) => {
	if (playgroundConfig.runtimeMode === 'mock') {
		session.status = 'active';
		session.reason = null;
		await updatePlaygroundSessionStatus(session.sessionId, 'active', { containerId: null, reason: null });
		emitSessionLog(
			session,
			null,
			'info',
			'session-active',
			`Session is active in ${playgroundConfig.runtimeMode} mode.`
		);
		invalidatePlaygroundStatusCache();
		return;
	}

	const containerId = await runDockerContainer(session);
	session.containerId = containerId;
	session.status = 'active';
	session.reason = null;
	await updatePlaygroundSessionStatus(session.sessionId, 'active', { containerId, reason: null });
	emitSessionLog(session, null, 'info', 'session-active', 'Session container is running.', {
		containerId
	});
	invalidatePlaygroundStatusCache();
};

const validateSessionToken = (sessionId: string, joinToken: string) => {
	const session = sessions.get(sessionId);
	if (!session) return false;
	return safeTokenEqual(session.joinToken, joinToken);
};

export const createRuntimeSession = async (
	playsetId: number,
	clientIp: string | null,
	userAgent: string | null
) => {
	if (!playgroundConfig.enabled) {
		throw new Error('Playground is disabled.');
	}

	const playset = await getPlaysetById(playsetId);
	if (!playset) {
		throw new Error('Playset not found.');
	}
	if (playset.enabled !== 1) {
		throw new Error('Playset is disabled.');
	}

	const activeCount = await countActivePlaygroundSessionsForPlayset(playset.id);
	if (activeCount >= playset.maxSessions) {
		throw new Error('Playset is at capacity. Try again shortly.');
	}

	const sessionId = crypto.randomUUID();
	const joinToken = crypto.randomBytes(24).toString('base64url');
	await createPlaygroundSession(sessionId, playset.id, joinToken, clientIp, userAgent, 'starting');
	invalidatePlaygroundStatusCache();

	const runtimeSession: RuntimeSession = {
		sessionId,
		joinToken,
		playset,
		status: 'starting',
		containerId: null,
		reason: null,
		createdAt: Date.now(),
		lastActivityAt: Date.now(),
		commandCount: 0,
		commandWindowStartedAt: Date.now(),
		commandWindowCount: 0,
		sockets: new Map()
	};
	sessions.set(sessionId, runtimeSession);
	emitSessionLog(runtimeSession, null, 'info', 'session-created', 'Session requested.', {
		playsetId: playset.id,
		playsetSlug: playset.slug,
		runtime: playset.runtime,
		mode: playgroundConfig.runtimeMode
	});

	try {
		await bootSession(runtimeSession);
	} catch (error) {
		runtimeSession.status = 'failed';
		runtimeSession.reason = error instanceof Error ? error.message : 'Failed to boot runtime.';
		await updatePlaygroundSessionStatus(runtimeSession.sessionId, 'failed', {
			reason: runtimeSession.reason,
			ended: true
		});
		emitSessionLog(runtimeSession, null, 'error', 'session-failed', runtimeSession.reason);
		sessions.delete(runtimeSession.sessionId);
		invalidatePlaygroundStatusCache();
	}

	return {
		sessionId,
		joinToken,
		status: runtimeSession.status,
		reason: runtimeSession.reason,
		playset
	};
};

export const terminateSession = async (sessionId: string, reason = 'manual-shutdown') => {
	const session = sessions.get(sessionId);
	if (!session) {
		const existing = await getPlaygroundSessionBySessionId(sessionId);
		if (!existing || !['starting', 'active'].includes(existing.status)) {
			return false;
		}
		await updatePlaygroundSessionStatus(sessionId, 'stopped', { reason, ended: true });
		await createPlaygroundLog(sessionId, null, 'warn', 'session-stopped', `Session stopped (${reason}).`);
		invalidatePlaygroundStatusCache();
		return true;
	}

	session.status = 'stopped';
	session.reason = reason;
	await updatePlaygroundSessionStatus(session.sessionId, 'stopped', {
		containerId: session.containerId,
		reason,
		ended: true
	});
	emitSessionLog(session, null, 'warn', 'session-stopped', `Session stopped (${reason}).`);
	broadcastSessionState(session);

	await removeDockerContainer(session.containerId);

	for (const [wsId, socket] of session.sockets.entries()) {
		sockets.delete(wsId);
		if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
			socket.close(1000, `Session terminated: ${reason}`);
		}
	}
	session.sockets.clear();
	sessions.delete(sessionId);
	invalidatePlaygroundStatusCache();
	return true;
};

export const terminateSessionWithToken = async (
	sessionId: string,
	joinToken: string,
	reason = 'client-shutdown'
) => {
	if (!validateSessionToken(sessionId, joinToken)) {
		const dbSession = await getPlaygroundSessionBySessionId(sessionId);
		if (!dbSession) return false;
		if (!safeTokenEqual(dbSession.joinToken, joinToken)) return false;
		if (!['starting', 'active'].includes(dbSession.status)) return false;
		await updatePlaygroundSessionStatus(sessionId, 'stopped', { reason, ended: true });
		await createPlaygroundLog(sessionId, null, 'warn', 'session-stopped', `Session stopped (${reason}).`);
		invalidatePlaygroundStatusCache();
		return true;
	}
	return terminateSession(sessionId, reason);
};

export const terminateSessionsByPlayset = async (playsetId: number, reason = 'admin-playset-shutdown') => {
	const matching = Array.from(sessions.values()).filter((session) => session.playset.id === playsetId);
	for (const session of matching) {
		await terminateSession(session.sessionId, reason);
	}
	return matching.length;
};

export const terminateSessionBySocketId = async (wsId: string, reason = 'admin-websocket-shutdown') => {
	const socketRef = sockets.get(wsId);
	if (!socketRef) return false;
	return terminateSession(socketRef.sessionId, reason);
};

export const terminateAllSessions = async (reason = 'admin-global-shutdown') => {
	const ids = Array.from(sessions.keys());
	for (const sessionId of ids) {
		await terminateSession(sessionId, reason);
	}
	return ids.length;
};

const handleClientMessage = async (session: RuntimeSession, wsId: string, raw: RawData) => {
	let message: PlaygroundWsClientMessage | null = null;
	try {
		message = JSON.parse(String(raw)) as PlaygroundWsClientMessage;
	} catch {
		const socket = session.sockets.get(wsId);
		if (socket) {
			sendWsMessage(socket, { type: 'error', message: 'Invalid websocket payload.' });
		}
		return;
	}

	if (!message || typeof message !== 'object' || typeof message.type !== 'string') {
		const socket = session.sockets.get(wsId);
		if (socket) {
			sendWsMessage(socket, { type: 'error', message: 'Unsupported message.' });
		}
		return;
	}

	touchSession(session);

	if (message.type === 'ping') {
		const socket = session.sockets.get(wsId);
		if (socket) {
			sendWsMessage(socket, { type: 'pong', at: nowIso() });
		}
		return;
	}

	if (message.type === 'close') {
		await terminateSession(session.sessionId, message.reason?.trim() || 'client-close-request');
		return;
	}

	if (message.type !== 'run') {
		const socket = session.sockets.get(wsId);
		if (socket) {
			sendWsMessage(socket, { type: 'error', message: 'Unsupported message type.' });
		}
		return;
	}

	if (session.status !== 'active') {
		const socket = session.sockets.get(wsId);
		if (socket) {
			sendWsMessage(socket, { type: 'error', message: 'Session is not ready yet.' });
		}
		return;
	}

	const command = message.command?.trim() ?? '';
	if (!command) {
		const socket = session.sockets.get(wsId);
		if (socket) {
			sendWsMessage(socket, { type: 'error', message: 'Command cannot be empty.' });
		}
		return;
	}

	if (command.length > 800) {
		const socket = session.sockets.get(wsId);
		if (socket) {
			sendWsMessage(socket, { type: 'error', message: 'Command is too long.' });
		}
		return;
	}

	const now = Date.now();
	if (session.commandCount >= playgroundConfig.maxCommandsPerSession) {
		const socket = session.sockets.get(wsId);
		if (socket) {
			sendWsMessage(socket, {
				type: 'error',
				message: `Session command limit reached (${playgroundConfig.maxCommandsPerSession}). Start a new session.`
			});
		}
		return;
	}

	if (now - session.commandWindowStartedAt > playgroundConfig.commandRateWindowMs) {
		session.commandWindowStartedAt = now;
		session.commandWindowCount = 0;
	}
	if (session.commandWindowCount >= playgroundConfig.maxCommandsPerWindow) {
		const socket = session.sockets.get(wsId);
		const retryInMs = Math.max(
			0,
			playgroundConfig.commandRateWindowMs - (now - session.commandWindowStartedAt)
		);
		if (socket) {
			sendWsMessage(socket, {
				type: 'error',
				message: `Command rate limit reached. Retry in ${Math.ceil(retryInMs / 1000)}s.`
			});
		}
		return;
	}

	session.commandCount += 1;
	session.commandWindowCount += 1;

	emitSessionLog(session, wsId, 'info', 'command-start', `Running command: ${command}`);
	const result = await runCommandInSession(session, command);
	const response: PlaygroundWsServerMessage = {
		type: 'command_result',
		sessionId: session.sessionId,
		wsId,
		command,
		exitCode: result.exitCode,
		stdout: result.stdout,
		stderr: result.stderr,
		ranAt: nowIso()
	};
	broadcastToSession(session, response);
	emitSessionLog(
		session,
		wsId,
		result.exitCode === 0 ? 'info' : 'error',
		'command-finish',
		`Command finished with exit code ${result.exitCode}.`,
		{ command, exitCode: result.exitCode }
	);
};

export const attachWebSocketToSession = (
	sessionId: string,
	joinToken: string,
	socket: WebSocket,
	request?: IncomingMessage
) => {
	const session = sessions.get(sessionId);
	if (!session || !safeTokenEqual(session.joinToken, joinToken)) {
		socket.close(1008, 'Invalid session credentials.');
		return null;
	}
	if (session.status === 'failed' || session.status === 'stopped') {
		socket.close(1011, 'Session is no longer active.');
		return null;
	}

	const wsId = crypto.randomUUID();
	const runtimeSocket: RuntimeSocket = {
		wsId,
		sessionId,
		socket,
		connectedAt: Date.now(),
		remoteAddress: request?.socket?.remoteAddress ?? null
	};

	session.sockets.set(wsId, socket);
	sockets.set(wsId, runtimeSocket);
	touchSession(session);

	void createPlaygroundSocketConnection(wsId, sessionId);
	invalidatePlaygroundStatusCache();
	emitSessionLog(session, wsId, 'info', 'ws-connected', 'Websocket connected.', {
		remoteAddress: runtimeSocket.remoteAddress
	});

	sendWsMessage(socket, {
		type: 'welcome',
		sessionId,
		wsId,
		playsetId: session.playset.id,
		playsetName: session.playset.name,
		status: session.status,
		runtime: session.playset.runtime
	});
	broadcastSessionState(session);

	socket.on('message', (raw: RawData) => {
		void handleClientMessage(session, wsId, raw);
	});

	socket.on('close', (code: number, reasonBuffer: Buffer) => {
		session.sockets.delete(wsId);
		sockets.delete(wsId);
		touchSession(session);
		const reason = reasonBuffer.toString('utf8').trim() || null;
		void closePlaygroundSocketConnection(wsId, code, reason);
		invalidatePlaygroundStatusCache();
		emitSessionLog(session, wsId, 'warn', 'ws-disconnected', 'Websocket disconnected.', {
			code,
			reason
		});
	});

	socket.on('error', (error: Error) => {
		emitSessionLog(session, wsId, 'error', 'ws-error', 'Websocket error.', {
			message: error.message
		});
	});

	return wsId;
};

export const getPlaygroundRuntimeSnapshot = () => {
	const runtimeSessions = Array.from(sessions.values())
		.map((session) => ({
			sessionId: session.sessionId,
			status: session.status,
			reason: session.reason,
			playsetId: session.playset.id,
			playsetName: session.playset.name,
			playsetRuntime: session.playset.runtime,
			containerId: session.containerId,
			createdAt: new Date(session.createdAt).toISOString(),
			lastActivityAt: new Date(session.lastActivityAt).toISOString(),
			socketCount: session.sockets.size
		}))
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

	const runtimeSockets = Array.from(sockets.values())
		.map((socketRef) => ({
			wsId: socketRef.wsId,
			sessionId: socketRef.sessionId,
			connectedAt: new Date(socketRef.connectedAt).toISOString(),
			remoteAddress: socketRef.remoteAddress
		}))
		.sort((a, b) => b.connectedAt.localeCompare(a.connectedAt));

	return {
		runtimeMode: playgroundConfig.runtimeMode,
		sessionCount: runtimeSessions.length,
		socketCount: runtimeSockets.length,
		sessions: runtimeSessions,
		sockets: runtimeSockets
	};
};

const idleSweepInterval = setInterval(() => {
	const now = Date.now();
	for (const session of sessions.values()) {
		if (session.status !== 'active') continue;
		const idleMs = Math.max(30, session.playset.idleTimeoutSeconds) * 1000;
		if (now - session.lastActivityAt <= idleMs) continue;
		void terminateSession(session.sessionId, 'idle-timeout');
	}
}, 15_000);
idleSweepInterval.unref();
