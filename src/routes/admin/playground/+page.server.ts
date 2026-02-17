import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
	createPlayset,
	deletePlayset,
	getPlaysets,
	getPlaygroundOperationalCounts,
	getRecentPlaygroundLogs,
	getRecentPlaygroundSessions,
	updatePlayset
} from '$lib/server/dataStore';
import { requireAdminCached } from '$lib/server/auth';
import { getCsrfToken, validateCsrfToken } from '$lib/server/csrf';
import { getOrSetCached, invalidateCachedPrefix } from '$lib/server/cache';
import { playgroundConfig } from '$lib/server/playground/config';
import {
	getPlaygroundRuntimeSnapshot,
	terminateAllSessions,
	terminateSession,
	terminateSessionBySocketId,
	terminateSessionsByPlayset
} from '$lib/server/playground/runtime';
import { ensurePlaygroundWebSocketServer, getPlaygroundWsClientUrl } from '$lib/server/playground/ws';

const MAX = {
	name: 100,
	slug: 100,
	runtime: 40,
	description: 500,
	dockerImage: 200,
	startCommand: 800,
	defaultCommand: 800
};

const parseNumber = (value: FormDataEntryValue | null, fallback = 0) => {
	if (typeof value !== 'string') return fallback;
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.floor(parsed);
};

const parseText = (value: FormDataEntryValue | null) => {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
};

const parseRequired = (data: FormData, key: string) => String(data.get(key) ?? '').trim();

const parseEnabled = (data: FormData, key = 'enabled') =>
	data.getAll(key).some((value) => value === '1') ? 1 : 0;

const validatePlaysetFields = (
	name: string,
	slug: string,
	runtime: string,
	description: string,
	dockerImage: string,
	startCommand: string | null,
	defaultCommand: string | null,
	maxSessions: number,
	idleTimeoutSeconds: number
) => {
	const errors: Record<string, string> = {};

	if (!name) errors.name = 'Name is required.';
	if (!runtime) errors.runtime = 'Runtime label is required.';
	if (!description) errors.description = 'Description is required.';
	if (!dockerImage) errors.dockerImage = 'Docker image is required.';

	if (name.length > MAX.name) errors.name = `Name must be ${MAX.name} characters or fewer.`;
	if (slug.length > MAX.slug) errors.slug = `Slug must be ${MAX.slug} characters or fewer.`;
	if (runtime.length > MAX.runtime) errors.runtime = `Runtime must be ${MAX.runtime} characters or fewer.`;
	if (description.length > MAX.description) {
		errors.description = `Description must be ${MAX.description} characters or fewer.`;
	}
	if (dockerImage.length > MAX.dockerImage) {
		errors.dockerImage = `Docker image must be ${MAX.dockerImage} characters or fewer.`;
	}
	if (startCommand && startCommand.length > MAX.startCommand) {
		errors.startCommand = `Start command must be ${MAX.startCommand} characters or fewer.`;
	}
	if (defaultCommand && defaultCommand.length > MAX.defaultCommand) {
		errors.defaultCommand = `Default command must be ${MAX.defaultCommand} characters or fewer.`;
	}

	if (runtime && !/^[a-z0-9._-]+$/i.test(runtime)) {
		errors.runtime = 'Runtime can only contain letters, numbers, dots, underscores, and dashes.';
	}
	if (slug && !/^[a-z0-9-]+$/i.test(slug)) {
		errors.slug = 'Slug can only contain letters, numbers, and dashes.';
	}
	if (maxSessions < 1 || maxSessions > 100) {
		errors.maxSessions = 'Max sessions must be between 1 and 100.';
	}
	if (idleTimeoutSeconds < 30 || idleTimeoutSeconds > 86_400) {
		errors.idleTimeoutSeconds = 'Idle timeout must be between 30 and 86400 seconds.';
	}

	return errors;
};

export const load: PageServerLoad = async (event) => {
	await requireAdminCached(event);
	ensurePlaygroundWebSocketServer();
	const status = await getOrSetCached('playground:status:admin-dashboard', 5, async () => ({
		playsets: await getPlaysets(),
		counts: await getPlaygroundOperationalCounts(),
		runtime: getPlaygroundRuntimeSnapshot(),
		recentSessions: await getRecentPlaygroundSessions(120),
		recentLogs: await getRecentPlaygroundLogs(200)
	}));

	return {
		playgroundConfig: {
			enabled: playgroundConfig.enabled,
			runtimeMode: playgroundConfig.runtimeMode,
			wsUrl: getPlaygroundWsClientUrl(event.url)
		},
		playsets: status.playsets,
		counts: status.counts,
		runtime: status.runtime,
		recentSessions: status.recentSessions,
		recentLogs: status.recentLogs,
		csrfToken: getCsrfToken(event)
	};
};

