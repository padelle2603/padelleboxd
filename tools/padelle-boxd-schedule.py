import argparse
import os
import sys
import requests
from datetime import datetime, timedelta, date, time
from icalendar import Calendar, Event, Alarm

from scraper_common import log_error, log_info, log_success, tool_dir

BASE_URL = 'https://padelle-boxd.vercel.app'


def fetch_json(url):
    res = requests.get(url, timeout=30)
    res.raise_for_status()
    return res.json()


def get_user_list(username):
    data = fetch_json(f"{BASE_URL}/api/users/{username}")
    return data.get('entries', [])


def get_series_seasons(tmdb_id):
    data = fetch_json(f"{BASE_URL}/api/series/{tmdb_id}")
    return data.get('details', {}).get('seasons', [])


def get_season_episodes(tmdb_id, season_number):
    data = fetch_json(f"{BASE_URL}/api/series/{tmdb_id}/seasons/{season_number}")
    return data.get('episodes', [])


def main():
    parser = argparse.ArgumentParser(
        prog="padelle-boxd-schedule",
        description="Export upcoming episodes from a PadelleBoxd watchlist to an .ics calendar.",
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

    log_info("--- PadelleBoxd Watchlist Calendar Exporter (Future Only) ---")

    username = args.username
    if not username:
        username = input('Username: ').strip() or 'padelle'

    try:
        watchlist = get_user_list(username)
    except requests.RequestException as e:
        log_error(f"Could not fetch list for '{username}': {e}")
        return 1

    if not watchlist:
        log_error(f"No series found for user '{username}'")
        return 1

    log_info(f"Loaded {len(watchlist)} series for '{username}'.")

    cal = Calendar()
    today = date.today()
    log_info(f"Current date (filter >=): {today}")

    count = 0
    for item in watchlist:
        series = item.get('series', {})
        title = series.get('name')
        tmdb_id = series.get('tmdbId')
        status = item.get('status', '')
        if not title or not tmdb_id:
            continue

        log_info(f"[PROCESSING] {title} (Status: {status})")

        try:
            seasons = get_series_seasons(tmdb_id)
        except requests.RequestException as e:
            log_info(f"   -> Error fetching seasons: {e}")
            continue

        if not seasons:
            log_info("   -> No seasons found.")
            continue

        ep_added = 0
        for season in seasons:
            season_num = season.get('seasonNumber')
            if season_num is None:
                continue

            try:
                episodes = get_season_episodes(tmdb_id, season_num)
            except requests.RequestException as e:
                log_info(f"   -> Error fetching season {season_num}: {e}")
                continue

            for ep in episodes:
                airdate_str = ep.get('airDate')
                if not airdate_str:
                    continue

                try:
                    air_date = datetime.strptime(airdate_str, '%Y-%m-%d').date()
                except ValueError:
                    continue

                if air_date >= today:
                    episode_num = ep.get('episodeNumber', 1)
                    ep_title = ep.get('name', 'TBA')

                    event_datetime = datetime.combine(air_date, time(12, 0, 0))

                    event = Event()
                    event.add('summary', f"{title}: S{season_num:02d}E{episode_num:02d} - {ep_title}")
                    event.add('dtstart', event_datetime)
                    event.add('dtend', event_datetime + timedelta(hours=1))
                    event.add('description', f"Air date: {airdate_str} | Status: {status}")

                    alarm = Alarm()
                    alarm.add('action', 'DISPLAY')
                    alarm.add('description', f"New episode available: {title}!")
                    alarm.add('trigger', timedelta(minutes=0))
                    event.add_component(alarm)

                    cal.add_component(event)
                    count += 1
                    ep_added += 1

        log_info(f"   -> Added {ep_added} upcoming episodes to the calendar.")

    out_dir = tool_dir("Padelleboxd", args.output_dir)
    output_ics = os.path.join(out_dir, 'watchlist_schedule.ics')
    with open(output_ics, 'wb') as f:
        f.write(cal.to_ical())

    log_success(f"Generated .ics file with {count} events at: {output_ics}")
    return 0


if __name__ == '__main__':
    sys.exit(main())