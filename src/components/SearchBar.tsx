"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar({
  autoFocus = false,
  initialValue = "",
}: {
  autoFocus?: boolean;
  initialValue?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search TV series… e.g. Breaking Bad"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-3 pl-11 pr-4 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30"
        />
      </div>
    </form>
  );
}