export const actions: Actions = {
	createPlayset: async (event) => {
		await requireAdminCached(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'createPlayset', message: 'Invalid CSRF token.' });
		}

		const name = parseRequired(data, 'name');
		const slug = parseRequired(data, 'slug');
		const runtime = parseRequired(data, 'runtime');
		const description = parseRequired(data, 'description');
		const dockerImage = parseRequired(data, 'dockerImage');
		const startCommand = parseText(data.get('startCommand'));
		const defaultCommand = parseText(data.get('defaultCommand'));
		const maxSessions = parseNumber(data.get('maxSessions'), 5);
		const idleTimeoutSeconds = parseNumber(data.get('idleTimeoutSeconds'), 900);
		const errors = validatePlaysetFields(
			name,
			slug,
			runtime,
			description,
			dockerImage,
			startCommand,
			defaultCommand,
			maxSessions,
			idleTimeoutSeconds
		);

		if (Object.keys(errors).length > 0) {
			return fail(400, {
				action: 'createPlayset',
				message: 'Check the highlighted fields.',
				fieldErrors: errors
			});
		}

		await createPlayset(
			name,
			runtime,
			description,
			dockerImage,
			startCommand,
			defaultCommand,
			parseEnabled(data),
			maxSessions,
			idleTimeoutSeconds,
			slug
		);
		await invalidateCachedPrefix('playground:status:');

		return {
			action: 'createPlayset',
			success: true,
			message: 'Playset created.'
		};
	},
	updatePlayset: async (event) => {
		await requireAdminCached(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'updatePlayset', message: 'Invalid CSRF token.' });
		}

		const id = parseNumber(data.get('id'), -1);
		const name = parseRequired(data, 'name');
		const slug = parseRequired(data, 'slug');
		const runtime = parseRequired(data, 'runtime');
		const description = parseRequired(data, 'description');
		const dockerImage = parseRequired(data, 'dockerImage');
		const startCommand = parseText(data.get('startCommand'));
		const defaultCommand = parseText(data.get('defaultCommand'));
		const maxSessions = parseNumber(data.get('maxSessions'), 5);
		const idleTimeoutSeconds = parseNumber(data.get('idleTimeoutSeconds'), 900);
		const errors = validatePlaysetFields(
			name,
			slug,
			runtime,
			description,
			dockerImage,
			startCommand,
			defaultCommand,
			maxSessions,
			idleTimeoutSeconds
		);

		if (id <= 0) {
			errors.id = 'Invalid playset id.';
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, {
				action: 'updatePlayset',
				itemId: id,
				message: 'Check the highlighted fields.',
				fieldErrors: errors
			});
		}

		await updatePlayset(
			id,
			name,
			runtime,
			description,
			dockerImage,
			startCommand,
			defaultCommand,
			parseEnabled(data),
			maxSessions,
			idleTimeoutSeconds,
			slug
		);
		await invalidateCachedPrefix('playground:status:');

		return {
			action: 'updatePlayset',
			itemId: id,
			success: true,
			message: 'Playset updated.'
		};
	},
	deletePlayset: async (event) => {
		await requireAdminCached(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'deletePlayset', message: 'Invalid CSRF token.' });
		}

		const id = parseNumber(data.get('id'), -1);
		if (id <= 0) {
			return fail(400, { action: 'deletePlayset', message: 'Invalid playset id.' });
		}

		await deletePlayset(id);
		await invalidateCachedPrefix('playground:status:');
		return {
			action: 'deletePlayset',
			itemId: id,
			success: true,
			message: 'Playset removed.'
		};
	},
	stopByPlayset: async (event) => {
		await requireAdminCached(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'stopByPlayset', message: 'Invalid CSRF token.' });
		}
		const playsetId = parseNumber(data.get('playsetId'), -1);
		if (playsetId <= 0) {
			return fail(400, { action: 'stopByPlayset', message: 'Invalid playset id.' });
		}
		const stoppedCount = await terminateSessionsByPlayset(playsetId, 'admin-playset-shutdown');
		await invalidateCachedPrefix('playground:status:');
		return {
			action: 'stopByPlayset',
			itemId: playsetId,
			success: true,
			message: `Stopped ${stoppedCount} live session(s) for playset ${playsetId}.`
		};
	},
	stopBySession: async (event) => {
		await requireAdminCached(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'stopBySession', message: 'Invalid CSRF token.' });
		}
		const sessionId = parseRequired(data, 'sessionId');
		if (!sessionId) {
			return fail(400, { action: 'stopBySession', message: 'Session id is required.' });
		}
		const stopped = await terminateSession(sessionId, 'admin-session-shutdown');
		await invalidateCachedPrefix('playground:status:');
		return {
			action: 'stopBySession',
			success: stopped,
			message: stopped ? `Session ${sessionId} stopped.` : `Session ${sessionId} was not active.`
		};
	},
	stopBySocket: async (event) => {
		await requireAdminCached(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'stopBySocket', message: 'Invalid CSRF token.' });
		}
		const wsId = parseRequired(data, 'wsId');
		if (!wsId) {
			return fail(400, { action: 'stopBySocket', message: 'Websocket id is required.' });
		}
		const stopped = await terminateSessionBySocketId(wsId, 'admin-websocket-shutdown');
		await invalidateCachedPrefix('playground:status:');
		return {
			action: 'stopBySocket',
			success: stopped,
			message: stopped ? `Session for websocket ${wsId} stopped.` : `Websocket ${wsId} was not active.`
		};
	},
	stopAll: async (event) => {
		await requireAdminCached(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'stopAll', message: 'Invalid CSRF token.' });
		}
		const stoppedCount = await terminateAllSessions('admin-global-shutdown');
		await invalidateCachedPrefix('playground:status:');
		return {
			action: 'stopAll',
			success: true,
			message: `Stopped ${stoppedCount} live session(s).`
		};
	}
};
