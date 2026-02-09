import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
const runtimeEnv = process.env;
const isDev = runtimeEnv.NODE_ENV !== 'production';

type SiteSettings = {
	id: number;
	heroHeadline: string;
	heroSubheadline: string;
	heroNoteTitle: string;
	heroNoteBody: string;
	heroHighlightsTitle: string;
	heroHighlightsBody: string;
	aboutHeadline: string;
	aboutBody: string;
	focusHeadline: string;
	focusBody: string;
	stackTitle: string;
	stackIntro: string;
	workTitle: string;
	workIntro: string;
	blogTitle: string;
	blogIntro: string;
	contactTitle: string;
	contactBody: string;
	contactEmail: string;
	githubUrl: string;
	footerBadge: string;
	footerHeadline: string;
	footerBody: string;
	footerCtaLabel: string;
	footerCtaHref: string;
	maintenanceEnabled: number;
	maintenanceTitle: string;
	maintenanceBody: string;
	error403Title: string;
	error403Body: string;
	error404Title: string;
	error404Body: string;
	error500Title: string;
	error500Body: string;
};

type StackItem = {
	id: number;
	label: string;
	detail: string | null;
	sort: number;
};

type WorkItem = {
	id: number;
	title: string;
	description: string;
	longDescription: string | null;
	highlights: string | null;
	role: string | null;
	tech: string | null;
	link: string | null;
	featured: number;
	sort: number;
};

type BlogPost = {
	id: number;
	title: string;
	slug: string;
	excerpt: string | null;
	content: string | null;
	tags: string | null;
	draft: number;
	featured: number;
	publishedAt: string | null;
	createdAt: string;
};

type Asset = {
	id: number;
	label: string;
	filename: string;
	path: string;
	mime: string;
	size: number;
	public: number;
	createdAt: string;
};

type Testimonial = {
	id: number;
	name: string;
	role: string | null;
	company: string | null;
	quote: string;
	project: string | null;
	result: string | null;
	email: string | null;
	approved: number;
	createdAt: string;
};

type TrackingEvent = {
	id: number;
	type: string;
	name: string | null;
	path: string | null;
	referrer: string | null;
	userAgent: string | null;
	ip: string | null;
	payload: string | null;
	createdAt: string;
};

type FooterLink = {
	id: number;
	section: string;
	label: string;
	href: string | null;
	external: number;
	sort: number;
};

const DEFAULT_DB_PATH = 'data/portfolio.sqlite';
let db: Database.Database | null = null;
let dbInitialized = false;
const CACHE_TTL_MS = 10_000;

type CacheEntry<T> = {
	data: T;
	fetchedAt: number;
};

const cache = {
	siteSettings: null as CacheEntry<SiteSettings> | null,
	stackItems: null as CacheEntry<StackItem[]> | null,
	workItems: null as CacheEntry<WorkItem[]> | null,
	featuredWork: null as CacheEntry<WorkItem[]> | null,
	posts: null as CacheEntry<BlogPost[]> | null,
	assets: null as CacheEntry<Asset[]> | null,
	testimonials: null as CacheEntry<Testimonial[]> | null,
	footerLinks: null as CacheEntry<FooterLink[]> | null
};

const getCached = <T>(entry: CacheEntry<T> | null) => {
	if (!entry) return null;
	if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
	return entry.data;
};

const setCache = <T>(key: keyof typeof cache, data: T) => {
	cache[key] = { data, fetchedAt: Date.now() } as CacheEntry<T>;
};

const clearCache = (...keys: (keyof typeof cache)[]) => {
	for (const key of keys) {
		cache[key] = null;
	}
};

const ensureDbPath = (dbPath: string) => {
	const dir = path.dirname(dbPath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
};

const shouldAutoSeed = runtimeEnv.DB_AUTO_SEED
	? runtimeEnv.DB_AUTO_SEED === 'true'
	: isDev;

const resolveDbPath = (dbPath: string) =>
	path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);

