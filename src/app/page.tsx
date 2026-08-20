import Link from "next/link";
import SearchBar from "@/components/layout/SearchBar";
import Logo from "@/components/layout/Logo";
import Image from "next/image";
import { formatAirDate } from "@/lib/constants";
import { getCurrentUser, isActiveUser } from "@/lib/auth";
import { getSiteStats } from "@/lib/stats";
import { getUpcomingForUser } from "@/lib/upcoming";
import { getContinueWatching } from "@/lib/continue-watching";
import ContinueWatching from "@/components/home/ContinueWatching";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, user] = await Promise.all([getSiteStats(), getCurrentUser()]);
  const activeUser = user && isActiveUser(user) ? user : null;
  const [upcoming, continueWatching] = activeUser
    ? await Promise.all([getUpcomingForUser(activeUser), getContinueWatching(activeUser)])
    : [await getUpcomingForUser(activeUser), []];

  return (
    <div className="space-y-12">
      <section className="py-10 text-center">
        <Logo size={64} className="mx-auto mb-6 block" />
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Track the TV series you love
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-zinc-400">
          Keep a personal list of what you&apos;ve watched, abandoned, put on hold
          or plan to watch. Rate every series and share your taste with friends.
        </p>
        <div className="mx-auto mt-8 max-w-xl">
          <SearchBar autoFocus />
        </div>
        <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-zinc-500">
          <span>
            <b className="text-zinc-200">{stats[0]}</b> members
          </span>
          <span>
            <b className="text-zinc-200">{stats[1]}</b> series tracked
          </span>
          <span>
            <b className="text-zinc-200">{stats[2]}</b> series in the catalog
          </span>
        </div>
      </section>

      {continueWatching.length > 0 && (
        <ContinueWatching initial={continueWatching} username={user!.username} />
      )}

      {upcoming.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-bold text-zinc-100">Up next</h2>
            {user && isActiveUser(user) && (
              <Link
                href={`/u/${user.username}`}
                className="text-sm font-medium text-blue-400 hover:underline"
              >
                My list →
              </Link>
            )}
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