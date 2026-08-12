"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STATUSES, STATUS_LABEL, STATUS_COLOR, type SeriesStatus } from "@/lib/constants";

type Entry = {
  tmdbId: number;
  name: string;
  posterUrl: string | null;
  status: SeriesStatus;
  rating: number | null;
};

const RATING_OPTIONS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export default function MyListManager({ initialEntries }: { initialEntries: Entry[] }) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(tmdbId: number, body: Record<string, unknown>) {
    setBusyId(tmdbId);
    setError(null);
    return fetch(`/api/me/series/${tmdbId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setBusyId(null));
  }

  async function setStatus(tmdbId: number, status: SeriesStatus) {
    const target = entries.find((e) => e.tmdbId === tmdbId);
    const rating = status === "PLANNED" ? null : target?.rating ?? null;
    await patch(tmdbId, { status, rating });
    router.refresh();
  }

  async function setRating(tmdbId: number, rating: number) {
    await patch(tmdbId, { rating });
    router.refresh();
  }

  async function remove(tmdbId: number) {
    setBusyId(tmdbId);
    setError(null);
    try {
      const res = await fetch(`/api/me/series/${tmdbId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }
      setEntries((prev) => prev.filter((e) => e.tmdbId !== tmdbId));
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 px-4 py-16 text-center">
          <p className="text-zinc-400">Your list is empty.</p>
          <Link
            href="/search"
            className="mt-3 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Find a TV series to track
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {entries.map((e) => {
            const canRate = e.status === "WATCHED" || e.status === "ABANDONED";
            return (
              <li
                key={e.tmdbId}
                className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-2"
              >
                <Link href={`/series/${e.tmdbId}`} className="group">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-800">
                    {e.posterUrl ? (
                      <Image
                        src={e.posterUrl}
                        alt={e.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 256px"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-3 text-center text-xs text-zinc-500">
                        {e.name}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-1 px-0.5 text-sm font-semibold text-zinc-100">
                    {e.name}
                  </p>
                </Link>

                <div className="mt-auto space-y-2 pt-3">
                  <select
                    value={e.status}
                    onChange={(ev) => setStatus(e.tmdbId, ev.target.value as SeriesStatus)}
                    disabled={busyId === e.tmdbId}
                    className={`field-select w-full ${STATUS_COLOR[e.status]} border`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-zinc-900 text-zinc-100">
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>

                  {canRate && (
                    <div className="flex items-center justify-center gap-0.5">
                      {RATING_OPTIONS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRating(e.tmdbId, r)}
                          disabled={busyId === e.tmdbId}
                          aria-label={`Rate ${r}/10`}
                          className={`h-6 w-6 rounded-md text-xs font-semibold transition ${
                            e.rating === r
                              ? "bg-emerald-600 text-white"
                              : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => remove(e.tmdbId)}
                    disabled={busyId === e.tmdbId}
                    className="w-full rounded-lg border border-zinc-800 px-2 py-1 text-xs text-zinc-500 transition hover:border-red-500/40 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}