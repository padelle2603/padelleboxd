# PRIVACY — What the scripts do with your data

## Data handled

- A PadelleBoxd user's watchlist (series, statuses, ratings, watched
  seasons/episodes, update dates).
- Series and episode details (title, number, release date).

## Data flow

```
script ──HTTPS request──> padelle-boxd.vercel.app (public APIs)
padelle-boxd.vercel.app ──data──> script ──local──> CSV / .ics
```

- The only network connection is to `padelle-boxd.vercel.app`, the service
  the data belongs to.
- The scripts do not send data to third-party servers.
- There is no telemetry, analytics, usage statistics or "phone home"
  functionality.
- No cookies, passwords or tokens are read from the browser.

## What stays on your disk

- The CSV file (`<username>-list.csv`) in the current folder.
- The `watchlist_schedule.ics` file in the script's folder.
- They are **your** data, removed only by you. The code does not store or
  log credentials.

## Recommendations

- Do not share the CSV/ICS files: they contain personal information.
- Run the scripts only for accounts you own or are authorized to access.