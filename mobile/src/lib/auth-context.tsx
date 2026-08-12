import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { getToken, setToken } from '@/lib/storage';
import type { User } from '@/lib/types';

type SignInResult = { ok: true } | { ok: false; error: string };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: User | null }>('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
      await setToken(null).catch(() => {});
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await getToken();
      if (active) setLoading(false);
      if (token) {
        try {
          await refresh();
        } catch {
          // handled inside refresh
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  const signIn = useCallback(
    async (identifier: string, password: string): Promise<SignInResult> => {
      try {
        const data = await apiFetch<{ user: User; token: string }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier, password }),
        });
        await setToken(data.token);
        setUser(data.user);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof ApiError ? e.message : 'Something went wrong' };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    await setToken(null).catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, refresh }),
    [user, loading, signIn, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}