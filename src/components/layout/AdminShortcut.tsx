"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const HIDDEN_PATH = "/admin";
const PHRASE = "padelleboxdadmin";

export default function AdminShortcut() {
  const router = useRouter();

  useEffect(() => {
    let buffer = "";

    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
      ) {
        return;
      }
      if (e.key.length !== 1 || !/[a-z]/i.test(e.key)) {
        buffer = "";
        return;
      }
      buffer = (buffer + e.key.toLowerCase()).slice(-PHRASE.length);
      if (buffer === PHRASE) {
        buffer = "";
        router.push(HIDDEN_PATH);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return null;
}