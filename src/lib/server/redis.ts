import { createClient } from 'redis';

const runtimeEnv = process.env;
const redisUrl = runtimeEnv.REDIS_URL?.trim();
type GenericRedisClient = ReturnType<typeof createClient>;
const redisPrefix = runtimeEnv.REDIS_PREFIX?.trim() || 'portfolio:';

let clientPromise: Promise<GenericRedisClient | null> | null = null;
let loggedConnectFailure = false;

export const isRedisConfigured = () => Boolean(redisUrl);

export const withRedisPrefix = (suffix: string) => `${redisPrefix}${suffix}`;

const connectRedis = async () => {
	if (!redisUrl) return null;

	const client = createClient({
		url: redisUrl,
		socket: {
			reconnectStrategy: (retries) => Math.min(retries * 50, 2000)
		}
	});

	client.on('error', (error) => {
		if (loggedConnectFailure) return;
		loggedConnectFailure = true;
		console.error('[redis] connection error', error);
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
				console.error('[redis] failed to connect', error);
			}
			clientPromise = null;
			return null;
		});
	}
	return clientPromise;
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
