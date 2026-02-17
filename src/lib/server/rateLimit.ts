import { getRedisClient, withRedisPrefix } from '$lib/server/redis';

type RateLimitBucket = {
	count: number;
	resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export const rateLimit = async (key: string, options: { windowMs: number; max: number }) => {
	const client = await getRedisClient();
	if (client) {
		try {
			const redisKey = withRedisPrefix(`ratelimit:${key}`);
			const count = await client.incr(redisKey);
			if (count === 1) {
				await client.pExpire(redisKey, options.windowMs);
			}
			return count <= options.max;
		} catch {
			// Fall back to in-memory limiter if Redis is unavailable.
		}
	}

	const now = Date.now();
	const existing = buckets.get(key);

	if (!existing || now > existing.resetAt) {
		buckets.set(key, { count: 1, resetAt: now + options.windowMs });
		return true;
	}

	if (existing.count >= options.max) {
		return false;
	}

	existing.count += 1;
	return true;
};
