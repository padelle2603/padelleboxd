# PadelleBoxd

Command-line tools for the PadelleBoxd service
(`https://padelle-boxd.vercel.app`): export a user's watchlist to CSV and
generate a calendar (`.ics`) with the upcoming episode releases of the series
in progress.

## Scripts

| Script | What it does |
| ------ | ------------ |
| `padelle-boxd-exporter.py` | Fetches a user's list from the PadelleBoxd API and exports it to CSV |
| `padelle-boxd-schedule.py` | Generates `watchlist_schedule.ics` with future episodes of the series in the watchlist |

## Requirements

- Python 3
- `requests` and `icalendar` (installed automatically by `install.sh`)
- Network access to `padelle-boxd.vercel.app`

## Installation

```bash
./install.sh
```

Creates a dedicated venv in `~/.local/share/padelleboxd/`, installs the
dependencies (`requests`, `icalendar`) and installs the
`padelle-boxd-export` and `padelle-boxd-schedule` commands in
`~/.local/bin/`.

Uninstallation:

```bash
./uninstall.sh
```

## Usage

Export a list:

```bash
padelle-boxd-export
```

The command asks for the username to export and writes `<username>-list.csv`
in the current folder, showing the totals per status
(WATCHED, WATCHING, ABANDONED, ON_HOLD, PLANNED).

Calendar:

```bash
padelle-boxd-schedule
```

Asks for the username (default `padelle`) and generates
`watchlist_schedule.ics` in the script's folder, with one event per future
episode.

## Direct execution

```bash
python3 padelle-boxd-exporter.py
python3 padelle-boxd-schedule.py
```

## Privacy and legal notes

- The scripts interact **only** with the PadelleBoxd API
  (`https://padelle-boxd.vercel.app/api/...`), your own service.
- The downloaded data stays local (CSV, `.ics`); there is no telemetry.
- See [PRIVACY.md](PRIVACY.md), [LEGAL.md](LEGAL.md) and
  [COMPLIANCE.md](COMPLIANCE.md) for details.