export type PlaygroundWsClientMessage =
	| { type: 'ping' }
	| { type: 'run'; command: string }
	| { type: 'close'; reason?: string };

export type PlaygroundWsServerMessage =
	| {
			type: 'welcome';
			sessionId: string;
			wsId: string;
			playsetId: number;
			playsetName: string;
			status: string;
			runtime: string;
		}
	| {
			type: 'state';
			sessionId: string;
			status: string;
			reason?: string | null;
		}
	| {
			type: 'log';
			entry: {
				sessionId: string;
				wsId: string | null;
				level: string;
				event: string;
				message: string;
				payload: string | null;
				createdAt: string;
			};
		}
	| {
			type: 'command_result';
			sessionId: string;
			wsId: string;
			command: string;
			exitCode: number;
			stdout: string;
			stderr: string;
			ranAt: string;
		}
	| { type: 'pong'; at: string }
	| { type: 'error'; message: string };
