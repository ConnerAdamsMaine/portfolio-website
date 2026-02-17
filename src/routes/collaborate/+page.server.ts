import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { createInboundMessage, getSiteSettings } from '$lib/server/db';
import { sendLeadNotification } from '$lib/server/leadNotifications';
import { rateLimit } from '$lib/server/rateLimit';

export const load: PageServerLoad = async () => {
	return {
		siteSettings: getSiteSettings()
	};
};

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);
const MAX_NAME_LENGTH = 160;
const MAX_EMAIL_LENGTH = 320;
const MAX_SCOPE_LENGTH = 10_000;

export const actions: Actions = {
	send: async (event) => {
		const ip = event.getClientAddress();
		if (!rateLimit(`collaborate-form:${ip}`, { windowMs: 10 * 60 * 1000, max: 6 })) {
			return fail(429, { message: 'Too many submissions. Please try again in a few minutes.' });
		}

		const { request } = event;
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const scope = String(data.get('scope') ?? '').trim();

		if (!name || !email || !scope) {
			return fail(400, { message: 'All fields are required.' });
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
		if (scope.length > MAX_SCOPE_LENGTH) {
			return fail(400, { message: 'Project brief is too long.' });
		}

		try {
			const userAgent = request.headers.get('user-agent');
			createInboundMessage(
				'collaborate',
				name,
				email,
				scope,
				ip,
				userAgent
			);
			await sendLeadNotification({
				source: 'collaborate',
				submittedAt: new Date().toISOString(),
				name,
				email,
				scope,
				siteOrigin: event.url.origin,
				ip,
				userAgent
			});
		} catch {
			return fail(500, { message: 'Unable to save your request right now. Please try again shortly.' });
		}

		return { success: true };
	}
};
