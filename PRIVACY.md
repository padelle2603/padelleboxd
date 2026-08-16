# Privacy Policy — PadelleBoxd

_Last updated: 16 August 2026_

> **Disclaimer.** This policy may be updated from time to time. The current
> version is the one published in this document.

This policy describes how PadelleBoxd handles personal data. Unlike a purely
local application, PadelleBoxd has a **server-side component**: some data is
stored in a database hosted by a third party. This document describes exactly
what is stored, where, and why.

## 1. What PadelleBoxd is

PadelleBoxd is a personal TV-series tracker. You can register an account, keep a
list of the series you watch, mark seasons and episodes as watched, rate the
series you finished, and see what airs next. It is a private, non-commercial
project.

## 2. Data processed and where it is stored

### 2.1 Account data

When you register, PadelleBoxd stores:

- **username** (3–24 characters, alphanumeric plus `_` and `-`): the only
  identifier you choose;
- **password hash**: your password is not stored in plain text. It is hashed
  (SHA-256 for new accounts; legacy bcrypt hashes are accepted and migrated on
  login);
- **role**: `PENDING`, `APPROVED`, `REJECTED` or `ADMIN`. New accounts must be
  approved by an administrator before they can log in;
- **registration date**.

No email address, no real name, no phone number and no payment data are
collected.

### 2.2 Watch data

PadelleBoxd stores the data you create while using it:

- the series in your list, with their **status** (`WATCHED`, `WATCHING`,
  `ABANDONED`, `ON_HOLD`, `PLANNED`);
- the optional **rating** you give to a series (1–10, only for watched or
  abandoned series);
- which **seasons and episodes** you marked as watched, with timestamps.

This data is stored in a PostgreSQL database hosted by **Supabase**.

### 2.3 Content data

Series details (name, overview, poster, rating, air dates) come from the
**TMDB API** and are cached briefly in the database (with a short time-to-live,
purged regularly) to serve pages efficiently. No user data is sent to TMDB.

## 3. Where the data lives

- **Database**: Supabase (PostgreSQL). This is where accounts and watch data
  are stored.
- **Your browser**: a single cookie, `pb_session`, containing a signed session
  token (JWT) used to keep you logged in. It is `httpOnly`, `sameSite=lax`,
  `secure` in production, and expires after 30 days. No other local storage is
  used by the web app.
- **Your device (Android app)**: the mobile app is a wrapper around the web
  application and stores only the same session data in its WebView. It requests
  only the INTERNET permission.

## 4. Network access and third parties

PadelleBoxd makes the following outbound connections:

- **TMDB API** (`api.themoviedb.org`): server-side requests for searching and
  showing series details. The TMDB API key is never exposed to your browser.
- **TMDB images** (`image.tmdb.org`): posters, backdrops and episode stills,
  loaded directly by your browser when you view pages.
- **Supabase**: your browser/application talks to the PadelleBoxd server, which
  reads and writes the database.
- **Vercel**: hosts the application; as with any hosting provider, Vercel's
  servers observe routine connection data (such as your IP address) under
  Vercel's own privacy practices.
- **Google Fonts**: font files for the interface.

PadelleBoxd uses **no analytics, no advertising, no tracking and no telemetry**
of any kind. No data is shared with third parties other than the infrastructure
and metadata providers listed above, which are used in good faith under their
own terms and policies.

## 5. Visibility of your data

Profiles and series pages are **public**: any visitor can see your username,
your list, and your ratings on a series. There is no per-profile privacy
setting. Choose your username accordingly; only the data you create (statuses,
ratings, watch progress) is shown — there is no free-text content.

## 6. Security

- Passwords are stored **hashed**, never in plain text.
- Sessions use signed JWTs delivered via a secure `httpOnly` cookie (or a
  Bearer token for native clients).
- The admin panel is hidden and can be additionally restricted by IP address.
- Server-side, the IP address of admin requests is read only to check an
  optional allowlist; it is **not stored**.

Please note the technical reality documented here in good faith: new passwords
are hashed with single-pass, unsalted SHA-256. This is a fast hash rather than a
purpose-built password-hashing algorithm, and you should therefore use a
strong, unique password.

## 7. Your rights and data portability

- **Export**: you can export your own list as a **CSV file** at any time
  (`/api/me/export`).
- **Access and correction**: you can view and change your watch data directly
  in the application.
- **Deletion**: at the time of writing, PadelleBoxd does not provide an
  in-app account-deletion or password-change endpoint. To request deletion of
  your account, contact the operator directly.

## 8. Children's privacy

PadelleBoxd is a catalog and tracking service. It does not intentionally
collect personal data from children, and it does not require any data beyond a
username and password.

## 9. Good faith

PadelleBoxd is operated in good faith:

- it collects the **minimum data** needed for its function (no email, no
  payment data, no tracking);
- it uses the **TMDB API** solely for catalog metadata, with visible attribution
  and in compliance with TMDB's terms and logo guidelines;
- it is **not affiliated with or certified by TMDB**, and it states so;
- it has **no feature for accessing or redistributing unauthorized content**.

For the full legal assessment of the project, see **[LEGAL.md](LEGAL.md)**.