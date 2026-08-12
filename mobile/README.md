# PadelleBoxd Mobile

Native mobile client for [PadelleBoxd](../README.md), built with **Expo SDK 57** +
**React Native** + **expo-router** + TypeScript. It talks only to the PadelleBoxd
REST API (auth, search, series, list management, profiles) — it never touches the
database or TMDB directly.

## Prerequisites

- An installed PadelleBoxd backend reachable over HTTPS with the latest API routes
  (Bearer-token login, `GET /api/series/trending`, `myWatchedSeasons`/`seasons` in the
  series detail). Redeploy the web app after pulling these changes.
- Node 20+.

## Setup

```bash
npm install
cp .env.example .env   # optional; defaults to the production API
npx expo start
```

Scan the QR code with Expo Go, or press `a`/`i` for an emulator.

## Configuration

| Variable | Description |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Base URL of the PadelleBoxd API, **no trailing slash**. Defaults to `https://padelle-boxd.vercel.app`. |

> `.env` files are gitignored. Any `EXPO_PUBLIC_*` value in `.env` is inlined at build
> time by Expo.

## Auth

- Login (`POST /api/auth/login`) returns a signed JWT in the response body alongside
  the cookie. The app stores the token with `expo-secure-store` and sends it as
  `Authorization: Bearer <token>` on every request; anonymous (guest) calls work too.
- Accounts must be approved by a PadelleBoxd administrator before they can log in.

## What's included

- **Home**: TMDB trending this week + global stats (from `/api/series/trending`).
- **Search**: debounced series search (`/api/series?q=`).
- **My List**: status tabs + poster grid; add/edit/remove and rate from the series screen.
- **Series detail**: backdrop hero, metadata, add-to-list `StatusPicker`/`RatingPicker`,
  season manager (mark seasons watched), and "who's watching" list.
- **Profiles**: public `/u/:username` with per-status filters.
- **Settings**: account info, public profile shortcut and log out.

The admin panel is intentionally **web-only** (it is IP-restricted on the server).

## Layout

```
src/
  app/            # expo-router routes: (tabs), login, register, series/[tmdbId], u/[username]
  components/     # PosterCard, StatusBadge, StatusPicker, RatingPicker, SeasonManager, SeriesRow, ui
  constants/      # dark theme + series statuses
  hooks/          # useApi (fetch + error/loading state)
  lib/            # api fetch wrapper, auth context, secure storage, config, types
```

## Build

```bash
npx eas build --platform android   # or: --platform ios (needs a Mac / Apple Developer account)
```