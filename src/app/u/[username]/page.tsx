import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { posterUrl } from "@/lib/tmdb";
import PosterCard, { type PosterCardSeries } from "@/components/PosterCard";
import { STATUSES, STATUS_LABEL, type SeriesStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = PageProps<"/u/[username]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username}'s list` };
}

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const sp = await searchParams;
  const activeStatus = (typeof sp.status === "string" ? sp.status : "") as SeriesStatus | "";

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      list: {
        include: { series: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!user || (user.role !== "APPROVED" && user.role !== "ADMIN")) notFound();

  const filtered =
    activeStatus && STATUSES.includes(activeStatus)
      ? user.list.filter((e) => e.status === activeStatus)
      : user.list;

  const cards: PosterCardSeries[] = filtered.map((e) => ({
    tmdbId: e.series.tmdbId,
    name: e.series.name,
    posterUrl: posterUrl(e.series.posterPath),
    firstAirDate: e.series.firstAirDate,
    tmdbRating: e.series.tmdbRating,
    status: e.status as SeriesStatus,
    rating: e.rating,
  }));

  const count = (s: SeriesStatus) => user.list.filter((e) => e.status === s).length;

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-2xl font-black">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">{user.username}</h1>
          <p className="text-sm text-zinc-500">
            {user.list.length} series in their list
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

      {cards.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {cards.map((s) => (
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