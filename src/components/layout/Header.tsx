"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/layout/Logo";
import UserMenu from "@/components/layout/UserMenu";
import SearchBar from "@/components/layout/SearchBar";
import { AUTH_EVENT, useCurrentUser } from "@/lib/client-auth";

export default function Header() {
  const pathname = usePathname();
  const { user, loaded, refresh } = useCurrentUser();

  useEffect(() => {
    const onAuthChange = () => {
      void refresh();
    };
    window.addEventListener(AUTH_EVENT, onAuthChange);
    return () => window.removeEventListener(AUTH_EVENT, onAuthChange);
  }, [refresh]);

  useEffect(() => {
    void refresh();
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
        </nav>

        <div className="mx-1 min-w-0 flex-1">
          <SearchBar compact />
        </div>

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
