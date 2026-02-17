import { getRedisClient, withRedisPrefix } from '$lib/server/redis';

type MemoryEntry = {
	value: string;
	expiresAt: number;
};

const memoryCache = new Map<string, MemoryEntry>();

const now = () => Date.now();

const getMemory = <T>(key: string) => {
	const entry = memoryCache.get(key);
	if (!entry) return null;
	if (now() > entry.expiresAt) {
		memoryCache.delete(key);
		return null;
	}
	try {
		return JSON.parse(entry.value) as T;
	} catch {
		memoryCache.delete(key);
		return null;
	}
};

const setMemory = (key: string, ttlSeconds: number, value: unknown) => {
	memoryCache.set(key, {
		value: JSON.stringify(value),
		expiresAt: now() + ttlSeconds * 1000
	});
};

export const getCached = async <T>(key: string) => {
	const redisKey = withRedisPrefix(`cache:${key}`);
	const client = await getRedisClient();

	if (client) {
		try {
			const raw = await client.get(redisKey);
			if (!raw) return null;
			return JSON.parse(raw) as T;
		} catch {
			return getMemory<T>(redisKey);
		}
	}

	return getMemory<T>(redisKey);
};

export const setCached = async (key: string, ttlSeconds: number, value: unknown) => {
	const redisKey = withRedisPrefix(`cache:${key}`);
	const client = await getRedisClient();

	if (client) {
		try {
			await client.set(redisKey, JSON.stringify(value), {
				EX: Math.max(1, Math.floor(ttlSeconds))
			});
			return;
		} catch {
			setMemory(redisKey, ttlSeconds, value);
			return;
		}
	}

	setMemory(redisKey, ttlSeconds, value);
};

export const getOrSetCached = async <T>(
	key: string,
	ttlSeconds: number,
	compute: () => Promise<T> | T
) => {
	const cached = await getCached<T>(key);
	if (cached !== null) return cached;

	const value = await compute();
	await setCached(key, ttlSeconds, value);
	return value;
};

export const invalidateCached = async (key: string) => {
	const redisKey = withRedisPrefix(`cache:${key}`);
	memoryCache.delete(redisKey);

	const client = await getRedisClient();
	if (!client) return;
	try {
		await client.del(redisKey);
	} catch {
		// No-op cache invalidation fallback.
	}
};

export const invalidateCachedPrefix = async (keyPrefix: string) => {
	const redisPrefix = withRedisPrefix(`cache:${keyPrefix}`);

	for (const key of memoryCache.keys()) {
		if (key.startsWith(redisPrefix)) {
			memoryCache.delete(key);
		}
	}

	const client = await getRedisClient();
	if (!client) return;
	try {
		let cursor = '0';
		do {
			const scanResult = await client.scan(cursor, {
				MATCH: `${redisPrefix}*`,
				COUNT: 250
			});
			cursor = scanResult.cursor;
			if (scanResult.keys.length > 0) {
				await client.del(scanResult.keys);
			}
		} while (cursor !== '0');
	} catch {
		// Fallback to KEYS on older Redis clients missing SCAN helpers.
		try {
			const keys = await client.keys(`${redisPrefix}*`);
			if (keys.length > 0) {
				await client.del(keys);
			}
		} catch {
			// No-op cache invalidation fallback.
		}
	}
};
