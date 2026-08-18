#!/usr/bin/env python3
"""Export a PadelleBoxd user's list as CSV (personal use)."""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

from scraper_common import color, log_error, log_success, tool_dir, write_csv

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


def fetch_user_list(username: str) -> dict:
    url = f"{BASE_URL}/api/users/{username}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 404:
            sys.exit(color(f"User '{username}' not found (404).", "red"))
        sys.exit(color(f"HTTP error {e.code}: {e.read().decode(errors='replace')}", "red"))
    except urllib.error.URLError as e:
        sys.exit(color(f"Network error: {e.reason}", "red"))


def build_rows(data: dict) -> list:
    rows = []
    for e in data.get("entries", []):
        s = e["series"]
        rows.append([
            s["tmdbId"],
            s["name"],
            e["status"],
            e["rating"] if e["rating"] is not None else "",
            s["firstAirDate"] or "",
            ";".join(map(str, e.get("watchedSeasons", []))),
            ";".join(e.get("watchedEpisodes", [])),
            e["updatedAt"],
        ])
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="padelle-boxd-export",
        description="Export a PadelleBoxd user's list to CSV.",
    )
    parser.add_argument(
        "--username", default=None, help="PadelleBoxd username (default: prompted)"
    )
    parser.add_argument(
        "--output-dir",
        default=None,
        help="Output folder (default: ~/Scraper-export/Padelleboxd)",
    )
    args = parser.parse_args()

    username = args.username
    if not username:
        username = input(color("Username to export: ", "cyan")).strip()
    if not username:
        sys.exit(color("No username provided.", "red"))

    data = fetch_user_list(username)

    out_dir = tool_dir("Padelleboxd", args.output_dir)
    out_path = Path(out_dir) / f"{username}-list.csv"
    write_csv(out_path, HEADER, build_rows(data))

    counts = data.get("counts", {})
    total = sum(counts.values())

    print(f"\n{color('List exported', 'green')}: {out_path}")
    print(f"{color('Total series', 'green')}: {total}")
    for status in STATUSES:
        print(f"  {color(status, 'magenta')}: {counts.get(status, 0)}")


if __name__ == "__main__":
    main()