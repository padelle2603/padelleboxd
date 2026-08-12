"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TmdbSeason } from "@/lib/tmdb";

type SeasonManagerProps = {
  tmdbId: number;
  seasons: TmdbSeason[];
  watchedSeasons: number[];
  canEdit: boolean;
};

export default function SeasonManager({
  tmdbId,
  seasons,
  watchedSeasons,
  canEdit,
}: SeasonManagerProps) {
  const router = useRouter();
  const [watched, setWatched] = useState<Set<number>>(new Set(watchedSeasons));
  const [busy, setBusy] = useState<number | null>(null);

  async function toggle(seasonNumber: number, next: boolean) {
    if (busy !== null) return;
    setBusy(seasonNumber);
    setWatched((prev) => {
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
        setWatched((prev) => {
          const copy = new Set(prev);
          if (next) copy.delete(seasonNumber);
          else copy.add(seasonNumber);
          return copy;
        });
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (seasons.length === 0) return null;

  return (
    <ul className="divide-y divide-zinc-800/80">
      {seasons.map((s) => {
        const isWatched = watched.has(s.season_number);
        const year = s.air_date?.split("-")[0] ?? null;
        return (
          <li key={s.season_number} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-100">
                {s.season_number === 0 ? "Specials" : `Season ${s.season_number}`}
              </p>
              <p className="text-xs text-zinc-500">
                {s.episode_count} episode{s.episode_count === 1 ? "" : "s"}
                {year ? ` · ${year}` : ""}
              </p>
            </div>
            {canEdit ? (
              <button
                type="button"
                onClick={() => toggle(s.season_number, !isWatched)}
                disabled={busy !== null}
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
          </li>
        );
      })}
    </ul>
  );
}