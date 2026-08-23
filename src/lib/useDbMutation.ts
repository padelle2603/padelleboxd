"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

type Options = {
  /** Re-pull this component's own client-side data after a successful mutation. */
  refetch?: () => void | Promise<void>;
  /** If the component can't self-refresh, fall back to a full page reload. */
  hardReload?: boolean;
};

/**
 * Centralizes the "refresh after a DB mutation" workflow:
 * every component that mutates the DB should call `refresh()` on success so the
 * current view updates (and, when needed, the whole page reloads).
 */
export function useDbMutation(options: Options = {}) {
  const router = useRouter();
  const optsRef = useRef(options);

  useEffect(() => {
    optsRef.current = options;
  });

  const refresh = useCallback(async () => {
    const opts = optsRef.current;
    if (opts.refetch) {
      try {
        await opts.refetch();
      } catch {
        // ignore refetch errors, the server refresh below still applies
      }
    }
    if (opts.hardReload) {
      window.location.reload();
    } else {
      router.refresh();
    }
  }, [router]);

  return { refresh };
}
