import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { posterUrl } from "@/lib/tmdb";
import type { PosterCardSeries } from "@/components/series/PosterCard";
import ProfileViewer from "@/components/u/ProfileViewer";

export const revalidate = 300;

type Props = PageProps<"/u/[username]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username}'s list` };
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;

  const profile = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      role: true,
      list: {
        select: {
          status: true,
          rating: true,
          series: {
            select: {
              tmdbId: true,
              name: true,
              posterPath: true,
              firstAirDate: true,
              tmdbRating: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!profile || (profile.role !== "APPROVED" && profile.role !== "ADMIN")) notFound();

  const cards: PosterCardSeries[] = profile.list.map((e) => ({
    tmdbId: e.series.tmdbId,
    name: e.series.name,
    posterUrl: posterUrl(e.series.posterPath),
    firstAirDate: e.series.firstAirDate,
    tmdbRating: e.series.tmdbRating,
    status: e.status as PosterCardSeries["status"],
    rating: e.rating,
  }));

  return <ProfileViewer username={profile.username} cards={cards} />;
}