const createTables = (database: Database.Database) => {
	database.exec(`
		CREATE TABLE IF NOT EXISTS site_settings (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			hero_headline TEXT NOT NULL,
			hero_subheadline TEXT NOT NULL,
			hero_note_title TEXT NOT NULL,
			hero_note_body TEXT NOT NULL,
			hero_highlights_title TEXT NOT NULL,
			hero_highlights_body TEXT NOT NULL,
			about_headline TEXT NOT NULL,
			about_body TEXT NOT NULL,
			focus_headline TEXT NOT NULL,
			focus_body TEXT NOT NULL,
			stack_title TEXT NOT NULL,
			stack_intro TEXT NOT NULL,
			work_title TEXT NOT NULL,
			work_intro TEXT NOT NULL,
			blog_title TEXT NOT NULL,
			blog_intro TEXT NOT NULL,
			contact_title TEXT NOT NULL,
			contact_body TEXT NOT NULL,
			contact_email TEXT NOT NULL,
			github_url TEXT NOT NULL,
			footer_badge TEXT NOT NULL,
			footer_headline TEXT NOT NULL,
			footer_body TEXT NOT NULL,
			footer_cta_label TEXT NOT NULL,
			footer_cta_href TEXT NOT NULL,
			maintenance_enabled INTEGER NOT NULL DEFAULT 0,
			maintenance_title TEXT NOT NULL,
			maintenance_body TEXT NOT NULL,
			error_403_title TEXT NOT NULL,
			error_403_body TEXT NOT NULL,
			error_404_title TEXT NOT NULL,
			error_404_body TEXT NOT NULL,
			error_500_title TEXT NOT NULL,
			error_500_body TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS stack_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			label TEXT NOT NULL,
			detail TEXT,
			sort INTEGER DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS work_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			long_description TEXT,
			highlights TEXT,
			role TEXT,
			tech TEXT,
			link TEXT,
			featured INTEGER DEFAULT 0,
			sort INTEGER DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS posts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			slug TEXT NOT NULL UNIQUE,
			excerpt TEXT,
			content TEXT,
			tags TEXT,
			draft INTEGER DEFAULT 0,
			featured INTEGER DEFAULT 0,
			published_at TEXT,
			created_at TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS assets (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			label TEXT NOT NULL,
			filename TEXT NOT NULL,
			path TEXT NOT NULL,
			mime TEXT NOT NULL,
			size INTEGER NOT NULL,
			public INTEGER DEFAULT 1,
			created_at TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS testimonials (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			role TEXT,
			company TEXT,
			quote TEXT NOT NULL,
			project TEXT,
			result TEXT,
			email TEXT,
			approved INTEGER DEFAULT 0,
			created_at TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS tracking_events (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			type TEXT NOT NULL,
			name TEXT,
			path TEXT,
			referrer TEXT,
			user_agent TEXT,
			ip TEXT,
			payload TEXT,
			created_at TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS footer_links (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			section TEXT NOT NULL,
			label TEXT NOT NULL,
			href TEXT,
			external INTEGER DEFAULT 0,
			sort INTEGER DEFAULT 0
		);
	`);
};

const ensureSiteSettingsColumns = (database: Database.Database) => {
	const columns = (
		database.prepare('PRAGMA table_info(site_settings)').all() as { name: string }[]
	).map((column) => column.name);

	const ensureColumn = (name: string, definition: string) => {
		if (!columns.includes(name)) {
			database.exec(`ALTER TABLE site_settings ADD COLUMN ${name} ${definition}`);
		}
	};

	ensureColumn('hero_highlights_title', 'TEXT NOT NULL DEFAULT ""');
	ensureColumn('hero_highlights_body', 'TEXT NOT NULL DEFAULT ""');
	ensureColumn('focus_headline', 'TEXT NOT NULL DEFAULT ""');
	ensureColumn('focus_body', 'TEXT NOT NULL DEFAULT ""');
	ensureColumn('maintenance_title', 'TEXT NOT NULL DEFAULT ""');
	ensureColumn('maintenance_body', 'TEXT NOT NULL DEFAULT ""');
	ensureColumn('footer_badge', 'TEXT NOT NULL DEFAULT ""');
	ensureColumn('footer_headline', 'TEXT NOT NULL DEFAULT ""');
	ensureColumn('footer_body', 'TEXT NOT NULL DEFAULT ""');
	ensureColumn('footer_cta_label', 'TEXT NOT NULL DEFAULT ""');
	ensureColumn('footer_cta_href', 'TEXT NOT NULL DEFAULT ""');
	ensureColumn('maintenance_enabled', 'INTEGER NOT NULL DEFAULT 0');
	ensureColumn('error_403_title', 'TEXT NOT NULL DEFAULT ""');
	ensureColumn('error_403_body', 'TEXT NOT NULL DEFAULT ""');
	ensureColumn('error_404_title', 'TEXT NOT NULL DEFAULT ""');
	ensureColumn('error_404_body', 'TEXT NOT NULL DEFAULT ""');
	ensureColumn('error_500_title', 'TEXT NOT NULL DEFAULT ""');
	ensureColumn('error_500_body', 'TEXT NOT NULL DEFAULT ""');
};

const ensureWorkItemsColumns = (database: Database.Database) => {
	const columns = (
		database.prepare('PRAGMA table_info(work_items)').all() as { name: string }[]
	).map((column) => column.name);

	const ensureColumn = (name: string, definition: string) => {
		if (!columns.includes(name)) {
			database.exec(`ALTER TABLE work_items ADD COLUMN ${name} ${definition}`);
		}
	};

	ensureColumn('long_description', 'TEXT');
	ensureColumn('highlights', 'TEXT');
};

const ensurePostsColumns = (database: Database.Database) => {
	const columns = (
		database.prepare('PRAGMA table_info(posts)').all() as { name: string }[]
	).map((column) => column.name);

	if (!columns.includes('draft')) {
		database.exec('ALTER TABLE posts ADD COLUMN draft INTEGER NOT NULL DEFAULT 0');
	}
};

