import { WebSocketServer } from 'ws';
import type WebSocket from 'ws';
import type { IncomingMessage } from 'node:http';
import { playgroundConfig } from '$lib/server/playground/config';
import { attachWebSocketToSession } from '$lib/server/playground/runtime';

let wsServer: WebSocketServer | null = null;
let hasAttemptedStart = false;

const normalizePath = (value: string) => {
	if (!value.startsWith('/')) return `/${value}`;
	return value;
};

export const getPlaygroundWsClientUrl = (requestUrl: URL) => {
	if (playgroundConfig.wsPublicUrl) {
		return playgroundConfig.wsPublicUrl;
	}
	const protocol = requestUrl.protocol === 'https:' ? 'wss' : 'ws';
	const host = requestUrl.hostname;
	const defaultPort = protocol === 'wss' ? 443 : 80;
	const portSegment = playgroundConfig.wsPort === defaultPort ? '' : `:${playgroundConfig.wsPort}`;
	const path = normalizePath(playgroundConfig.wsPath);
	return `${protocol}://${host}${portSegment}${path}`;
};

export const ensurePlaygroundWebSocketServer = () => {
	if (!playgroundConfig.enabled) return null;
	if (wsServer || hasAttemptedStart) return wsServer;
	hasAttemptedStart = true;

	try {
		wsServer = new WebSocketServer({
			host: playgroundConfig.wsHost,
			port: playgroundConfig.wsPort,
			path: normalizePath(playgroundConfig.wsPath)
		});

		wsServer.on('connection', (socket: WebSocket, request: IncomingMessage) => {
			const baseHost = request.headers.host ?? `${playgroundConfig.wsHost}:${playgroundConfig.wsPort}`;
			const parsedUrl = new URL(request.url ?? '/', `http://${baseHost}`);
			const sessionId = parsedUrl.searchParams.get('sessionId')?.trim() ?? '';
			const token = parsedUrl.searchParams.get('token')?.trim() ?? '';
			if (!sessionId || !token) {
				socket.close(1008, 'Missing session credentials.');
				return;
			}
			attachWebSocketToSession(sessionId, token, socket, request);
		});

		wsServer.on('listening', () => {
			const path = normalizePath(playgroundConfig.wsPath);
			console.log(
				`[playground] websocket listening at ws://${playgroundConfig.wsHost}:${playgroundConfig.wsPort}${path}`
			);
		});

		wsServer.on('error', (error: Error) => {
			const err = error as NodeJS.ErrnoException;
			if (err.code === 'EADDRINUSE') {
				console.warn(
					`[playground] websocket port ${playgroundConfig.wsPort} already in use; assuming another instance is running.`
				);
				return;
			}
			console.error('[playground] websocket server error', error);
		});
	} catch (error) {
		console.error('[playground] failed to start websocket server', error);
		wsServer = null;
	}

	return wsServer;
};
