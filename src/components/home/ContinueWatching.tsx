"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatAirDate } from "@/lib/constants";
import { useDbMutation } from "@/lib/useDbMutation";

type ContinueWatchingEntry = {
  tmdbId: number;
  name: string;
  posterUrl: string | null;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  airDate: string | null;
  seasonEpisodeCount: number;
  seasonProgress: number;
};

export default function ContinueWatching({
  initial,
  username,
}: {
  initial: ContinueWatchingEntry[];
  username: string;
}) {
  const { refresh } = useDbMutation();
  const [entries, setEntries] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function markWatched(item: ContinueWatchingEntry) {
    if (busy !== null) return;
    const key = `${item.tmdbId}:${item.seasonNumber}:${item.episodeNumber}`;
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(
        `/api/me/series/${item.tmdbId}/seasons/${item.seasonNumber}/episodes/${item.episodeNumber}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watched: true, seasonEpisodeCount: item.seasonEpisodeCount }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not mark the episode as watched");
      }
      // Optimistically drop the entry, then let the server re-render in sync.
      setEntries((prev) => prev.filter((e) => key !== `${e.tmdbId}:${e.seasonNumber}:${e.episodeNumber}`));
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-xl font-bold text-zinc-100">Continue watching</h2>
        <Link href={`/u/${username}`} className="text-sm font-medium text-blue-400 hover:underline">
          My list →
        </Link>
      </div>
      {error && (
        <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      <ul className="divide-y divide-zinc-800/80 rounded-2xl border border-zinc-800 bg-zinc-900/40">
        {entries.map((item) => {
          const key = `${item.tmdbId}:${item.seasonNumber}:${item.episodeNumber}`;
          const isBusy = busy === key;
          return (
            <li key={key} className="flex items-center gap-4 px-4 py-3">
              <Link
                href={`/series/${item.tmdbId}`}
                className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900"
              >
                {item.posterUrl ? (
                  <Image
                    src={item.posterUrl}
                    alt={item.name}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-1 text-center text-[10px] leading-tight text-zinc-500">
                    {item.name}
                  </div>
                )}
              </Link>

              <Link href={`/series/${item.tmdbId}`} className="group min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold text-zinc-100 group-hover:text-blue-300">
                  {item.name}
                </p>
                <p className="line-clamp-1 text-xs text-zinc-400">
                  <b className="font-semibold text-zinc-300">
                    S{item.seasonNumber}E{item.episodeNumber}
                  </b>{" "}
                  · {item.episodeName || "Episode"}
                </p>
                <p className="text-xs text-zinc-600">
                  {item.seasonProgress}/{item.seasonEpisodeCount} in season {item.seasonNumber}
                  {item.airDate ? ` · airs ${formatAirDate(item.airDate)}` : ""}
                </p>
              </Link>

              <button
                type="button"
                onClick={() => markWatched(item)}
                disabled={busy !== null}
                aria-label={`Mark S${item.seasonNumber}E${item.episodeNumber} of ${item.name} as watched`}
                title="Mark as watched"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                  isBusy
                    ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-400"
                    : "border-zinc-600 text-transparent hover:border-emerald-500/60 hover:text-emerald-400"
                }`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}