const ensureTestimonialsTable = (database: Database.Database) => {
	database.exec(`
		CREATE TABLE IF NOT EXISTS testimonials (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			role TEXT,
			company TEXT,
			quote TEXT NOT NULL,
			project TEXT,
			result TEXT,
			email TEXT,
			approved INTEGER DEFAULT 0,
			created_at TEXT NOT NULL
		);
	`);
};

const ensureAssetsTable = (database: Database.Database) => {
	database.exec(`
		CREATE TABLE IF NOT EXISTS assets (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			label TEXT NOT NULL,
			filename TEXT NOT NULL,
			path TEXT NOT NULL,
			mime TEXT NOT NULL,
			size INTEGER NOT NULL,
			public INTEGER DEFAULT 1,
			created_at TEXT NOT NULL
		);
	`);
};

const ensureTrackingTable = (database: Database.Database) => {
	database.exec(`
		CREATE TABLE IF NOT EXISTS tracking_events (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			type TEXT NOT NULL,
			name TEXT,
			path TEXT,
			referrer TEXT,
			user_agent TEXT,
			ip TEXT,
			payload TEXT,
			created_at TEXT NOT NULL
		);
	`);
};

const seedDefaults = (database: Database.Database) => {
	const existing = database.prepare('SELECT COUNT(*) as count FROM site_settings').get() as {
		count: number;
	};

	if (existing.count > 0) {
		return;
	}

	const now = new Date().toISOString();
	database
		.prepare(
			`
			INSERT INTO site_settings (
				id,
				hero_headline,
				hero_subheadline,
				hero_note_title,
				hero_note_body,
				hero_highlights_title,
				hero_highlights_body,
				about_headline,
				about_body,
				focus_headline,
				focus_body,
				stack_title,
				stack_intro,
				work_title,
				work_intro,
				blog_title,
				blog_intro,
				contact_title,
				contact_body,
				contact_email,
				github_url,
				footer_badge,
				footer_headline,
				footer_body,
				footer_cta_label,
				footer_cta_href,
				maintenance_enabled,
				maintenance_title,
				maintenance_body,
				error_403_title,
				error_403_body,
				error_404_title,
				error_404_body,
				error_500_title,
				error_500_body,
				updated_at
			) VALUES (
				1, @heroHeadline, @heroSubheadline, @heroNoteTitle, @heroNoteBody, @heroHighlightsTitle, @heroHighlightsBody,
				@aboutHeadline, @aboutBody, @focusHeadline, @focusBody, @stackTitle, @stackIntro, @workTitle, @workIntro, @blogTitle, @blogIntro, @contactTitle, @contactBody,
				@contactEmail, @githubUrl, @footerBadge, @footerHeadline, @footerBody, @footerCtaLabel, @footerCtaHref,
				@maintenanceEnabled, @maintenanceTitle, @maintenanceBody, @error403Title, @error403Body, @error404Title, @error404Body, @error500Title, @error500Body,
				@updatedAt
			)
		`
		)
		.run({
			heroHeadline:
				'404ConnerNotFound - Building immersive applications across web, desktop, embedding, and networks.',
			heroSubheadline: 'Proficiency over promises.',
			heroNoteTitle: 'In the lab',
			heroNoteBody: 'Payload CMS, media pipelines, and richer case studies.',
			heroHighlightsTitle: 'Highlights',
			heroHighlightsBody: 'Latest focus, experiments, and releases.',
			aboutHeadline: 'I build shit to prove others wrong.',
			aboutBody: 'This site is my live workspace. I iterate, interoperate, and dedicate for the sake of advancements.',
			focusHeadline: 'I build, I break, I fix',
			focusBody:
				'Like I came, I saw, I conquered but I made, I tried, and I failed... then I succeeded.',
			stackTitle: 'My stack',
			stackIntro: 'The tools I reach for when shipping immersive, reliable work.',
			workTitle: 'My work',
			workIntro: 'Selected projects, prototypes, and experiments.',
			blogTitle: 'Notes',
			blogIntro: 'Build logs, motion experiments, and deep dives.',
			contactTitle: 'Let’s connect.',
			contactBody: 'Want to collaborate or just say hello? Drop a note and I’ll get back to you.',
			contactEmail: 'contact@404connernotfound.dev',
			githubUrl: 'https://github.com/ConnerAdamsMaine',
			footerBadge: '404connernotfound',
			footerHeadline: 'Building loud, expressive web experiences.',
			footerBody: 'Personal portfolio, experiments, and shipping logs. Content updates as the archive grows.',
			footerCtaLabel: 'Say hello',
			footerCtaHref: '/contact',
			maintenanceEnabled: 0,
			maintenanceTitle: 'Maintenance in progress',
			maintenanceBody: 'We are tuning things up. Please check back soon.',
			error403Title: 'Access denied',
			error403Body: 'You do not have permission to view this page.',
			error404Title: 'Page not found',
			error404Body: 'We could not find the page you were looking for.',
			error500Title: 'Something went wrong',
			error500Body: 'An unexpected error occurred. Please try again shortly.',
			updatedAt: now
		});
};

