import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, isActiveUser } from "@/lib/auth";
import { posterUrl } from "@/lib/tmdb";
import MyListManager from "@/components/MyListManager";
import { STATUSES, STATUS_LABEL, type SeriesStatus } from "@/lib/constants";
import Link from "next/link";

export const metadata: Metadata = { title: "My list" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isActiveUser(user)) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-bold">Account not active</h1>
        <p className="mt-2 text-zinc-400">
          Your account is still waiting for an administrator to approve it. Check back later.
        </p>
      </div>
    );
  }

  const entries = await prisma.userSeries.findMany({
    where: { userId: user.id },
    include: { series: true },
    orderBy: { updatedAt: "desc" },
  });

  const cards = entries.map((e) => ({
    tmdbId: e.series.tmdbId,
    name: e.series.name,
    posterUrl: posterUrl(e.series.posterPath),
    status: e.status as SeriesStatus,
    rating: e.rating,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">My list</h1>
          <p className="text-sm text-zinc-500">
            {entries.length} series ·{" "}
            {STATUSES.map((s) => (
              <span key={s} className="mr-3">
                <span className="capitalize">{STATUS_LABEL[s].toLowerCase()}</span>:{" "}
                <b className="text-zinc-300">
                  {entries.filter((e) => e.status === s).length}
                </b>
              </span>
            ))}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/api/me/export" className="btn-ghost">
            Export CSV
          </a>
          <Link href="/search" className="btn-primary">
            + Add series
          </Link>
        </div>
      </div>

      <MyListManager initialEntries={cards} />
    </div>
  );
}