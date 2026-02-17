import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
	getAssets,
	createAsset,
	updateAsset,
	deleteAsset
} from '$lib/server/dataStore';
import { requireAdminCached } from '$lib/server/auth';
import { getCsrfToken, validateCsrfToken } from '$lib/server/csrf';
import fs from 'node:fs';
import path from 'node:path';

const ASSET_DIR = path.resolve('static/assets/uploads');

const sanitizeFilename = (value: string) =>
	value
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9._-]/g, '')
		.replace(/^-+|-+$/g, '') || 'asset';

export const load: PageServerLoad = async (event) => {
	await requireAdminCached(event);
	return {
		assets: await getAssets(),
		csrfToken: getCsrfToken(event)
	};
};

export const actions: Actions = {
	createAsset: async (event) => {
		await requireAdminCached(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'createAsset', message: 'Invalid CSRF token.' });
		}

		const file = data.get('file');
		if (!(file instanceof File)) {
			return fail(400, { action: 'createAsset', message: 'Please attach a file.' });
		}

		const label = String(data.get('label') ?? '').trim() || file.name;
		const original = path.basename(file.name);
		const safeName = sanitizeFilename(original);
		const filename = `${Date.now()}-${safeName}`;
		fs.mkdirSync(ASSET_DIR, { recursive: true });
		const buffer = Buffer.from(await file.arrayBuffer());
		fs.writeFileSync(path.join(ASSET_DIR, filename), buffer);

		await createAsset(
			label,
			filename,
			`/assets/uploads/${filename}`,
			file.type || 'application/octet-stream',
			buffer.length,
			data.getAll('public').some((value) => value === '1') ? 1 : 0
		);

		return { success: true, message: 'Asset uploaded.', action: 'createAsset' };
	},
	updateAsset: async (event) => {
		await requireAdminCached(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'updateAsset', message: 'Invalid CSRF token.' });
		}
		const id = Number(data.get('id'));
		if (!id) {
			return fail(400, { action: 'updateAsset', message: 'Invalid asset.' });
		}
		const label = String(data.get('label') ?? '').trim();
		if (!label) {
			return fail(400, { action: 'updateAsset', message: 'Label is required.', itemId: id });
		}
		const isPublic = data.getAll('public').some((value) => value === '1') ? 1 : 0;
		await updateAsset(id, label, isPublic);
		return { success: true, message: 'Asset updated.', action: 'updateAsset', itemId: id };
	},
	deleteAsset: async (event) => {
		await requireAdminCached(event);
		const data = await event.request.formData();
		if (!validateCsrfToken(event, data)) {
			return fail(403, { action: 'deleteAsset', message: 'Invalid CSRF token.' });
		}
		const id = Number(data.get('id'));
		if (!id) {
			return fail(400, { action: 'deleteAsset', message: 'Invalid asset.' });
		}
		const assets = await getAssets();
		const asset = assets.find((item) => item.id === id);
		if (asset) {
			const filePath = path.resolve('static', asset.path.replace(/^\//, ''));
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
		}
		await deleteAsset(id);
		return { success: true, message: 'Asset deleted.', action: 'deleteAsset', itemId: id };
	}
};