const seedFooterLinks = (database: Database.Database) => {
	const existing = database.prepare('SELECT COUNT(*) as count FROM footer_links').get() as {
		count: number;
	};

	if (existing.count > 0) {
		return;
	}

	const rows = [
		{ section: 'Pages', label: 'Home', href: '/', external: 0, sort: 1 },
		{ section: 'Pages', label: 'About', href: '/about', external: 0, sort: 2 },
		{ section: 'Pages', label: 'Work', href: '/work', external: 0, sort: 3 },
		{ section: 'Pages', label: 'Blog', href: '/blog', external: 0, sort: 4 },
		{ section: 'Pages', label: 'Contact', href: '/contact', external: 0, sort: 5 },
		{ section: 'Links', label: 'About', href: '/about', external: 0, sort: 1 },
		{ section: 'Links', label: 'Work', href: '/work', external: 0, sort: 2 },
		{ section: 'Links', label: 'GitHub', href: 'https://github.com/ConnerAdamsMaine', external: 1, sort: 3 },
		{ section: 'Links', label: 'Discord', href: '', external: 1, sort: 4 },
		{ section: 'Links', label: 'YouTube', href: '', external: 1, sort: 5 }
	];

	const insert = database.prepare(
		'INSERT INTO footer_links (section, label, href, external, sort) VALUES (?, ?, ?, ?, ?)'
	);

	for (const row of rows) {
		insert.run(row.section, row.label, row.href, row.external, row.sort);
	}
};

const ensureDefaultsForExistingRow = (database: Database.Database) => {
	database
		.prepare(
			`
			UPDATE site_settings
			SET
				hero_highlights_title = CASE
					WHEN hero_highlights_title = '' THEN 'Highlights'
					ELSE hero_highlights_title
				END,
				hero_highlights_body = CASE
					WHEN hero_highlights_body = '' THEN 'Latest focus, experiments, and releases.'
					ELSE hero_highlights_body
				END,
				focus_headline = CASE
					WHEN focus_headline = '' THEN 'I build, I break, I fix'
					ELSE focus_headline
				END,
				focus_body = CASE
					WHEN focus_body = '' THEN 'Like I came, I saw, I conquered but I made, I tried, and I failed... then I succeeded.'
					ELSE focus_body
				END,
				maintenance_title = CASE
					WHEN maintenance_title = '' THEN 'Maintenance in progress'
					ELSE maintenance_title
				END,
				maintenance_body = CASE
					WHEN maintenance_body = '' THEN 'We are tuning things up. Please check back soon.'
					ELSE maintenance_body
				END,
				footer_badge = CASE
					WHEN footer_badge = '' THEN '404connernotfound'
					ELSE footer_badge
				END,
				footer_headline = CASE
					WHEN footer_headline = '' THEN 'Building loud, expressive web experiences.'
					ELSE footer_headline
				END,
				footer_body = CASE
					WHEN footer_body = '' THEN 'Personal portfolio, experiments, and shipping logs. Content updates as the archive grows.'
					ELSE footer_body
				END,
				footer_cta_label = CASE
					WHEN footer_cta_label = '' THEN 'Say hello'
					ELSE footer_cta_label
				END,
				footer_cta_href = CASE
					WHEN footer_cta_href = '' THEN '/contact'
					ELSE footer_cta_href
				END,
				maintenance_enabled = CASE
					WHEN maintenance_enabled IS NULL THEN 0
					ELSE maintenance_enabled
				END,
				error_403_title = CASE
					WHEN error_403_title = '' THEN 'Access denied'
					ELSE error_403_title
				END,
				error_403_body = CASE
					WHEN error_403_body = '' THEN 'You do not have permission to view this page.'
					ELSE error_403_body
				END,
				error_404_title = CASE
					WHEN error_404_title = '' THEN 'Page not found'
					ELSE error_404_title
				END,
				error_404_body = CASE
					WHEN error_404_body = '' THEN 'We could not find the page you were looking for.'
					ELSE error_404_body
				END,
				error_500_title = CASE
					WHEN error_500_title = '' THEN 'Something went wrong'
					ELSE error_500_title
				END,
				error_500_body = CASE
					WHEN error_500_body = '' THEN 'An unexpected error occurred. Please try again shortly.'
					ELSE error_500_body
				END
			WHERE id = 1
		`
		)
		.run();
};

type Migration = {
	id: number;
	name: string;
	up: (database: Database.Database) => void;
};

