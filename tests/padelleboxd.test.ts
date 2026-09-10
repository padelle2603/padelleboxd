import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { todayStr, daysUntil, formatDate, formatAirDate } from "../src/lib/dates";
import { createTtlCache } from "../src/lib/ttl-cache";
import { STATUSES, STATUS_LABEL, STATUS_COLOR, RATING_OPTIONS, canRate } from "../src/lib/constants";

describe("dates: todayStr", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats today as YYYY-MM-DD", () => {
    vi.setSystemTime(new Date(2026, 0, 5));
    expect(todayStr()).toBe("2026-01-05");
  });

  it("pads month and day", () => {
    vi.setSystemTime(new Date(2026, 10, 15));
    expect(todayStr()).toBe("2026-11-15");
  });
});

describe("dates: daysUntil", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for missing date", () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil(undefined)).toBeNull();
    expect(daysUntil("")).toBeNull();
  });

  it("returns null for invalid dates", () => {
    expect(daysUntil("not-a-date")).toBeNull();
    expect(daysUntil("2026")).toBeNull();
  });

  it("returns days from today", () => {
    vi.setSystemTime(new Date(2026, 5, 10));
    expect(daysUntil("2026-06-15")).toBe(5);
    expect(daysUntil("2026-06-05")).toBe(-5);
    expect(daysUntil("2026-06-10")).toBe(0);
  });
});

describe("dates: formatDate", () => {
  it("returns em dash for missing", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
  });

  it("returns the year segment", () => {
    expect(formatDate("2024-03-12")).toBe("2024");
    expect(formatDate("2026")).toBe("2026");
  });

  it("returns first segment of unparseable input", () => {
    expect(formatDate("nope")).toBe("nope");
  });
});

describe("dates: formatAirDate", () => {
  it("returns TBA for missing", () => {
    expect(formatAirDate(null)).toBe("Date TBA");
    expect(formatAirDate(undefined)).toBe("Date TBA");
  });

  it("formats a full date", () => {
    const out = formatAirDate("2026-08-16");
    expect(out).toContain("2026");
    expect(out).toContain("Aug");
    expect(out).toContain("16");
  });

  it("returns raw value for invalid", () => {
    expect(formatAirDate("not-a-date")).toBe("not-a-date");
  });
});

describe("ttl-cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and retrieves values", () => {
    const cache = createTtlCache<number>(1000);
    cache.set("a", 42);
    expect(cache.get("a")).toBe(42);
  });

  it("returns null for missing keys", () => {
    const cache = createTtlCache<number>(1000);
    expect(cache.get("missing")).toBeNull();
  });

  it("expires entries after TTL", () => {
    const cache = createTtlCache<number>(1000);
    cache.set("a", 42);
    vi.advanceTimersByTime(1001);
    expect(cache.get("a")).toBeNull();
  });

  it("keeps entries within TTL", () => {
    const cache = createTtlCache<number>(1000);
    cache.set("a", 42);
    vi.advanceTimersByTime(500);
    expect(cache.get("a")).toBe(42);
  });

  it("invalidates entries", () => {
    const cache = createTtlCache<number>(1000);
    cache.set("a", 42);
    cache.invalidate("a");
    expect(cache.get("a")).toBeNull();
  });
});

describe("constants: statuses", () => {
  it("exposes all five statuses", () => {
    expect(STATUSES).toEqual(["WATCHED", "WATCHING", "ABANDONED", "ON_HOLD", "PLANNED"]);
  });

  it("labels every status", () => {
    for (const s of STATUSES) {
      expect(STATUS_LABEL[s]).toBeTruthy();
    }
  });

  it("colors every status", () => {
    for (const s of STATUSES) {
      expect(STATUS_COLOR[s]).toBeTruthy();
    }
  });

  it("rating options are descending", () => {
    expect([...RATING_OPTIONS]).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });
});

describe("constants: canRate", () => {
  it("allows rating only for WATCHED and ABANDONED", () => {
    expect(canRate("WATCHED")).toBe(true);
    expect(canRate("ABANDONED")).toBe(true);
    expect(canRate("WATCHING")).toBe(false);
    expect(canRate("ON_HOLD")).toBe(false);
    expect(canRate("PLANNED")).toBe(false);
  });
});