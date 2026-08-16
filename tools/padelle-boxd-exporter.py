#!/usr/bin/env python3
"""Export a PadelleBoxd user's list as CSV (personal use)."""
import csv
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

BASE_URL = "https://padelle-boxd.vercel.app"

HEADER = [
    "tmdb_id",
    "title",
    "status",
    "rating",
    "first_air_date",
    "watched_seasons",
    "watched_episodes",
    "updated_at",
]

STATUSES = ["WATCHED", "WATCHING", "ABANDONED", "ON_HOLD", "PLANNED"]

GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
RESET = "\033[0m"


def color(text: str, code: str) -> str:
    return f"{code}{text}{RESET}"


def fetch_user_list(username: str) -> dict:
    url = f"{BASE_URL}/api/users/{username}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 404:
            sys.exit(color(f"User '{username}' not found (404).", RED))
        sys.exit(color(f"HTTP error {e.code}: {e.read().decode(errors='replace')}", RED))
    except urllib.error.URLError as e:
        sys.exit(color(f"Network error: {e.reason}", RED))


def write_csv(data: dict, path: Path) -> None:
    with path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(HEADER)
        for e in data.get("entries", []):
            s = e["series"]
            writer.writerow([
                s["tmdbId"],
                s["name"],
                e["status"],
                e["rating"] if e["rating"] is not None else "",
                s["firstAirDate"] or "",
                ";".join(map(str, e.get("watchedSeasons", []))),
                ";".join(e.get("watchedEpisodes", [])),
                e["updatedAt"],
            ])


def main() -> None:
    username = input(color("Username to export: ", CYAN)).strip()
    if not username:
        sys.exit(color("No username provided.", RED))

    data = fetch_user_list(username)

    out_path = Path(f"{username}-list.csv")
    write_csv(data, out_path)

    counts = data.get("counts", {})
    total = sum(counts.values())

    print(f"\n{color(BOLD + 'List exported', GREEN)}: {out_path}")
    print(f"{color(BOLD + 'Total series', GREEN)}: {total}")
    for status in STATUSES:
        print(f"  {color(status, MAGENTA)}: {counts.get(status, 0)}")


if __name__ == "__main__":
    main()