const runMigrations = (database: Database.Database) => {
	database.exec(`
		CREATE TABLE IF NOT EXISTS migrations (
			id INTEGER PRIMARY KEY,
			name TEXT NOT NULL,
			applied_at TEXT NOT NULL
		);
	`);

	const applied = database
		.prepare('SELECT id FROM migrations ORDER BY id ASC')
		.all() as { id: number }[];
	const appliedIds = new Set(applied.map((row) => row.id));

	const migrations: Migration[] = [
		{ id: 1, name: 'init', up: createTables },
		{ id: 2, name: 'site_settings_columns', up: ensureSiteSettingsColumns },
		{ id: 3, name: 'site_settings_defaults', up: ensureDefaultsForExistingRow },
		{ id: 4, name: 'posts_draft_column', up: ensurePostsColumns },
		{ id: 5, name: 'work_items_long_description', up: ensureWorkItemsColumns },
		{ id: 6, name: 'site_settings_error_columns', up: ensureSiteSettingsColumns },
		{ id: 7, name: 'site_settings_error_defaults', up: ensureDefaultsForExistingRow },
		{ id: 8, name: 'testimonials_table', up: ensureTestimonialsTable },
		{ id: 9, name: 'assets_table', up: ensureAssetsTable },
		{ id: 10, name: 'tracking_table', up: ensureTrackingTable },
		{ id: 11, name: 'site_settings_footer_columns', up: ensureSiteSettingsColumns },
		{ id: 12, name: 'site_settings_footer_defaults', up: ensureDefaultsForExistingRow },
		{ id: 13, name: 'site_settings_maintenance_columns', up: ensureSiteSettingsColumns },
		{ id: 14, name: 'site_settings_maintenance_defaults', up: ensureDefaultsForExistingRow }
	];

	for (const migration of migrations) {
		if (appliedIds.has(migration.id)) continue;
		migration.up(database);
		database
			.prepare('INSERT INTO migrations (id, name, applied_at) VALUES (?, ?, ?)')
			.run(migration.id, migration.name, new Date().toISOString());
	}
};

const openDb = () => {
	if (db) return db;

	const dbPath = runtimeEnv.DB_PATH ?? DEFAULT_DB_PATH;
	const resolved = resolveDbPath(dbPath);
	ensureDbPath(resolved);

	db = new Database(resolved);
	db.pragma('journal_mode = WAL');
	return db;
};

const bootstrapDb = (database: Database.Database) => {
	runMigrations(database);
	seedDefaults(database);
	seedFooterLinks(database);
};

const assertSchemaReady = (database: Database.Database) => {
	const row = database
		.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'site_settings'")
		.get() as { name: string } | undefined;
	if (!row) {
		throw new Error('Database is not initialized. Run `npm run db:seed` or set DB_AUTO_SEED=true.');
	}
};

export const getDb = () => {
	const database = openDb();
	if (!dbInitialized) {
		if (shouldAutoSeed) {
			bootstrapDb(database);
		} else {
			assertSchemaReady(database);
		}
		dbInitialized = true;
	}
	return database;
};

export const seedDatabase = () => {
	const database = openDb();
	bootstrapDb(database);
	dbInitialized = true;
	clearCache(
		'siteSettings',
		'stackItems',
		'workItems',
		'featuredWork',
		'posts',
		'assets',
		'testimonials',
		'footerLinks'
	);
};

export const getSiteSettings = () => {
	const cached = getCached(cache.siteSettings);
	if (cached) return cached;
	const database = getDb();
	const row = database
		.prepare(
			`
			SELECT
				id,
				hero_headline as heroHeadline,
				hero_subheadline as heroSubheadline,
				hero_note_title as heroNoteTitle,
				hero_note_body as heroNoteBody,
				hero_highlights_title as heroHighlightsTitle,
				hero_highlights_body as heroHighlightsBody,
				about_headline as aboutHeadline,
				about_body as aboutBody,
				focus_headline as focusHeadline,
				focus_body as focusBody,
				stack_title as stackTitle,
				stack_intro as stackIntro,
				work_title as workTitle,
				work_intro as workIntro,
				blog_title as blogTitle,
				blog_intro as blogIntro,
				contact_title as contactTitle,
				contact_body as contactBody,
				contact_email as contactEmail,
				github_url as githubUrl,
				footer_badge as footerBadge,
				footer_headline as footerHeadline,
				footer_body as footerBody,
				footer_cta_label as footerCtaLabel,
				footer_cta_href as footerCtaHref,
				maintenance_enabled as maintenanceEnabled,
				maintenance_title as maintenanceTitle,
				maintenance_body as maintenanceBody,
				error_403_title as error403Title,
				error_403_body as error403Body,
				error_404_title as error404Title,
				error_404_body as error404Body,
				error_500_title as error500Title,
				error_500_body as error500Body
			FROM site_settings
			WHERE id = 1
		`
		)
		.get() as SiteSettings;

	setCache('siteSettings', row);
	return row;
};

