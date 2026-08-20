"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatAirDate } from "@/lib/constants";
import ContinueWatching from "@/components/home/ContinueWatching";

type UpcomingCard = {
  tmdbId: number;
  name: string;
  posterUrl: string | null;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  airDate: string;
  daysUntil: number;
};

type Me = { id: string; username: string; role: string } | null;

function isActive(user: Me): user is NonNullable<Me> {
  return user?.role === "APPROVED" || user?.role === "ADMIN";
}

export default function HomePersonal() {
  const [user, setUser] = useState<Me>(null);
  const [upcoming, setUpcoming] = useState<UpcomingCard[]>([]);
  const [continueWatching, setContinueWatching] = useState<
    React.ComponentProps<typeof ContinueWatching>["initial"]
  >([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me", { cache: "no-store" });
        const me = (await meRes.json()) as { user: Me };
        if (cancelled) return;
        setUser(me.user ?? null);
        if (!isActive(me.user)) {
          setLoaded(true);
          return;
        }
        const [cwRes, upRes] = await Promise.all([
          fetch("/api/me/continue-watching"),
          fetch("/api/me/upcoming"),
        ]);
        const [cw, up] = await Promise.all([cwRes.json(), upRes.json()]);
        if (cancelled) return;
        setContinueWatching(cw.entries ?? []);
        setUpcoming(up.entries ?? []);
      } catch {
        // render nothing on failure
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || !user || !isActive(user)) return null;
  const username = user.username;

  return (
    <div className="space-y-12">
      {continueWatching.length > 0 && (
        <ContinueWatching initial={continueWatching} username={username} />
      )}

      {upcoming.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-bold text-zinc-100">Up next</h2>
            <Link
              href={`/u/${username}`}
              className="text-sm font-medium text-blue-400 hover:underline"
            >
              My list →
            </Link>
          </div>
          <p className="mb-4 -mt-2 text-xs text-zinc-500">
            The first unreleased episode for each of your watched and watching series, airing
            within the next 30 days. Entries leave this section once you watch the episode.
          </p>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {upcoming.map((u) => (
              <li key={`${u.tmdbId}:${u.seasonNumber}:${u.episodeNumber}`} className="group">
                <Link href={`/series/${u.tmdbId}`} className="block">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
                    {u.posterUrl ? (
                      <Image
                        src={u.posterUrl}
                        alt={u.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 256px"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-3 text-center text-xs text-zinc-500">
                        {u.name}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2 pt-10">
                      <span className="rounded bg-sky-600/90 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                        {u.daysUntil === 0
                          ? "Airs today"
                          : u.daysUntil === 1
                            ? "Tomorrow"
                            : `S${u.seasonNumber}E${u.episodeNumber} · ${formatAirDate(u.airDate)}`}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 px-0.5">
                    <span className="line-clamp-1 text-sm font-semibold text-zinc-100 group-hover:text-blue-300">
                      {u.name}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">{u.episodeName}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}