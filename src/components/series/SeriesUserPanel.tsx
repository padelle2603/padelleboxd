"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AddToMyList from "@/components/list/AddToMyList";
import type { SeriesStatus } from "@/lib/constants";

type Me = { id: string; username: string; role: string } | null;

type MyEntry = { status: string; rating: number | null } | null;

export default function SeriesUserPanel({ tmdbId }: { tmdbId: number }) {
  const [user, setUser] = useState<Me>(null);
  const [myEntry, setMyEntry] = useState<MyEntry>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, seriesRes] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch(`/api/series/${tmdbId}`, { cache: "no-store" }),
        ]);
        const [me, series] = await Promise.all([meRes.json(), seriesRes.json()]);
        if (cancelled) return;
        setUser(me.user ?? null);
        setMyEntry(series.myEntry ?? null);
      } catch {
        // leave logged-out state
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tmdbId]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
      {!loaded ? (
        <div className="h-9 animate-pulse rounded-lg bg-zinc-800/70" />
      ) : user && (user.role === "APPROVED" || user.role === "ADMIN") ? (
        <AddToMyList
          tmdbId={tmdbId}
          initialStatus={(myEntry?.status as SeriesStatus) ?? null}
          initialRating={myEntry?.rating ?? null}
        />
      ) : user && user.role === "PENDING" ? (
        <p className="text-sm text-zinc-400">
          Your account is still awaiting administrator approval. Once approved, you can add
          this series to your list.
        </p>
      ) : (
        <p className="text-sm text-zinc-400">
          <Link href="/login" className="font-medium text-blue-400 hover:underline">
            Log in
          </Link>{" "}
          to add this series to your list.
        </p>
      )}
    </div>
  );
}