export type SeriesStatus = "WATCHED" | "WATCHING" | "ABANDONED" | "ON_HOLD" | "PLANNED";

export const STATUSES: SeriesStatus[] = ["WATCHED", "WATCHING", "ABANDONED", "ON_HOLD", "PLANNED"];

export const STATUS_LABEL: Record<SeriesStatus, string> = {
  WATCHED: "Watched",
  WATCHING: "Watching",
  ABANDONED: "Abandoned",
  ON_HOLD: "On Hold",
  PLANNED: "Planned",
};

export const STATUS_SHORT: Record<SeriesStatus, string> = {
  WATCHED: "Watched",
  WATCHING: "Watching",
  ABANDONED: "Abandoned",
  ON_HOLD: "On Hold",
  PLANNED: "Planned",
};

export const STATUS_COLOR: Record<SeriesStatus, string> = {
  WATCHED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  WATCHING: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  ABANDONED: "bg-red-500/15 text-red-400 border-red-500/30",
  ON_HOLD: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  PLANNED: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

export const STATUS_TEXT_COLOR: Record<SeriesStatus, string> = {
  WATCHED: "text-emerald-400",
  WATCHING: "text-violet-400",
  ABANDONED: "text-red-400",
  ON_HOLD: "text-amber-400",
  PLANNED: "text-sky-400",
};

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  const year = date.split("-")[0];
  return year || "—";
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

export function formatAirDate(date: string | null | undefined): string {
  if (!date) return "Date TBA";
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}