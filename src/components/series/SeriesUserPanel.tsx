"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AddToMyList from "@/components/list/AddToMyList";
import { useDbMutation } from "@/lib/useDbMutation";
import { isActiveRole, useCurrentUser } from "@/lib/client-auth";
import type { SeriesStatus } from "@/lib/constants";

type MyEntry = { status: string; rating: number | null } | null;

export default function SeriesUserPanel({ tmdbId }: { tmdbId: number }) {
  const { user, loaded, refresh: refreshUser } = useCurrentUser();
  const [myEntry, setMyEntry] = useState<MyEntry>(null);

  const fetchEntry = useCallback(async () => {
    try {
      const res = await fetch(`/api/series/${tmdbId}`, { cache: "no-store" });
      const data = (await res.json()) as { myEntry: MyEntry };
      setMyEntry(data.myEntry ?? null);
    } catch {
      setMyEntry(null);
    }
  }, [tmdbId]);

  useEffect(() => {
    void (async () => {
      await fetchEntry();
    })();
  }, [fetchEntry]);

  const { refresh } = useDbMutation({
    refetch: () => {
      void refreshUser();
      void fetchEntry();
    },
  });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
      {!loaded ? (
        <div className="h-9 animate-pulse rounded-lg bg-zinc-800/70" />
      ) : user && isActiveRole(user.role) ? (
        <AddToMyList
          tmdbId={tmdbId}
          initialStatus={(myEntry?.status as SeriesStatus) ?? null}
          initialRating={myEntry?.rating ?? null}
          onChanged={refresh}
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
