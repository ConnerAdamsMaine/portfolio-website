import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { upsertNewsletterSubscription } from '$lib/server/telemetryStore';
import { sendLeadNotification } from '$lib/server/leadNotifications';
import { rateLimit } from '$lib/server/rateLimit';

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);
const MAX_NAME_LENGTH = 160;
const MAX_EMAIL_LENGTH = 320;
const MAX_INTEREST_LENGTH = 160;

export const actions: Actions = {
	default: async (event) => {
		const ip = event.getClientAddress();
		if (!(await rateLimit(`subscribe-form:${ip}`, { windowMs: 10 * 60 * 1000, max: 8 }))) {
			return fail(429, { message: 'Too many signups from this IP. Please try again later.' });
		}

		const { request } = event;
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const interest = String(data.get('interest') ?? '').trim();

		if (!email) {
			return fail(400, { message: 'Email is required.' });
		}
		if (!isValidEmail(email)) {
			return fail(400, { message: 'Please provide a valid email.' });
		}
		if (name.length > MAX_NAME_LENGTH) {
			return fail(400, { message: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` });
		}
		if (email.length > MAX_EMAIL_LENGTH) {
			return fail(400, { message: 'Email is too long.' });
		}
		if (interest.length > MAX_INTEREST_LENGTH) {
			return fail(400, { message: 'Interest value is too long.' });
		}

		try {
			const userAgent = request.headers.get('user-agent');
			await upsertNewsletterSubscription(
				name || null,
				email,
				interest || null,
				ip,
				userAgent
			);
			await sendLeadNotification({
				source: 'subscribe',
				submittedAt: new Date().toISOString(),
				name: name || null,
				email,
				interest: interest || null,
				siteOrigin: event.url.origin,
				ip,
				userAgent
			});
		} catch {
			return fail(500, { message: 'Unable to subscribe right now. Please try again shortly.' });
		}

		return { success: true };
	}
};
