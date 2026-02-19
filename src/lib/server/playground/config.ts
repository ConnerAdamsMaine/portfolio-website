import { env } from '$env/dynamic/private';

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

const parseRuntimeMode = (): PlaygroundRuntimeMode => {
	const modeRaw = (env.PLAYGROUND_RUNTIME_MODE ?? 'docker').trim().toLowerCase();
	return modeRaw === 'mock' ? 'mock' : 'docker';
};

export const playgroundConfig = {
	get enabled() {
		return parseBoolean(env.PLAYGROUND_ENABLED, false);
	},
	get requireAdmin() {
		return parseBoolean(env.PLAYGROUND_REQUIRE_ADMIN, true);
	},
	get enforceSameOrigin() {
		return parseBoolean(env.PLAYGROUND_ENFORCE_SAME_ORIGIN, true);
	},
	get runtimeMode(): PlaygroundRuntimeMode {
		return parseRuntimeMode();
	},
	get dockerBinary() {
		return (env.PLAYGROUND_DOCKER_BINARY ?? 'docker').trim() || 'docker';
	},
	get wsHost() {
		return (env.PLAYGROUND_WS_HOST ?? '0.0.0.0').trim() || '0.0.0.0';
	},
	get wsPort() {
		return parseNumber(env.PLAYGROUND_WS_PORT, 24680);
	},
	get wsPath() {
		return (env.PLAYGROUND_WS_PATH ?? '/playground/ws').trim() || '/playground/ws';
	},
	get wsPublicUrl() {
		return (env.PLAYGROUND_WS_PUBLIC_URL ?? '').trim() || null;
	},
	get createRateLimitPerMinute() {
		return parseNumber(env.PLAYGROUND_CREATE_RATE_LIMIT_PER_MINUTE, 3);
	},
	get commandTimeoutMs() {
		return parseNumber(env.PLAYGROUND_COMMAND_TIMEOUT_MS, 20_000, 1_000);
	},
	get maxOutputBytes() {
		return parseNumber(env.PLAYGROUND_MAX_OUTPUT_BYTES, 64_000, 4_096);
	},
	get maxCommandsPerSession() {
		return parseNumber(env.PLAYGROUND_MAX_COMMANDS_PER_SESSION, 40);
	},
	get commandRateWindowMs() {
		return parseNumber(env.PLAYGROUND_COMMAND_RATE_WINDOW_MS, 10_000, 1_000);
	},
	get maxCommandsPerWindow() {
		return parseNumber(env.PLAYGROUND_MAX_COMMANDS_PER_WINDOW, 8);
	}
};

export type PlaygroundRuntimeMode = 'docker' | 'mock';
