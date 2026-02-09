type RateLimitBucket = {
	count: number;
	resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export const rateLimit = (key: string, options: { windowMs: number; max: number }) => {
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
