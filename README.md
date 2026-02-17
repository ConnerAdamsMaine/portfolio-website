# 404connernotfound Portfolio

SvelteKit + Tailwind portfolio site with an admin UI, PostgreSQL-first storage (with SQLite fallback), and Redis-backed caching/rate limiting.

## Requirements
- Node `24.13.0` (see `.nvmrc` / `package.json` `engines`)
- npm (engine strict is enabled via `.npmrc`)

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and update values.
3. Optional local infrastructure (PostgreSQL + Redis with persistent volumes): `docker compose -f docker-compose.local.yml up -d`
4. Initialize the SQLite content database (recommended for production): `npm run db:seed`
5. Optional: backfill SQLite data into PostgreSQL: `npm run db:migrate:postgres`

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string used for full app storage (content/admin/telemetry)
- `PG_SSL`: Enable SSL for PostgreSQL (`true` / `false`)
- `PG_POOL_MAX`: Maximum PostgreSQL connection pool size
- `REDIS_URL`: Redis connection string for distributed rate limiting and caching
- `REDIS_PREFIX`: Redis key prefix (default `portfolio:`)
- `DB_PATH`: SQLite file path for fallback/local data storage (relative to project root if not absolute)
- `DB_AUTO_SEED`: Auto-create/seed tables on startup (`true` in dev by default; set `false` in production)
- `ADMIN_SESSION_SECRET`: HMAC secret for admin sessions
- `ADMIN_SESSION_VERSION`: Bump to revoke existing admin sessions
- `ADMIN_EMAIL`: Admin login email
- `ADMIN_PASSWORD`: Admin login password
- `LEAD_WEBHOOK_URL`: Optional webhook endpoint for contact/collaborate/subscribe notifications
- `LEAD_WEBHOOK_TOKEN`: Optional bearer token sent to the lead webhook
- `LEAD_NOTIFY_TIMEOUT_MS`: Lead webhook timeout in milliseconds (default `2500`)
- `PLAYGROUND_ENABLED`: Enable/disable the playground runtime
- `PLAYGROUND_REQUIRE_ADMIN`: Require admin auth for playground session APIs (recommended `true`)
- `PLAYGROUND_ENFORCE_SAME_ORIGIN`: Reject cross-origin playground API requests
- `PLAYGROUND_RUNTIME_MODE`: `docker` (default) or `mock`
- `PLAYGROUND_DOCKER_BINARY`: Docker CLI binary path (default `docker`)
- `PLAYGROUND_WS_HOST`: Bind host for playground websocket server
- `PLAYGROUND_WS_PORT`: Bind port for playground websocket server
- `PLAYGROUND_WS_PATH`: Websocket path (default `/playground/ws`)
- `PLAYGROUND_WS_PUBLIC_URL`: Optional externally reachable ws/wss endpoint override
- `PLAYGROUND_CREATE_RATE_LIMIT_PER_MINUTE`: Max session create calls per IP each minute
- `PLAYGROUND_COMMAND_TIMEOUT_MS`: Timeout for docker runtime commands
- `PLAYGROUND_MAX_OUTPUT_BYTES`: Cap command output bytes stored/sent per execution
- `PLAYGROUND_MAX_COMMANDS_PER_SESSION`: Hard cap on commands executed in one session
- `PLAYGROUND_COMMAND_RATE_WINDOW_MS`: Command burst-control window duration
- `PLAYGROUND_MAX_COMMANDS_PER_WINDOW`: Command burst-control max inside each window

## Development
`npm run dev`

## Build & Run (Node Adapter)
1. `npm run build`
2. `node build/index.js`

You can also use `npm run preview` to test the production build locally.

## Admin
- Login: `/admin/login`
- Credentials are read from `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- CSRF protection and rate limiting are enabled for admin actions
- Resume management: `/admin/resume`
- Playground operations: `/admin/playground`

## Lead Capture
- `POST /contact` and `POST /collaborate` submissions are persisted in PostgreSQL when `DATABASE_URL` is configured (fallback: SQLite)
- `POST /subscribe` upserts subscribers in PostgreSQL when `DATABASE_URL` is configured (fallback: SQLite)
- Optional webhook notifications are sent when `LEAD_WEBHOOK_URL` is configured

## Tracking
- `/tracking/events` and `/tracking/pixel` persist tracking data in PostgreSQL when configured (fallback: SQLite)
- `/admin/tracking` reads counts/events from PostgreSQL when configured

## Caching & Rate Limiting
- Redis is used for distributed rate limiting when `REDIS_URL` is set (fallback: in-memory limiter)
- Redis is used to cache selected server responses (layout/home/about/work/blog/rss/sitemap) with short TTLs
- Admin session validation uses Redis-backed token decision caching to reduce repeated signature checks
- Playground status snapshots (counts/sessions/logs/playsets) are cached in Redis and invalidated on lifecycle changes
- Tracking counts/event lists are cached in Redis and invalidated on new tracking events
- Content cache keys are invalidated on related admin writes (site settings, stack, work, posts, footer, playsets)

## Playground
- User page: `/playground`
- Session API: `POST /api/playground/session`, `DELETE /api/playground/session`
- Websocket runtime events: configurable endpoint (defaults to `ws://<host>:24680/playground/ws`)

## Tooling
- `npm run check` — type and Svelte checks
- `npm run lint` / `npm run lint:fix`
- `npm run format` / `npm run format:write`
- `npm run db:seed` — explicit schema/bootstrap step
- `npm run db:migrate:postgres` — backfill all SQLite tables into PostgreSQL with upserts

## Deployment Notes
- Sample Nginx config: `nginx/portfolio.conf`
- Procfile: `Procfile`
- systemd unit: `deploy/portfolio.service`
- Generated artifacts (`build/`, `data/*.sqlite*`) are ignored by git; clean before deploys if needed.
