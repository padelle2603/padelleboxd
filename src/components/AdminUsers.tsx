"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: "ADMIN" | "APPROVED" | "PENDING" | "REJECTED";
  createdAt: string;
};

const roleLabel: Record<AdminUser["role"], string> = {
  ADMIN: "Admin",
  APPROVED: "Approved",
  PENDING: "Pending",
  REJECTED: "Rejected",
};

export default function AdminUsers({ initialUsers }: { initialUsers: AdminUser[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(userId: string, action: "APPROVE" | "REJECT" | "PROMOTE") {
    setBusyId(userId);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: data.user.role as AdminUser["role"] } : u))
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
      router.refresh();
    }
  }

  const pending = users.filter((u) => u.role === "PENDING");
  const others = users.filter((u) => u.role !== "PENDING");

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold text-zinc-100">
          Pending approval
          {pending.length > 0 && (
            <span className="ml-2 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
              {pending.length}
            </span>
          )}
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
            No users waiting for approval.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-800/80 rounded-2xl border border-zinc-800 bg-zinc-900/40">
            {pending.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-100">{u.username}</p>
                  <p className="truncate text-sm text-zinc-500">{u.email}</p>
                </div>
                <span className="text-xs text-zinc-600">
                  {new Date(u.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => act(u.id, "APPROVE")}
                    disabled={busyId === u.id}
                    className="btn-primary"
                    style={{ fontSize: "0.8125rem", padding: "0.4rem 0.9rem" }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => act(u.id, "REJECT")}
                    disabled={busyId === u.id}
                    className="btn-danger"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-zinc-100">All users ({others.length})</h2>
        <ul className="divide-y divide-zinc-800/80 rounded-2xl border border-zinc-800 bg-zinc-900/40">
          {others.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-100">{u.username}</p>
                <p className="truncate text-sm text-zinc-500">{u.email}</p>
              </div>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  u.role === "ADMIN"
                    ? "border-purple-500/30 bg-purple-500/15 text-purple-400"
                    : u.role === "APPROVED"
                      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                      : "border-red-500/30 bg-red-500/15 text-red-400"
                }`}
              >
                {roleLabel[u.role]}
              </span>
              {u.role !== "ADMIN" && (
                <button
                  onClick={() => act(u.id, "PROMOTE")}
                  disabled={busyId === u.id}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-purple-500/50 hover:text-purple-300"
                >
                  Make admin
                </button>
              )}
              {u.role !== "ADMIN" && (
                <button
                  onClick={() => act(u.id, u.role === "APPROVED" ? "REJECT" : "APPROVE")}
                  disabled={busyId === u.id}
                  className="btn-ghost"
                  style={{ fontSize: "0.8125rem", padding: "0.4rem 0.9rem" }}
                >
                  {u.role === "APPROVED" ? "Reject" : "Approve"}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}