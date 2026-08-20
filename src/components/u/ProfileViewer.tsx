"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PosterCard, { type PosterCardSeries } from "@/components/series/PosterCard";
import MyListManager from "@/components/list/MyListManager";
import { STATUSES, STATUS_LABEL, type SeriesStatus } from "@/lib/constants";

type Me = { id: string; username: string; role: string } | null;

function isActive(user: Me): boolean {
  return user?.role === "APPROVED" || user?.role === "ADMIN";
}

export default function ProfileViewer({
  username,
  cards,
}: {
  username: string;
  cards: PosterCardSeries[];
}) {
  const searchParams = useSearchParams();
  const activeStatus = (searchParams.get("status") ?? "") as SeriesStatus | "";
  const [me, setMe] = useState<Me>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json()) as { user: Me };
        if (!cancelled) setMe(data.user ?? null);
      } catch {
        // treat as logged out
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isOwn = loaded && isActive(me) && me?.username === username;

  if (isOwn && me) {
    const entries = cards.map((e) => ({
      tmdbId: e.tmdbId,
      name: e.name,
      posterUrl: e.posterUrl,
      status: e.status ?? "PLANNED",
      rating: e.rating ?? null,
    }));
    const count = (s: SeriesStatus) => cards.filter((e) => e.status === s).length;

    return (
      <div className="space-y-8">
        <section className="flex flex-wrap items-center gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-2xl font-black">
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">My list</h1>
            <p className="text-sm text-zinc-500">
              {cards.length} series ·{" "}
              {STATUSES.map((s) => (
                <span key={s} className="mr-3">
                  <span className="capitalize">{STATUS_LABEL[s].toLowerCase()}</span>:{" "}
                  <b className="text-zinc-300">{count(s)}</b>
                </span>
              ))}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap gap-3">
            <a href="/api/me/export" className="btn-ghost">
              Export CSV
            </a>
            <Link href="/search" className="btn-primary">
              + Add series
            </Link>
          </div>
        </section>

        <MyListManager initialEntries={entries} />
      </div>
    );
  }

  const filtered =
    activeStatus && STATUSES.includes(activeStatus)
      ? cards.filter((e) => e.status === activeStatus)
      : cards;

  const count = (s: SeriesStatus) => cards.filter((e) => e.status === s).length;

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-2xl font-black">
          {username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">{username}</h1>
          <p className="text-sm text-zinc-500">
            {cards.length} series in their list
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-3 text-center text-sm">
          {STATUSES.map((s) => (
            <div key={s} className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-2">
              <div className="text-lg font-bold text-zinc-100">{count(s)}</div>
              <div className="text-[11px] uppercase tracking-wide text-zinc-500">{STATUS_LABEL[s]}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-1 text-sm">
        <Tab href={`/u/${username}`} active={activeStatus === ""}>
          All
        </Tab>
        {STATUSES.map((s) => (
          <Tab key={s} href={`/u/${username}?status=${s}`} active={activeStatus === s}>
            {STATUS_LABEL[s]}
          </Tab>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((s) => (
            <PosterCard key={s.tmdbId} series={s} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-10 text-center text-sm text-zinc-500">
          {activeStatus
            ? `No ${STATUS_LABEL[activeStatus].toLowerCase()} series here.`
            : "This list is empty. Add some series!"}
        </p>
      )}
    </div>
  );
}

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 font-medium transition ${
        active
          ? "bg-blue-600 text-white"
          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
      }`}
    >
      {children}
    </Link>
  );
}