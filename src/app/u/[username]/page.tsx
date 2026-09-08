import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { seriesRowToCard } from "@/lib/serializers";
import type { PosterCardSeries } from "@/components/series/PosterCard";
import ProfileViewer from "@/components/u/ProfileViewer";
import type { SeriesStatus } from "@/lib/constants";

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

  const cards: PosterCardSeries[] = profile.list.map((e) =>
    seriesRowToCard({
      ...e.series,
      status: e.status as SeriesStatus,
      rating: e.rating,
    })
  );

  return <ProfileViewer username={profile.username} cards={cards} />;
}