export const updateSiteSettings = (payload: Omit<SiteSettings, 'id'>) => {
	const database = getDb();
	const now = new Date().toISOString();

	database
		.prepare(
			`
			UPDATE site_settings
			SET
				hero_headline = @heroHeadline,
				hero_subheadline = @heroSubheadline,
				hero_note_title = @heroNoteTitle,
				hero_note_body = @heroNoteBody,
				hero_highlights_title = @heroHighlightsTitle,
				hero_highlights_body = @heroHighlightsBody,
				about_headline = @aboutHeadline,
				about_body = @aboutBody,
				focus_headline = @focusHeadline,
				focus_body = @focusBody,
				stack_title = @stackTitle,
				stack_intro = @stackIntro,
				work_title = @workTitle,
				work_intro = @workIntro,
				blog_title = @blogTitle,
				blog_intro = @blogIntro,
				contact_title = @contactTitle,
				contact_body = @contactBody,
				contact_email = @contactEmail,
				github_url = @githubUrl,
				footer_badge = @footerBadge,
				footer_headline = @footerHeadline,
				footer_body = @footerBody,
				footer_cta_label = @footerCtaLabel,
				footer_cta_href = @footerCtaHref,
				maintenance_enabled = @maintenanceEnabled,
				maintenance_title = @maintenanceTitle,
				maintenance_body = @maintenanceBody,
				error_403_title = @error403Title,
				error_403_body = @error403Body,
				error_404_title = @error404Title,
				error_404_body = @error404Body,
				error_500_title = @error500Title,
				error_500_body = @error500Body,
				updated_at = @updatedAt
			WHERE id = 1
		`
		)
		.run({ ...payload, updatedAt: now });

	clearCache('siteSettings');
};

export const getStackItems = () => {
	const cached = getCached(cache.stackItems);
	if (cached) return cached;
	const database = getDb();
	const rows = database
		.prepare('SELECT id, label, detail, sort FROM stack_items ORDER BY sort ASC, id DESC')
		.all() as StackItem[];

	setCache('stackItems', rows);
	return rows;
};

export const createStackItem = (label: string, detail: string | null, sort: number) => {
	const database = getDb();
	database
		.prepare('INSERT INTO stack_items (label, detail, sort) VALUES (?, ?, ?)')
		.run(label, detail, sort);

	clearCache('stackItems');
};

export const updateStackItem = (id: number, label: string, detail: string | null, sort: number) => {
	const database = getDb();
	database
		.prepare('UPDATE stack_items SET label = ?, detail = ?, sort = ? WHERE id = ?')
		.run(label, detail, sort, id);

	clearCache('stackItems');
};

export const deleteStackItem = (id: number) => {
	const database = getDb();
	database.prepare('DELETE FROM stack_items WHERE id = ?').run(id);

	clearCache('stackItems');
};

export const getWorkItems = () => {
	const cached = getCached(cache.workItems);
	if (cached) return cached;
	const database = getDb();
	const rows = database
		.prepare(
			`SELECT id, title, description, long_description as longDescription, highlights, role, tech, link, featured, sort
			 FROM work_items
			 ORDER BY sort ASC, id DESC`
		)
		.all() as WorkItem[];

	setCache('workItems', rows);
	return rows;
};

export const getFeaturedWork = () => {
	const cached = getCached(cache.featuredWork);
	if (cached) return cached;
	const workItems = getCached(cache.workItems);
	const rows = workItems
		? workItems.filter((item) => item.featured === 1)
		: (getDb()
				.prepare(
					`SELECT id, title, description, long_description as longDescription, highlights, role, tech, link, featured, sort
					 FROM work_items
					 WHERE featured = 1
					 ORDER BY sort ASC, id DESC`
				)
				.all() as WorkItem[]);

	setCache('featuredWork', rows);
	return rows;
};

