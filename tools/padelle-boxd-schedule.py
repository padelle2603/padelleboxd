import json
import os
import requests
from datetime import datetime, timedelta, date, time
from icalendar import Calendar, Event, Alarm

# === CONFIGURATION (Relative Paths) ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_ICS = os.path.join(BASE_DIR, 'watchlist_schedule.ics')
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
    print('[INFO] --- PadelleBoxd Watchlist Calendar Exporter (Future Only) ---')

    username = input('Username: ').strip() or 'padelle'
    try:
        watchlist = get_user_list(username)
    except requests.RequestException as e:
        print(f"[ERROR] Could not fetch list for '{username}': {e}")
        return

    if not watchlist:
        print(f"[ERROR] No series found for user '{username}'")
        return

    print(f"[INFO] Loaded {len(watchlist)} series for '{username}'.")

    cal = Calendar()
    today = date.today()
    print(f"[INFO] Current date (filter >=): {today}")

    count = 0
    for item in watchlist:
        series = item.get('series', {})
        title = series.get('name')
        tmdb_id = series.get('tmdbId')
        status = item.get('status', '')
        if not title or not tmdb_id:
            continue

        print(f"\n[PROCESSING] {title} (Status: {status})")

        try:
            seasons = get_series_seasons(tmdb_id)
        except requests.RequestException as e:
            print(f"   -> Error fetching seasons: {e}")
            continue

        if not seasons:
            print("   -> No seasons found.")
            continue

        ep_added = 0
        for season in seasons:
            season_num = season.get('seasonNumber')
            if season_num is None:
                continue

            try:
                episodes = get_season_episodes(tmdb_id, season_num)
            except requests.RequestException as e:
                print(f"   -> Error fetching season {season_num}: {e}")
                continue

            for ep in episodes:
                airdate_str = ep.get('airDate')
                if not airdate_str:
                    continue

                try:
                    air_date = datetime.strptime(airdate_str, '%Y-%m-%d').date()
                except ValueError:
                    continue

                # FILTER: Keep only future or today's episodes
                if air_date >= today:
                    episode_num = ep.get('episodeNumber', 1)
                    ep_title = ep.get('name', 'TBA')

                    # Schedule event exactly at 12:00 PM on the target date
                    event_datetime = datetime.combine(air_date, time(12, 0, 0))

                    event = Event()
                    event.add('summary', f"{title}: S{season_num:02d}E{episode_num:02d} - {ep_title}")
                    event.add('dtstart', event_datetime)
                    event.add('dtend', event_datetime + timedelta(hours=1))
                    event.add('description', f"Air date: {airdate_str} | Status: {status}")

                    # Built-in alarm/notification triggering right at 12:00 PM
                    alarm = Alarm()
                    alarm.add('action', 'DISPLAY')
                    alarm.add('description', f"New episode available: {title}!")
                    alarm.add('trigger', timedelta(minutes=0))
                    event.add_component(alarm)

                    cal.add_component(event)
                    count += 1
                    ep_added += 1

        print(f"   -> Added {ep_added} upcoming episodes to the calendar.")

    with open(OUTPUT_ICS, 'wb') as f:
        f.write(cal.to_ical())

    print(f"\n[SUCCESS] Generated .ics file with {count} events at: {OUTPUT_ICS}")


if __name__ == '__main__':
    main()