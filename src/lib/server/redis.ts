import { createClient } from 'redis';

const runtimeEnv = process.env;
const redisUrl = runtimeEnv.REDIS_URL?.trim();
type GenericRedisClient = ReturnType<typeof createClient>;
const redisPrefix = runtimeEnv.REDIS_PREFIX?.trim() || 'portfolio:';
const REDIS_LOG_THROTTLE_MS = 30_000;

let clientPromise: Promise<GenericRedisClient | null> | null = null;
let loggedConnectFailure = false;
let lastErrorLogAt = 0;

export const isRedisConfigured = () => Boolean(redisUrl);

export const withRedisPrefix = (suffix: string) => `${redisPrefix}${suffix}`;

const logRedisError = (message: string, error: unknown) => {
	const now = Date.now();
	if (now - lastErrorLogAt < REDIS_LOG_THROTTLE_MS) return;
	lastErrorLogAt = now;
	console.error(message, error);
};

const connectRedis = async () => {
	if (!redisUrl) return null;

	const client = createClient({
		url: redisUrl,
		socket: {
			reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
			connectTimeout: 10_000,
			keepAlive: true
		},
		pingInterval: 10_000
	});

	client.on('error', (error) => {
		logRedisError('[redis] connection error', error);
	});
	client.on('ready', () => {
		loggedConnectFailure = false;
	});
	client.on('end', () => {
		clientPromise = null;
	});

	await client.connect();
	return client;
};

export const getRedisClient = async () => {
	if (!redisUrl) return null;
	if (!clientPromise) {
		clientPromise = connectRedis().catch((error) => {
			if (!loggedConnectFailure) {
				loggedConnectFailure = true;
				logRedisError('[redis] failed to connect', error);
			}
			clientPromise = null;
			return null;
		});
	}
	const client = await clientPromise;
	if (!client || !client.isReady) return null;
	return client;
};

export const pingRedis = async () => {
	if (!isRedisConfigured()) {
		return { configured: false, ok: false };
	}

	try {
		const client = await getRedisClient();
		if (!client) return { configured: true, ok: false };
		const pong = await client.ping();
		return { configured: true, ok: pong === 'PONG' };
	} catch {
		return { configured: true, ok: false };
	}
};
