import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

export const actions: Actions = {
	default: async ({ request }) => {
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

		// Placeholder: integrate email provider (ConvertKit/Mailchimp/etc.) here.
		// eslint-disable-next-line no-console
		console.log('Newsletter signup', { name, email, interest });

		return { success: true };
	}
};
