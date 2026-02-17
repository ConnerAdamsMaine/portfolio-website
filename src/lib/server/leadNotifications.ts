const env = process.env;
const isDev = env.NODE_ENV !== 'production';

const WEBHOOK_URL = (env.LEAD_WEBHOOK_URL ?? '').trim();
const WEBHOOK_TOKEN = (env.LEAD_WEBHOOK_TOKEN ?? '').trim();

const parseTimeout = (value: string | undefined, fallback: number) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.min(Math.max(parsed, 500), 15_000);
};

const TIMEOUT_MS = parseTimeout(env.LEAD_NOTIFY_TIMEOUT_MS, 2_500);

export type LeadNotificationPayload = {
	source: 'contact' | 'collaborate' | 'subscribe';
	submittedAt: string;
	name: string | null;
	email: string;
	scope?: string | null;
	interest?: string | null;
	siteOrigin: string;
	ip: string | null;
	userAgent: string | null;
};

const clampString = (value: string | null, max: number) => {
	if (!value) return null;
	return value.length > max ? value.slice(0, max) : value;
};

export const sendLeadNotification = async (payload: LeadNotificationPayload) => {
	if (!WEBHOOK_URL) return;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

	const body = {
		event: 'lead_capture',
		source: payload.source,
		submittedAt: payload.submittedAt,
		siteOrigin: payload.siteOrigin,
		lead: {
			name: clampString(payload.name, 160),
			email: clampString(payload.email, 320),
			scope: clampString(payload.scope ?? null, 10_000),
			interest: clampString(payload.interest ?? null, 160)
		},
		request: {
			ip: clampString(payload.ip, 80),
			userAgent: clampString(payload.userAgent, 512)
		}
	};

	try {
		const response = await fetch(WEBHOOK_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(WEBHOOK_TOKEN ? { Authorization: `Bearer ${WEBHOOK_TOKEN}` } : {})
			},
			body: JSON.stringify(body),
			signal: controller.signal
		});

		if (!response.ok && isDev) {
			// eslint-disable-next-line no-console
			console.error(`Lead webhook returned ${response.status}.`);
		}
	} catch (error) {
		if (isDev) {
			// eslint-disable-next-line no-console
			console.error('Lead webhook failed.', error);
		}
	} finally {
		clearTimeout(timeout);
	}
};
