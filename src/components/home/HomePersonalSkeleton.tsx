export default function HomePersonalSkeleton() {
  return (
    <div className="space-y-12" aria-hidden>
      <section>
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-zinc-800" />
        <ul className="divide-y divide-zinc-800/80 rounded-2xl border border-zinc-800 bg-zinc-900/40">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-16 w-11 shrink-0 animate-pulse rounded-md bg-zinc-800" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-1/2 animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-800" />
              </div>
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-zinc-800" />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-4 h-6 w-24 animate-pulse rounded bg-zinc-800" />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="space-y-2">
              <div className="aspect-[2/3] animate-pulse rounded-xl bg-zinc-800" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-800" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
