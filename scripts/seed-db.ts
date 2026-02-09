import { seedDatabase } from '../src/lib/server/db.ts';

try {
	seedDatabase();
	// eslint-disable-next-line no-console
	console.log('Database initialized.');
} catch (error) {
	// eslint-disable-next-line no-console
	console.error('Database initialization failed.');
	// eslint-disable-next-line no-console
	console.error(error);
	process.exit(1);
}
