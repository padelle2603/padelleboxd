import type { Metadata } from "next";
import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import PosterCard, { type PosterCardSeries } from "@/components/PosterCard";
import { searchTv, posterUrl } from "@/lib/tmdb";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  let results: PosterCardSeries[] = [];
  if (query) {
    const data = await searchTv(query);
    results = data.map((tv) => ({
      tmdbId: tv.id,
      name: tv.name,
      posterUrl: posterUrl(tv.poster_path),
      firstAirDate: tv.first_air_date,
      tmdbRating: tv.vote_average,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-2xl">
        <SearchBar autoFocus initialValue={query} />
      </div>

      {query ? (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            {results.length} result{results.length === 1 ? "" : "s"} for{" "}
            <b className="text-zinc-300">&ldquo;{query}&rdquo;</b>
          </p>
          {results.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {results.map((s) => (
                <PosterCard key={s.tmdbId} series={s} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
              No TV series found. Try a different title.
            </p>
          )}
        </div>
      ) : (
        <Suspense fallback={null}>
          <p className="py-16 text-center text-sm text-zinc-600">
            Search for any TV series by title.
          </p>
        </Suspense>
      )}
    </div>
  );
}