"use client";

import { useCallback, useEffect, useState } from "react";

export const AUTH_EVENT = "pb:auth";
const COOKIE_PATH = "/api/auth/me";

export type ClientUser = { id: string; username: string; role: string } | null;

export function isActiveRole(role: string | null | undefined): boolean {
  return role === "APPROVED" || role === "ADMIN";
}

export function useCurrentUser(): {
  user: ClientUser;
  loaded: boolean;
  refresh: () => void;
} {
  const [user, setUser] = useState<ClientUser>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(COOKIE_PATH, { cache: "no-store" });
      const data = (await res.json()) as { user: ClientUser };
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const refresh = useCallback(() => {
    setLoaded(false);
    void load();
  }, [load]);

  return { user, loaded, refresh };
}
