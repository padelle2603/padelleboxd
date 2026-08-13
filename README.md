# PadelleBoxd

A personal TV-series tracker. Users can register, get approved by an administrator, and then track TV series with a status (Watched, Watching, Abandoned, On Hold, Planned) and a 1–10 rating. Lists are publicly visible to guests. Data comes from the TMDB API (TV series only).

> **Attribution**: this product uses the TMDB API but is not endorsed or certified by TMDB.

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

