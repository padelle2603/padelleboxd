import { Suspense } from "react";
import Logo from "@/components/layout/Logo";
import { getSiteStats } from "@/lib/stats";
import HomePersonal from "@/components/home/HomePersonal";
import HomePersonalSkeleton from "@/components/home/HomePersonalSkeleton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stats = await getSiteStats();

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

      <Suspense fallback={<HomePersonalSkeleton />}>
        <HomePersonal />
      </Suspense>
    </div>
  );
}