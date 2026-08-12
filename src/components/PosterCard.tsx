import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import type { SeriesStatus } from "@/lib/constants";

export type PosterCardSeries = {
  tmdbId: number;
  name: string;
  posterUrl: string | null;
  firstAirDate?: string | null;
  tmdbRating?: number | null;
  status?: SeriesStatus;
  rating?: number | null;
};

export default function PosterCard({ series }: { series: PosterCardSeries }) {
  return (
    <Link
      href={`/series/${series.tmdbId}`}
      className="group block rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 transition hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-800">
        {series.posterUrl ? (
          <Image
            src={series.posterUrl}
            alt={series.name}
            fill
            sizes="(max-width: 640px) 50vw, 256px"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-xs text-zinc-500">
            {series.name}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 to-transparent p-2 pt-8">
          {series.tmdbRating != null && series.tmdbRating > 0 && (
            <span className="flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-amber-400">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.286 3.958c.3.922-.755 1.688-1.538 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.782.57-1.838-.196-1.538-1.118l1.286-3.958a1 1 0 00-.363-1.118L2.062 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.287-3.958z" />
              </svg>
              {series.tmdbRating.toFixed(1)}
            </span>
          )}
          {series.rating != null && (
            <span className="rounded bg-emerald-600/90 px-1.5 py-0.5 text-[11px] font-bold text-white">
              {series.rating}/10
            </span>
          )}
          {series.status && <StatusBadge status={series.status} />}
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <p className="line-clamp-1 text-sm font-semibold text-zinc-100">{series.name}</p>
        <p className="text-xs text-zinc-500">{formatDate(series.firstAirDate ?? null)}</p>
      </div>
    </Link>
  );
}