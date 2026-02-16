import type { PageServerLoad } from './$types';
import { getEnabledPlaysets } from '$lib/server/db';
import { playgroundConfig } from '$lib/server/playground/config';
import { ensurePlaygroundWebSocketServer, getPlaygroundWsClientUrl } from '$lib/server/playground/ws';

export const load: PageServerLoad = async ({ url }) => {
	ensurePlaygroundWebSocketServer();
	return {
		playgroundEnabled: playgroundConfig.enabled,
		runtimeMode: playgroundConfig.runtimeMode,
		playsets: getEnabledPlaysets(),
		wsUrl: getPlaygroundWsClientUrl(url)
	};
};
