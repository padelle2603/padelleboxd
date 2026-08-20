"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TmdbSeason } from "@/lib/tmdb";
import { formatAirDate } from "@/lib/constants";

type WatchedEpisode = { seasonNumber: number; episodeNumber: number };

type SeriesEpisode = {
  id: number;
  name: string;
  overview: string | null;
  seasonNumber: number;
  episodeNumber: number;
  airDate: string | null;
  stillUrl: string | null;
};

type SeasonManagerProps = {
  tmdbId: number;
  seasons: TmdbSeason[];
  watchedSeasons?: number[];
  watchedEpisodes?: WatchedEpisode[];
  canEdit?: boolean;
};

function episodeKey(seasonNumber: number, episodeNumber: number) {
  return `${seasonNumber}:${episodeNumber}`;
}

function countWatchedInSeason(set: Set<string>, seasonNumber: number) {
  let n = 0;
  for (const k of set) if (k.startsWith(`${seasonNumber}:`)) n++;
  return n;
}

export default function SeasonManager({
  tmdbId,
  seasons,
  watchedSeasons,
  watchedEpisodes,
  canEdit,
}: SeasonManagerProps) {
  const router = useRouter();
  const [watchedSeasonSet, setWatchedSeasonSet] = useState<Set<number>>(
    () => new Set(watchedSeasons ?? [])
  );
  const [watchedEpisodeSet, setWatchedEpisodeSet] = useState<Set<string>>(
    () => new Set((watchedEpisodes ?? []).map((w) => episodeKey(w.seasonNumber, w.episodeNumber)))
  );
  const [editable, setEditable] = useState(canEdit ?? false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [episodesBySeason, setEpisodesBySeason] = useState<Record<number, SeriesEpisode[]>>({});
  const [busySeason, setBusySeason] = useState<number | null>(null);
  const [busyEpisode, setBusyEpisode] = useState<string | null>(null);

  useEffect(() => {
    if (watchedSeasons !== undefined) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/series/${tmdbId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          canEdit: boolean;
          myWatchedSeasons: number[];
          myWatchedEpisodes: WatchedEpisode[];
        };
        if (cancelled) return;
        setWatchedSeasonSet(() => new Set(data.myWatchedSeasons));
        setWatchedEpisodeSet(() =>
          new Set(data.myWatchedEpisodes.map((w) => episodeKey(w.seasonNumber, w.episodeNumber)))
        );
        setEditable(data.canEdit);
      } catch {
        // keep logged-out state
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tmdbId, watchedSeasons]);

  async function loadSeason(seasonNumber: number) {
    if (episodesBySeason[seasonNumber] || busySeason !== null) return;
    setBusySeason(seasonNumber);
    try {
      const res = await fetch(`/api/series/${tmdbId}/seasons/${seasonNumber}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { episodes: SeriesEpisode[] };
      setEpisodesBySeason((prev) => ({ ...prev, [seasonNumber]: data.episodes ?? [] }));
    } finally {
      setBusySeason(null);
    }
  }

  function toggleExpand(seasonNumber: number) {
    setExpanded((cur) => {
      const next = cur === seasonNumber ? null : seasonNumber;
      if (next !== null) void loadSeason(next);
      return next;
    });
  }

  async function toggleSeason(seasonNumber: number, next: boolean) {
    if (busySeason !== null) return;
    setBusySeason(seasonNumber);
    setWatchedSeasonSet((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(seasonNumber);
      else copy.delete(seasonNumber);
      return copy;
    });
    try {
      const res = await fetch(`/api/me/series/${tmdbId}/seasons/${seasonNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watched: next }),
      });
      if (!res.ok) {
        setWatchedSeasonSet((prev) => {
          const copy = new Set(prev);
          if (next) copy.delete(seasonNumber);
          else copy.add(seasonNumber);
          return copy;
        });
      }
      router.refresh();
    } finally {
      setBusySeason(null);
    }
  }

  async function toggleEpisode(seasonNumber: number, episodeNumber: number, next: boolean) {
    if (busyEpisode !== null) return;
    const key = episodeKey(seasonNumber, episodeNumber);
    const season = seasons.find((s) => s.season_number === seasonNumber);
    const seasonEpisodeCount = season?.episode_count ?? null;

    setBusyEpisode(key);
    setWatchedEpisodeSet((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(key);
      else copy.delete(key);
      return copy;
    });
    if (seasonEpisodeCount != null) {
      setWatchedSeasonSet((prev) => {
        const copy = new Set(prev);
        if (next && episodeNumber >= seasonEpisodeCount) copy.add(seasonNumber);
        else if (!next) copy.delete(seasonNumber);
        return copy;
      });
    }

    try {
      const res = await fetch(
        `/api/me/series/${tmdbId}/seasons/${seasonNumber}/episodes/${episodeNumber}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watched: next, seasonEpisodeCount }),
        }
      );
      if (!res.ok) {
        setWatchedEpisodeSet((prev) => {
          const copy = new Set(prev);
          if (next) copy.delete(key);
          else copy.add(key);
          return copy;
        });
        if (seasonEpisodeCount != null) {
          setWatchedSeasonSet((prev) => {
            const copy = new Set(prev);
            if (next && episodeNumber >= seasonEpisodeCount) copy.delete(seasonNumber);
            else if (!next) copy.add(seasonNumber);
            return copy;
          });
        }
      }
      router.refresh();
    } finally {
      setBusyEpisode(null);
    }
  }

  if (seasons.length === 0) return null;

  return (
    <ul className="divide-y divide-zinc-800/80">
      {seasons.map((s) => {
        const isWatched = watchedSeasonSet.has(s.season_number);
        const year = s.air_date?.split("-")[0] ?? null;
        const watchedCount = countWatchedInSeason(watchedEpisodeSet, s.season_number);
        const isOpen = expanded === s.season_number;
        const episodes = episodesBySeason[s.season_number];
        const loadingSeason = busySeason === s.season_number;
        return (
          <li key={s.season_number}>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <button
                type="button"
                onClick={() => toggleExpand(s.season_number)}
                className="min-w-0 flex-1 text-left"
                aria-expanded={isOpen}
              >
                <p className="text-sm font-semibold text-zinc-100">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`mr-1 inline h-3.5 w-3.5 text-zinc-500 transition-transform ${isOpen ? "rotate-90" : ""}`}
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {s.season_number === 0 ? "Specials" : `Season ${s.season_number}`}
                </p>
                <p className="text-xs text-zinc-500">
                  {s.episode_count} episode{s.episode_count === 1 ? "" : "s"}
                  {year ? ` · ${year}` : ""}
                  {s.episode_count > 0 ? ` · ${watchedCount}/${s.episode_count} seen` : ""}
                </p>
              </button>
              {editable ? (
                <button
                  type="button"
                  onClick={() => toggleSeason(s.season_number, !isWatched)}
                  disabled={busySeason !== null}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                    isWatched
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  {isWatched ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="block h-4 w-4 rounded border border-zinc-600" aria-hidden="true" />
                  )}
                  {isWatched ? "Watched" : "Mark watched"}
                </button>
              ) : isWatched ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Watched
                </span>
              ) : null}
            </div>

            {isOpen && (
              <div className="border-t border-zinc-800/80 bg-zinc-950/40 px-4 py-3">
                {loadingSeason ? (
                  <p className="text-xs text-zinc-500">Loading episodes…</p>
                ) : episodes && episodes.length > 0 ? (
                  <ul className="divide-y divide-zinc-800/60">
                    {episodes.map((ep) => {
                      const epKey = episodeKey(ep.seasonNumber, ep.episodeNumber);
                      const isEpWatched = watchedEpisodeSet.has(epKey);
                      const isEpBusy = busyEpisode === epKey;
                      return (
                        <li key={ep.id} className="flex items-center gap-3 py-2">
                          <button
                            type="button"
                            onClick={() => editable && toggleEpisode(ep.seasonNumber, ep.episodeNumber, !isEpWatched)}
                            disabled={!editable || busyEpisode !== null}
                            aria-label={
                              isEpWatched
                                ? `Mark E${ep.episodeNumber} as not watched`
                                : `Mark E${ep.episodeNumber} as watched`
                            }
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                              editable ? "cursor-pointer" : "cursor-default"
                            } ${
                              isEpWatched
                                ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-400"
                                : editable
                                  ? "border-zinc-600 text-transparent hover:border-zinc-400"
                                  : "border-zinc-700 text-transparent"
                            } ${isEpBusy ? "opacity-50" : ""}`}
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                              <path
                                fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-sm text-zinc-200">
                              E{ep.episodeNumber}
                              {ep.name ? (
                                <span className="text-zinc-500"> · {ep.name}</span>
                              ) : null}
                            </p>
                            {ep.airDate && (
                              <p className="text-xs text-zinc-600">{formatAirDate(ep.airDate)}</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : episodes && episodes.length === 0 ? (
                  <p className="text-xs text-zinc-500">No episodes available.</p>
                ) : null}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}