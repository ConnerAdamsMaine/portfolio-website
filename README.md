# 404connernotfound Portfolio

SvelteKit + Tailwind portfolio site with an admin UI backed by SQLite.

## Requirements
- Node `24.13.0` (see `.nvmrc` / `package.json` `engines`)
- npm (engine strict is enabled via `.npmrc`)

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and update values.
3. Initialize the database (recommended for production): `npm run db:seed`

## Environment Variables
- `DB_PATH`: SQLite file path (relative to project root if not absolute)
- `DB_AUTO_SEED`: Auto-create/seed tables on startup (`true` in dev by default)
- `ADMIN_SESSION_SECRET`: HMAC secret for admin sessions
- `ADMIN_SESSION_VERSION`: Bump to revoke existing admin sessions
- `ADMIN_EMAIL`: Admin login email
- `ADMIN_PASSWORD`: Admin login password

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

## Tooling
- `npm run check` — type and Svelte checks
- `npm run lint` / `npm run lint:fix`
- `npm run format` / `npm run format:write`
- `npm run db:seed` — explicit schema/bootstrap step

## Deployment Notes
- Sample Nginx config: `nginx/portfolio.conf`
- Procfile: `Procfile`
- systemd unit: `deploy/portfolio.service`
- Generated artifacts (`build/`, `data/*.sqlite*`) are ignored by git; clean before deploys if needed.
