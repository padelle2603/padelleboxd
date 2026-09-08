// ponytail: in-memory per-process cache. Add a shared store (Redis) only if
// multiple instances run and cross-instance staleness becomes a problem.
export function createTtlCache<T>(ttlMs: number) {
  const store = new Map<string, { at: number; value: T }>();

  return {
    get(key: string): T | null {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() - entry.at >= ttlMs) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    set(key: string, value: T): void {
      store.set(key, { at: Date.now(), value });
    },
    invalidate(key: string): void {
      store.delete(key);
    },
  };
}
