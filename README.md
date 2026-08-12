# PadelleBoxd

A personal TV-series tracker in the style of Serializd / Trakt.tv. Users can register, get approved by an administrator, and then track TV series with a status (Watched, Watching, Abandoned, On Hold, Planned) and a 1–10 rating. Lists are publicly visible to guests. Data comes from the TMDB API (TV series only).

## Stack

- **Next.js 16 (App Router)** + TypeScript + Tailwind CSS v4
- **Prisma 7 + PostgreSQL (Supabase)** (`prisma-client` generator, driver adapter `@prisma/adapter-pg`)
- **Auth**: bcrypt password hashing + signed JWT session cookie (`jose`). The same JWT is also
  returned from `POST /api/auth/login` and accepted as `Authorization: Bearer <token>`, so
  native/last-party clients (see the mobile app) can log in without cookies.
- **Validation**: zod
- All business logic lives behind **REST API routes** (under `src/app/api`) so they can be reused later by a mobile app.

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL (Supabase), TMDB_API_KEY, SESSION_SECRET
npx prisma migrate deploy   # apply schema to Supabase
npx prisma db seed          # bootstrap the admin account (ADMIN_* vars in .env)
npm run dev
```

Open http://localhost:3000. Log in with the seeded admin and reach the admin panel by typing the hidden shortcut **`padelleboxdadmin`** on any page (no visible link). Optionally restrict the panel to your machines by setting `ADMIN_ALLOWED_IPS`.

> The TMDB API key and database URL live only in `.env` (gitignored) and stay server-side; the client never sees them.

### Supabase connection strings

Supabase moved direct connections to IPv6-only. On IPv4-only networks use the **Shared Pooler in transaction mode** (`aws-N-<region>.pooler.supabase.com:6543`, username `postgres.<project-ref>`). Use **transaction mode** (with `pgbouncer=true`): the session pooler caps at 15 concurrent connections which is easy to exhaust on Vercel's serverless instances, while transaction mode returns each connection to the pool after the transaction finishes. The URL in `.env` includes `uselibpqcompat=true` so `sslmode=require` means "encrypt without CA verification" — required because the pooler uses a private CA.

## How accounts work

1. Anyone can register at `/register`; the account is created with role `PENDING`.
2. An administrator approves it from the admin panel (`APPROVED`) or rejects it (`REJECTED`).
3. Only `APPROVED` / `ADMIN` users can log in and manage their list.

## Features

- Search TV series (TMDB), guest-visible series detail pages showing who tracks each series
- Add series to your list with a status + optional 1–10 rating (ratings only allowed for Watched / Abandoned)
- Change status/rating or remove entries from `/dashboard`
- Public profile pages at `/u/:username` with per-status tabs, visible to guests
- Hidden admin panel to approve/reject/promote users
- API routes under `/api` ready for a future mobile client

## Project layout

```
prisma/
  schema.prisma          # User, Series, UserSeries (+ Role/Status enums)
  seed.ts                # admin bootstrap
  migrations/            # Prisma migrations applied to Supabase
src/
  app/
    api/                 # REST API routes (auth, series, me/series, users, admin)
    (page)s/             # landing, search, series detail, profiles, dashboard, admin, auth
  components/            # Header, PosterCard, SearchBar, list managers, forms, AdminShortcut
  lib/                   # db (Prisma singleton), auth (session), tmdb, constants, upcoming
```

## Mobile app

There is a native client in [`mobile/`](mobile/README.md) (Expo / React Native, TypeScript).
It consumes the REST API: search and series pages are public, while the personal list uses
the bearer token returned by login. Point it at any deployed API with `EXPO_PUBLIC_API_URL`.

Backend endpoints added for the mobile client (also usable from the web):

- `GET /api/series/trending` — trending this week + global stats (public)
- `GET /api/series/:id` — now also returns `seasons` and, for the session user, `myWatchedSeasons`
- `POST /api/auth/login` — additionally returns the signed JWT in the response body so native
  clients can send `Authorization: Bearer <token>` instead of relying on cookies

## Deployment notes

The database is hosted on Supabase (PostgreSQL, SSL required). The app is serverless-friendly (no local disk needed), so **Vercel** works out of the box.

### Deploy on Vercel

1. Import the repo in the Vercel dashboard (framework Next.js is auto-detected) or run:
   ```bash
   npx vercel link && npx vercel --prod
   ```
2. Set these project environment variables (Project → Settings → Environment Variables, for all environments):
   - `DATABASE_URL` — the Supabase pooler string from `.env`
   - `TMDB_API_KEY`
   - `SESSION_SECRET` — long random string
   - `ADMIN_ALLOWED_IPS` — your IP(s) if you want the panel locked to your machine
3. No build step is required: `postinstall` runs `prisma generate` (the client is gitignored) and `vercel.json` pins the Next.js build. Migrations are one-time — apply schema changes locally with `npx prisma migrate deploy` before pushing.

Alternative hosts: any persistent Node runtime (`npm run build && npm start`).

### Keep Supabase from pausing (free plan)

Supabase pauses free projects after 7 days without any API call. A Vercel Cron
(`vercel.json` → `crons`) hits `/api/cron/keepalive` every day at 06:00 UTC,
which performs a DB read so the project never goes idle. The route is protected by
`CRON_SECRET` (set it as a Sensitive environment variable); Vercel sends it
automatically as a Bearer token on cron invocations.
