import { Suspense } from "react";
import Logo from "@/components/layout/Logo";
import HomePersonal from "@/components/home/HomePersonal";
import HomePersonalSkeleton from "@/components/home/HomePersonalSkeleton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
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
      </section>

      <Suspense fallback={<HomePersonalSkeleton />}>
        <HomePersonal />
      </Suspense>
    </div>
  );
}