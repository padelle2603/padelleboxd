"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-zinc-800 px-3 py-1.5 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100"
    >
      Log out
    </button>
  );
}