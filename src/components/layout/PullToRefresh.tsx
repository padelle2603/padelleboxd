"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const THRESHOLD = 70;
const MAX_PULL = 110;
const DAMPING = 0.5;

type Phase = "idle" | "pulling" | "ready" | "refreshing";

export default function PullToRefresh({ children }: { children: ReactNode }) {
  const [distance, setDistance] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const active = useRef(false);
  const distanceRef = useRef(0);

  function setPull(d: number, p: Phase) {
    distanceRef.current = d;
    setDistance(d);
    setPhase(p);
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prevOverscroll = document.documentElement.style.overscrollBehaviorY;
    document.documentElement.style.overscrollBehaviorY = "none";

    const onStart = (e: TouchEvent) => {
      if (phase === "refreshing") return;
      startY.current = e.touches[0].clientY;
      active.current = window.scrollY <= 0;
    };

    const onMove = (e: TouchEvent) => {
      if (!active.current) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        if (distanceRef.current !== 0) setPull(0, "idle");
        active.current = false;
        return;
      }
      if (window.scrollY > 0) {
        active.current = false;
        return;
      }
      e.preventDefault();
      const d = Math.min(delta * DAMPING, MAX_PULL);
      setPull(d, d >= THRESHOLD ? "ready" : "pulling");
    };

    const onEnd = () => {
      if (phase === "refreshing") return;
      if (distanceRef.current >= THRESHOLD) {
        setPhase("refreshing");
        distanceRef.current = MAX_PULL;
        setDistance(MAX_PULL);
        window.location.reload();
      } else {
        setPull(0, "idle");
      }
      active.current = false;
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
      document.documentElement.style.overscrollBehaviorY = prevOverscroll;
    };
  }, [phase]);

  const pullProgress = Math.min(distance / THRESHOLD, 1);
  const pillVisible = distance > 0 || phase === "refreshing";
  const pillTranslate = pillVisible ? -(1 - pullProgress) * 100 : -200;
  const pillOpacity = pillVisible ? Math.max(pullProgress, phase === "refreshing" ? 1 : 0) : 0;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-14 z-30 flex justify-center"
        style={{
          transform: `translateY(${pillTranslate}%)`,
          opacity: pillOpacity,
          transition:
            phase === "pulling" || phase === "ready"
              ? "none"
              : "transform 0.25s ease, opacity 0.25s ease",
        }}
      >
        <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/95 px-4 py-2 text-sm text-zinc-200 shadow-lg backdrop-blur">
          {phase === "refreshing" ? (
            <>
              <Spinner />
              <span>Aggiorno…</span>
            </>
          ) : (
            <>
              <Arrow rotated={phase === "ready"} progress={pullProgress} />
              <span>{phase === "ready" ? "Rilascia per aggiornare" : "Tira per aggiornare"}</span>
            </>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex flex-1 flex-col"
        style={{
          transform: distance ? `translateY(${distance}px)` : undefined,
          transition:
            phase === "pulling" || phase === "ready"
              ? "none"
              : "transform 0.25s ease",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </>
  );
}

function Arrow({ rotated, progress }: { rotated: boolean; progress: number }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-blue-400"
      style={{ transform: rotated ? "rotate(180deg)" : `rotate(${progress * 180}deg)` }}
    >
      <path d="M10 4v12M5 11l5 5 5-5" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 animate-spin text-blue-400" fill="none">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M17 10a7 7 0 0 0-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
