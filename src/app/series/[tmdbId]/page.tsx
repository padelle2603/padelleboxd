import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, isActiveUser } from "@/lib/auth";
import {
  getTvDetails,
  getUpcomingEpisodes,
  posterUrl,
  backdropUrl,
  daysUntil,
  stillUrl,
} from "@/lib/tmdb";
import AddToMyList from "@/components/list/AddToMyList";
import SeasonManager from "@/components/series/SeasonManager";
import StatusBadge from "@/components/series/StatusBadge";
import { STATUS_TEXT_COLOR, formatAirDate } from "@/lib/constants";
import type { SeriesStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = PageProps<"/series/[tmdbId]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tmdbId } = await params;
  const tv = await getTvDetails(Number(tmdbId));
  return { title: tv?.name ?? "Series" };
}

export default async function SeriesPage({ params }: Props) {
  const { tmdbId } = await params;
  const id = Number(tmdbId);
  if (!Number.isInteger(id)) notFound();

  const [tv, user] = await Promise.all([getTvDetails(id), getCurrentUser()]);
  if (!tv) notFound();

  const [tracked, counts, watchedSeasons] = await Promise.all([
    prisma.userSeries.findMany({
      where: { seriesId: id },
      include: {
        user: { select: { username: true, role: true } },
        series: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.userSeries.groupBy({
      by: ["status"],
      where: { seriesId: id },
      _count: { _all: true },
    }),
    user
      ? prisma.seasonWatch.findMany({
          where: { userId: user.id, seriesId: id },
          select: { seasonNumber: true },
        })
      : Promise.resolve([]),
  ]);

  const watchedSeasonNumbers = watchedSeasons.map((w) => w.seasonNumber);
  const upcomingEpisodes = await getUpcomingEpisodes(tv, 7);
  const nextToAir = tv.next_episode_to_air ?? null;

  const countMap = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all])
  ) as Partial<Record<SeriesStatus, number>>;

  const myEntry = user ? tracked.find((t) => t.userId === user.id) : null;

  const backdrop = backdropUrl(tv.backdrop_path);
  const poster = posterUrl(tv.poster_path, "w342");

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800">
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            fill
            sizes="100vw"
            className="absolute inset-0 object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/40" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:p-8">
          <div className="relative h-64 w-44 shrink-0 overflow-hidden rounded-xl border border-zinc-700/60 shadow-2xl sm:h-80 sm:w-56">
            {poster ? (
              <Image src={poster} alt={tv.name} fill sizes="224px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-zinc-800 p-4 text-center text-sm text-zinc-500">
                {tv.name}
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col justify-between gap-6">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                {tv.first_air_date && <span>First aired {tv.first_air_date}</span>}
                {tv.status && <span>· {tv.status}</span>}
                {tv.number_of_seasons != null && (
                  <span>· {tv.number_of_seasons} season{tv.number_of_seasons === 1 ? "" : "s"}</span>
                )}
                {tv.number_of_episodes != null && (
                  <span>· {tv.number_of_episodes} episodes</span>
                )}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{tv.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1 font-semibold text-amber-400">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.286 3.958c.3.922-.755 1.688-1.538 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.782.57-1.838-.196-1.538-1.118l1.286-3.958a1 1 0 00-.363-1.118L2.062 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.287-3.958z" />
                  </svg>
                  {tv.vote_average.toFixed(1)}
                </span>
                <span className="text-zinc-500">{tv.vote_count.toLocaleString()} ratings</span>
                {tv.genres && tv.genres.length > 0 && (
                  <span className="text-zinc-500">
                    · {tv.genres.map((g) => g.name).join(", ")}
                  </span>
                )}
              </div>
              {tv.overview && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300">{tv.overview}</p>}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              {user && isActiveUser(user) ? (
                <AddToMyList
                  tmdbId={id}
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
          </div>
        </div>
      </div>

      {(nextToAir || upcomingEpisodes.length > 0) && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-zinc-100">Upcoming episodes</h2>
          <p className="mb-4 text-xs text-zinc-500">
            Chronological list of the next episodes to air, updated from TMDB.
          </p>
          {nextToAir && nextToAir.air_date && (
            <div className="mb-4 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
                Next episode
              </p>
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-lg font-bold text-zinc-100">
                  {nextToAir.name}
                  <span className="ml-2 text-sm font-normal text-zinc-400">
                    S{nextToAir.season_number}E{nextToAir.episode_number}
                  </span>
                </p>
                <p className="text-sm font-medium text-sky-300">
                  {formatAirDate(nextToAir.air_date)}
                  {(() => {
                    const d = daysUntil(nextToAir.air_date);
                    if (d === null) return null;
                    if (d === 0) return " · today";
                    if (d === 1) return " · tomorrow";
                    return d > 0 ? ` · in ${d} days` : null;
                  })()}
                </p>
              </div>
            </div>
          )}
          {upcomingEpisodes.length > 0 && (
            <ul className="divide-y divide-zinc-800/80 rounded-2xl border border-zinc-800 bg-zinc-900/40">
              {upcomingEpisodes.map((ep) => {
                const isNext =
                  nextToAir && ep.id === nextToAir.id && (ep.season_number === nextToAir.season_number);
                const d = ep.air_date ? daysUntil(ep.air_date) : null;
                return (
                  <li
                    key={ep.id}
                    className="flex items-center gap-4 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`line-clamp-1 text-sm ${
                          isNext ? "font-semibold text-sky-300" : "font-medium text-zinc-200"
                        }`}
                      >
                        {isNext ? "★ " : ""}
                        {ep.name || "Episode"}
                        <span className="ml-2 text-xs font-normal text-zinc-500">
                          S{ep.season_number}E{ep.episode_number}
                        </span>
                      </p>
                      {ep.still_path && (
                        <div className="relative mt-2 h-16 w-28 overflow-hidden rounded-md bg-zinc-800">
                          <Image
                            src={stillUrl(ep.still_path)!}
                            alt={ep.name || "episode still"}
                            fill
                            sizes="112px"
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <p className="shrink-0 text-right text-xs text-zinc-400">
                      {formatAirDate(ep.air_date)}
                      {d !== null && d >= 0 && (
                        <span className="block font-medium text-zinc-500">
                          {d === 0 ? "today" : d === 1 ? "in 1 day" : `in ${d} days`}
                        </span>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tv.seasons && tv.seasons.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-zinc-100">Seasons</h2>
          <p className="mb-4 text-xs text-zinc-500">
            Mark a season as watched once you finish it.
          </p>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <SeasonManager
              tmdbId={id}
              seasons={tv.seasons}
              watchedSeasons={watchedSeasonNumbers}
              canEdit={!!user && isActiveUser(user)}
            />
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold text-zinc-100">Who&apos;s watching this</h2>
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          {(["WATCHED", "ABANDONED", "ON_HOLD", "PLANNED"] as SeriesStatus[]).map((s) => (
            <span key={s} className={`rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 font-medium ${STATUS_TEXT_COLOR[s]}`}>
              {s.replaceAll("_", " ")} · {countMap[s] ?? 0}
            </span>
          ))}
        </div>
        {tracked.length > 0 ? (
          <ul className="divide-y divide-zinc-800/80 rounded-2xl border border-zinc-800 bg-zinc-900/40">
            {tracked.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <Link
                  href={`/u/${t.user.username}`}
                  className="font-medium text-zinc-200 transition hover:text-blue-400"
                >
                  {t.user.username}
                </Link>
                <div className="flex items-center gap-3">
                  {t.rating != null && (
                    <span className="rounded-md bg-emerald-600/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
                      {t.rating}/10
                    </span>
                  )}
                  <StatusBadge status={t.status as SeriesStatus} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
            Nobody is tracking this series yet. Be the first!
          </p>
        )}
      </section>
    </div>
  );
}