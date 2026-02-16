const env = process.env;

const parseBoolean = (value: string | undefined, fallback: boolean) => {
	if (!value) return fallback;
	const normalized = value.trim().toLowerCase();
	if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
	if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
	return fallback;
};

const parseNumber = (value: string | undefined, fallback: number, min = 1) => {
	if (!value) return fallback;
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.max(min, Math.floor(parsed));
};

const modeRaw = (env.PLAYGROUND_RUNTIME_MODE ?? 'docker').trim().toLowerCase();
const runtimeMode = modeRaw === 'mock' ? 'mock' : 'docker';

export const playgroundConfig = {
	enabled: parseBoolean(env.PLAYGROUND_ENABLED, true),
	runtimeMode,
	dockerBinary: (env.PLAYGROUND_DOCKER_BINARY ?? 'docker').trim() || 'docker',
	wsHost: (env.PLAYGROUND_WS_HOST ?? '0.0.0.0').trim() || '0.0.0.0',
	wsPort: parseNumber(env.PLAYGROUND_WS_PORT, 24680),
	wsPath: (env.PLAYGROUND_WS_PATH ?? '/playground/ws').trim() || '/playground/ws',
	wsPublicUrl: (env.PLAYGROUND_WS_PUBLIC_URL ?? '').trim() || null,
	commandTimeoutMs: parseNumber(env.PLAYGROUND_COMMAND_TIMEOUT_MS, 20_000, 1_000),
	maxOutputBytes: parseNumber(env.PLAYGROUND_MAX_OUTPUT_BYTES, 64_000, 4_096)
} as const;

export type PlaygroundRuntimeMode = (typeof playgroundConfig)['runtimeMode'];
