import type { PageServerLoad } from './$types';
import { getEnabledPlaysets } from '$lib/server/db';
import { isAdminAuthenticated } from '$lib/server/auth';
import { playgroundConfig } from '$lib/server/playground/config';
import { ensurePlaygroundWebSocketServer, getPlaygroundWsClientUrl } from '$lib/server/playground/ws';

export const load: PageServerLoad = async (event) => {
	const isLocked = playgroundConfig.requireAdmin && !isAdminAuthenticated(event);
	if (playgroundConfig.enabled && !isLocked) {
		ensurePlaygroundWebSocketServer();
	}

	return {
		playgroundEnabled: playgroundConfig.enabled && !isLocked,
		playgroundLocked: isLocked,
		runtimeMode: playgroundConfig.runtimeMode,
		playsets: isLocked ? [] : getEnabledPlaysets(),
		wsUrl: getPlaygroundWsClientUrl(event.url)
	};
};
