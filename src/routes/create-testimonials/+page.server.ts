import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { createTestimonial } from '$lib/server/db';

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const role = String(data.get('role') ?? '').trim();
		const company = String(data.get('company') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const quote = String(data.get('quote') ?? '').trim();
		const project = String(data.get('project') ?? '').trim();
		const result = String(data.get('result') ?? '').trim();
		const consent = String(data.get('consent') ?? '').trim();

		if (!name || !quote) {
			return fail(400, { message: 'Name and testimonial are required.' });
		}
		if (email && !isValidEmail(email)) {
			return fail(400, { message: 'Please provide a valid email.' });
		}
		if (!consent) {
			return fail(400, { message: 'Please confirm you have permission to share this.' });
		}

		createTestimonial(
			name,
			role || null,
			company || null,
			quote,
			project || null,
			result || null,
			email || null
		);

		return { success: true };
	}
};
