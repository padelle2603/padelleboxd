import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/layout/LogoutButton";
import Logo from "@/components/layout/Logo";

export default async function Header() {
  const user = await getCurrentUser();
  const active = user?.role === "APPROVED" || user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <Logo size={28} />
          <span className="text-zinc-100">PadelleBoxd</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
          >
            Home
          </Link>
          <Link
            href="/search"
            className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
          >
            Search
          </Link>
          {active && (
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
            >
              My List
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link
                href={`/u/${user.username}`}
                className="rounded-lg border border-zinc-800 px-3 py-1.5 font-medium text-zinc-200 transition hover:border-zinc-700"
              >
                {user.username}
              </Link>
              {user.role === "PENDING" && (
                <span className="hidden rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 sm:block">
                  Awaiting approval
                </span>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 font-medium text-zinc-300 transition hover:text-zinc-100"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-4 py-1.5 font-semibold text-white transition hover:bg-blue-500"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}