export const createWorkItem = (
	title: string,
	description: string,
	longDescription: string | null,
	highlights: string | null,
	role: string | null,
	tech: string | null,
	link: string | null,
	featured: number,
	sort: number
) => {
	const database = getDb();
	database
		.prepare(
			`INSERT INTO work_items (title, description, long_description, highlights, role, tech, link, featured, sort)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(title, description, longDescription, highlights, role, tech, link, featured, sort);

	clearCache('workItems', 'featuredWork');
};

export const updateWorkItem = (
	id: number,
	title: string,
	description: string,
	longDescription: string | null,
	highlights: string | null,
	role: string | null,
	tech: string | null,
	link: string | null,
	featured: number,
	sort: number
) => {
	const database = getDb();
	database
		.prepare(
			`UPDATE work_items
			 SET title = ?, description = ?, long_description = ?, highlights = ?, role = ?, tech = ?, link = ?, featured = ?, sort = ?
			 WHERE id = ?`
		)
		.run(title, description, longDescription, highlights, role, tech, link, featured, sort, id);

	clearCache('workItems', 'featuredWork');
};

export const deleteWorkItem = (id: number) => {
	const database = getDb();
	database.prepare('DELETE FROM work_items WHERE id = ?').run(id);

	clearCache('workItems', 'featuredWork');
};

export const getPosts = () => {
	const cached = getCached(cache.posts);
	if (cached) return cached;
	const database = getDb();
	const rows = database
		.prepare(
			`SELECT id, title, slug, excerpt, content, tags, draft, featured, published_at as publishedAt, created_at as createdAt
			 FROM posts
			 ORDER BY published_at DESC, created_at DESC`
		)
		.all() as BlogPost[];

	setCache('posts', rows);
	return rows;
};

export const getPublishedPosts = () => {
	const cached = getCached(cache.posts);
	if (cached) {
		return cached.filter((post) => post.draft === 0);
	}
	const database = getDb();
	return database
		.prepare(
			`SELECT id, title, slug, excerpt, content, tags, draft, featured, published_at as publishedAt, created_at as createdAt
			 FROM posts
			 WHERE draft = 0
			 ORDER BY published_at DESC, created_at DESC`
		)
		.all() as BlogPost[];
};

export const getPostBySlug = (slug: string) => {
	const cached = getCached(cache.posts);
	if (cached) {
		return cached.find((post) => post.slug === slug);
	}
	const database = getDb();
	const row = database
		.prepare(
			`SELECT id, title, slug, excerpt, content, tags, draft, featured, published_at as publishedAt, created_at as createdAt
			 FROM posts
			 WHERE slug = ?`
		)
		.get(slug) as BlogPost | undefined;

	return row;
};

export const getPublishedPostBySlug = (slug: string) => {
	const cached = getCached(cache.posts);
	if (cached) {
		return cached.find((post) => post.slug === slug && post.draft === 0);
	}
	const database = getDb();
	const row = database
		.prepare(
			`SELECT id, title, slug, excerpt, content, tags, draft, featured, published_at as publishedAt, created_at as createdAt
			 FROM posts
			 WHERE slug = ? AND draft = 0`
		)
		.get(slug) as BlogPost | undefined;

	return row;
};

const slugify = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)+/g, '');

const ensureUniqueSlug = (database: Database.Database, slug: string, currentId?: number) => {
	let candidate = slug || 'post';
	let suffix = 1;
	while (true) {
		const existing = database
			.prepare('SELECT id FROM posts WHERE slug = ?')
			.get(candidate) as { id: number } | undefined;

		if (!existing || (currentId && existing.id === currentId)) {
			return candidate;
		}

		candidate = `${slug}-${suffix}`;
		suffix += 1;
	}
};

export const createPost = (
	title: string,
	excerpt: string | null,
	content: string | null,
	tags: string | null,
	draft: number,
	featured: number,
	publishedAt: string | null,
	slug?: string
) => {
	const database = getDb();
	const baseSlug = slug && slug.length > 0 ? slug : slugify(title);
	const finalSlug = ensureUniqueSlug(database, baseSlug);
	const now = new Date().toISOString();

	database
		.prepare(
			`INSERT INTO posts (title, slug, excerpt, content, tags, draft, featured, published_at, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(title, finalSlug, excerpt, content, tags, draft, featured, publishedAt, now);

	clearCache('posts');
};

export const updatePost = (
	id: number,
	title: string,
	excerpt: string | null,
	content: string | null,
	tags: string | null,
	draft: number,
	featured: number,
	publishedAt: string | null,
	slug?: string
) => {
	const database = getDb();
	const baseSlug = slug && slug.length > 0 ? slug : slugify(title);
	const finalSlug = ensureUniqueSlug(database, baseSlug, id);

	database
		.prepare(
			`UPDATE posts
			 SET title = ?, slug = ?, excerpt = ?, content = ?, tags = ?, draft = ?, featured = ?, published_at = ?
			 WHERE id = ?`
		)
		.run(title, finalSlug, excerpt, content, tags, draft, featured, publishedAt, id);

	clearCache('posts');
};

export const deletePost = (id: number) => {
	const database = getDb();
	database.prepare('DELETE FROM posts WHERE id = ?').run(id);

	clearCache('posts');
};

export const getAssets = () => {
	const cached = getCached(cache.assets);
	if (cached) return cached;
	const database = getDb();
	const rows = database
		.prepare(
			`SELECT id, label, filename, path, mime, size, public, created_at as createdAt
			 FROM assets
			 ORDER BY created_at DESC, id DESC`
		)
		.all() as Asset[];

	setCache('assets', rows);
	return rows;
};

export const getPublicAssets = () => getAssets().filter((asset) => asset.public === 1);

export const createAsset = (
	label: string,
	filename: string,
	pathValue: string,
	mime: string,
	size: number,
	isPublic: number
) => {
	const database = getDb();
	const now = new Date().toISOString();
	database
		.prepare(
			`INSERT INTO assets (label, filename, path, mime, size, public, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.run(label, filename, pathValue, mime, size, isPublic, now);

	clearCache('assets');
};

export const updateAsset = (id: number, label: string, isPublic: number) => {
	const database = getDb();
	database
		.prepare(
			`UPDATE assets
			 SET label = ?, public = ?
			 WHERE id = ?`
		)
		.run(label, isPublic, id);

	clearCache('assets');
};

export const deleteAsset = (id: number) => {
	const database = getDb();
	database.prepare('DELETE FROM assets WHERE id = ?').run(id);

	clearCache('assets');
};

export const createTrackingEvent = (
	type: string,
	name: string | null,
	pathValue: string | null,
	referrer: string | null,
	userAgent: string | null,
	ip: string | null,
	payload: string | null
) => {
	const database = getDb();
	const now = new Date().toISOString();
	database
		.prepare(
			`INSERT INTO tracking_events (type, name, path, referrer, user_agent, ip, payload, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(type, name, pathValue, referrer, userAgent, ip, payload, now);
};

export const getTrackingEvents = (limit = 100) => {
	const database = getDb();
	return database
		.prepare(
			`SELECT id, type, name, path, referrer, user_agent as userAgent, ip, payload, created_at as createdAt
			 FROM tracking_events
			 ORDER BY created_at DESC, id DESC
			 LIMIT ?`
		)
		.all(limit) as TrackingEvent[];
};

export const getTrackingCounts = () => {
	const database = getDb();
	const total = database.prepare('SELECT COUNT(*) as count FROM tracking_events').get() as {
		count: number;
	};
	const lastDay = database
		.prepare(
			`SELECT COUNT(*) as count
			 FROM tracking_events
			 WHERE created_at >= datetime('now', '-1 day')`
		)
		.get() as { count: number };
	const lastWeek = database
		.prepare(
			`SELECT COUNT(*) as count
			 FROM tracking_events
			 WHERE created_at >= datetime('now', '-7 day')`
		)
		.get() as { count: number };
	const byType = database
		.prepare(
			`SELECT type, COUNT(*) as count
			 FROM tracking_events
			 GROUP BY type
			 ORDER BY count DESC`
		)
		.all() as { type: string; count: number }[];
	const topPaths = database
		.prepare(
			`SELECT path, COUNT(*) as count
			 FROM tracking_events
			 WHERE path IS NOT NULL AND path != ''
			 GROUP BY path
			 ORDER BY count DESC
			 LIMIT 8`
		)
		.all() as { path: string; count: number }[];

	return {
		total: total.count,
		lastDay: lastDay.count,
		lastWeek: lastWeek.count,
		byType,
		topPaths
	};
};

export const getTestimonials = () => {
	const cached = getCached(cache.testimonials);
	if (cached) return cached;
	const database = getDb();
	const rows = database
		.prepare(
			`SELECT id, name, role, company, quote, project, result, email, approved, created_at as createdAt
			 FROM testimonials
			 ORDER BY created_at DESC, id DESC`
		)
		.all() as Testimonial[];

	setCache('testimonials', rows);
	return rows;
};

export const getApprovedTestimonials = () => {
	return getTestimonials().filter((testimonial) => testimonial.approved === 1);
};

export const createTestimonial = (
	name: string,
	role: string | null,
	company: string | null,
	quote: string,
	project: string | null,
	result: string | null,
	email: string | null
) => {
	const database = getDb();
	const now = new Date().toISOString();
	database
		.prepare(
			`INSERT INTO testimonials (name, role, company, quote, project, result, email, approved, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
		)
		.run(name, role, company, quote, project, result, email, now);

	clearCache('testimonials');
};

export const updateTestimonialApproval = (id: number, approved: number) => {
	const database = getDb();
	database
		.prepare(
			`UPDATE testimonials
			 SET approved = ?
			 WHERE id = ?`
		)
		.run(approved, id);

	clearCache('testimonials');
};

export const deleteTestimonial = (id: number) => {
	const database = getDb();
	database.prepare('DELETE FROM testimonials WHERE id = ?').run(id);

	clearCache('testimonials');
};

export const getFooterLinks = () => {
	const cached = getCached(cache.footerLinks);
	if (cached) return cached;
	const database = getDb();
	const rows = database
		.prepare(
			`SELECT id, section, label, href, external, sort
			 FROM footer_links
			 ORDER BY section ASC, sort ASC, id ASC`
		)
		.all() as FooterLink[];

	setCache('footerLinks', rows);
	return rows;
};

export const createFooterLink = (
	section: string,
	label: string,
	href: string | null,
	external: number,
	sort: number
) => {
	const database = getDb();
	database
		.prepare(
			'INSERT INTO footer_links (section, label, href, external, sort) VALUES (?, ?, ?, ?, ?)'
		)
		.run(section, label, href, external, sort);

	clearCache('footerLinks');
};

export const updateFooterLink = (
	id: number,
	section: string,
	label: string,
	href: string | null,
	external: number,
	sort: number
) => {
	const database = getDb();
	database
		.prepare(
			`UPDATE footer_links
			 SET section = ?, label = ?, href = ?, external = ?, sort = ?
			 WHERE id = ?`
		)
		.run(section, label, href, external, sort, id);

	clearCache('footerLinks');
};

export const deleteFooterLink = (id: number) => {
	const database = getDb();
	database.prepare('DELETE FROM footer_links WHERE id = ?').run(id);

	clearCache('footerLinks');
};

export type {
	SiteSettings,
	StackItem,
	WorkItem,
	BlogPost,
	Asset,
	Testimonial,
	TrackingEvent,
	FooterLink
};
