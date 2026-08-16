# COMPLIANCE — Responsible use

This document describes how the tools use the PadelleBoxd service.
**It is not legal advice.**

## Service involved

The scripts interact exclusively with **PadelleBoxd**
(`https://padelle-boxd.vercel.app`), a service owned by the author. They do
not access third-party services (Letterboxd, TMDB, etc.).

## Principles

1. **Personal use.** The scripts fetch a user's watchlist through the
   service's official API. They do not access data from other services.

2. **Official interface.** All requests use the public APIs exposed by
   PadelleBoxd. There is no bypassing, browser impersonation, TLS
   fingerprinting or circumvention of security measures.

3. **Rate limits.** One request per entity: one for the user's list, one for
   the series seasons, one for the season's episodes. There are no infinite
   loops, aggressive retries or mass scraping.

4. **No redistribution.** The downloaded data (CSV, `.ics`) stays local and
   is not republished, resold or shared.

## What it does not do

- It does not interact with third-party services.
- It does not evade rate limits or access controls.
- It does not use undocumented APIs for disallowed activities.
- It does not reverse-engineer the service.

## Recommendations

- Run the scripts only for accounts you own or are authorized to access.
- Keep a moderate frequency (the intended use is occasional).
- Review the PadelleBoxd usage guidelines, which may change over time.