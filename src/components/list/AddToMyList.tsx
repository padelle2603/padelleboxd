"use client";

import { useState } from "react";
import { STATUSES, STATUS_LABEL, type SeriesStatus } from "@/lib/constants";
import { useDbMutation } from "@/lib/useDbMutation";

const RATING_OPTIONS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

function canRate(status: SeriesStatus) {
  return status === "WATCHED" || status === "ABANDONED";
}

export default function AddToMyList({
  tmdbId,
  initialStatus,
  initialRating,
  onChanged,
}: {
  tmdbId: number;
  initialStatus: SeriesStatus | null;
  initialRating: number | null;
  onChanged?: () => void;
}) {
  const { refresh } = useDbMutation();
  const [status, setStatus] = useState<SeriesStatus>(initialStatus ?? "PLANNED");
  const [rating, setRating] = useState<number | null>(initialRating);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const exists = initialStatus != null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(exists ? `/api/me/series/${tmdbId}` : "/api/me/series", {
        method: exists ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId, status, rating }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      await refresh();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/me/series/${tmdbId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong");
        return;
      }
      await refresh();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="status-select" className="sr-only">
          Status
        </label>
        <select
          id="status-select"
          value={status}
          onChange={(e) => {
            const next = e.target.value as SeriesStatus;
            setStatus(next);
            if (!canRate(next)) setRating(null);
          }}
          className="field-select"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        {canRate(status) && (
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
            {RATING_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRating(r)}
                aria-label={`Rate ${r}/10`}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition ${
                  rating === r
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
        {!canRate(status) && (
          <span className="text-xs text-zinc-500">Rate after you finish watching.</span>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={busy} className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>
          {exists ? "Save changes" : "Add to my list"}
        </button>
        {exists && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="btn-danger"
          >
            Remove
          </button>
        )}
      </div>
    </form>
  );
}