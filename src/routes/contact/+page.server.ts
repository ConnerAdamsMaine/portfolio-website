import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { getSiteSettings } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	return {
		siteSettings: getSiteSettings()
	};
};

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

export const actions: Actions = {
	send: async ({ request }) => {
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

		// Placeholder: integrate email service (Resend/SES/etc.) here.
		// eslint-disable-next-line no-console
		console.log('Contact form submission', { name, email, scope });

		return { success: true };
	}
};
