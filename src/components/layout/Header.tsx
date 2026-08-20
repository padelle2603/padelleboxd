"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/layout/Logo";
import UserMenu from "@/components/layout/UserMenu";

type Me = { id: string; username: string; role: string } | null;

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<Me>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cleanup = refresh();
    const onAuthChange = () => {
      setLoaded(false);
      void refresh();
    };
    window.addEventListener("pb:auth", onAuthChange);
    return () => {
      cleanup();
      window.removeEventListener("pb:auth", onAuthChange);
    };
  }, [pathname, refresh]);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link href="/" className="flex shrink-0 items-center">
          <Logo size={28} />
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
        </nav>

        <div className="ml-auto flex items-center gap-2 text-sm">
          {loaded ? (
            user ? (
              <UserMenu username={user.username} role={user.role} />
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
            )
          ) : (
            <span className="h-9 w-28 animate-pulse rounded-lg bg-zinc-800/70" />
          )}
        </div>
      </div>
    </header>
  );
}