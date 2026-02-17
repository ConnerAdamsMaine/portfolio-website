import type { PageServerLoad } from './$types';
import { getEnabledPlaysets } from '$lib/server/dataStore';
import { isAdminAuthenticatedCached } from '$lib/server/auth';
import { playgroundConfig } from '$lib/server/playground/config';
import { ensurePlaygroundWebSocketServer, getPlaygroundWsClientUrl } from '$lib/server/playground/ws';
import { getOrSetCached } from '$lib/server/cache';

export const load: PageServerLoad = async (event) => {
	const isLocked = playgroundConfig.requireAdmin && !(await isAdminAuthenticatedCached(event));
	if (playgroundConfig.enabled && !isLocked) {
		ensurePlaygroundWebSocketServer();
	}

	const playsets = isLocked
		? []
		: await getOrSetCached('playground:status:enabled-playsets', 5, () => getEnabledPlaysets());

	return {
		playgroundEnabled: playgroundConfig.enabled && !isLocked,
		playgroundLocked: isLocked,
		runtimeMode: playgroundConfig.runtimeMode,
		playsets,
		wsUrl: getPlaygroundWsClientUrl(event.url)
	};
};
