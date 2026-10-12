"use client";
import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

const WAIT = 900;
const EXIT = 400;
const TOTAL = WAIT + EXIT;
const LETTERS = "RACK & STACK".split("");

const BAY = { posts: [45, 275] as const, beams: [40, 78, 116] as const, palletX: [84, 160, 236] as const };

function prefersReducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hasSeenLoader() {
  try {
    return sessionStorage.getItem("rs-loader-seen") === "1";
  } catch {
    return false;
  }
}

function markLoaderSeen() {
  try {
    sessionStorage.setItem("rs-loader-seen", "1");
  } catch {
    /* storage unavailable */
  }
}

/**
 * The rack illustration that assembles during the splash.
 *
 * The pieces are plain SVG elements animated by CSS (`.rs-loader-post`,
 * `.rs-loader-beam`, `.rs-loader-pallet` in `globals.css`) instead of
 * framer-motion: the vertical posts scale up from their base, the horizontal
 * beams sweep out from the left, and the pallets drop into place, each offset by
 * its own index.
 */
function RackVisual() {
  return (
    <svg viewBox="0 0 320 150" fill="none" aria-hidden="true" className="h-auto w-[300px] sm:w-[340px]">
      {BAY.posts.map((x, i) => (
        <line
          key={`post-${x}`}
          x1={x}
          x2={x}
          y1={132}
          y2={18}
          stroke="#40454a"
          strokeWidth={5}
          strokeLinecap="round"
          className="rs-loader-post"
          style={{ "--i": i } as CSSProperties}
        />
      ))}
      {BAY.beams.map((y, i) => (
        <line
          key={`beam-${y}`}
          x1={45}
          x2={275}
          y1={y}
          y2={y}
          stroke="#34383c"
          strokeWidth={6}
          strokeLinecap="round"
          className="rs-loader-beam"
          style={{ "--i": i } as CSSProperties}
        />
      ))}
      <line x1={45} y1={132} x2={275} y2={132} stroke="#282b2e" strokeWidth={3} />
      {BAY.beams.map((y, i) =>
        BAY.palletX.map((cx, j) => (
          <rect
            key={`pallet-${i}-${j}`}
            x={cx - 15}
            y={y - 18}
            width={30}
            height={14}
            rx={2}
            fill={j === 1 ? "#d11f2f" : "#26292c"}
            stroke={j === 1 ? "#e54452" : "rgba(255,255,255,0.14)"}
            strokeWidth={1}
            className="rs-loader-pallet"
            style={{ "--i": i * 3 + j } as CSSProperties}
          />
        )),
      )}
    </svg>
  );
}

export function SiteLoader() {
  const [phase, setPhase] = useState<"idle" | "active" | "leaving" | "done">("idle");

  /**
   * Whether this visit should show the splash at all.
   *
   * Deliberately separate state from `phase`, and set exactly once. The timer
   * effect below depends on this and on nothing else, so the phase changes the
   * sequence itself causes cannot tear its own timers down. Deriving both from
   * `phase` was the original defect: flipping `active` -> `leaving` ran the
   * cleanup that cleared the timer meant to advance to `done`, so the splash
   * sat in `leaving` forever and never unmounted.
   */
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (hasSeenLoader() || prefersReducedMotion()) {
        setPhase("done");
        return;
      }
      markLoaderSeen();
      setRunning(true);
      setPhase("active");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  /**
   * The whole splash timeline in one effect, keyed on `running` only.
   *
   * `finish` is given a little slack past the exit animation so the overlay is
   * always unmounted even if a tab is backgrounded and timers are throttled,
   * and both timers are cleared on unmount so a navigation cannot leave one
   * behind.
   */
  useEffect(() => {
    if (!running) return;
    const hold = window.setTimeout(() => setPhase("leaving"), WAIT);
    const finish = window.setTimeout(() => setPhase("done"), TOTAL + 120);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(finish);
    };
  }, [running]);

  /**
   * The loader is a splash, not a barrier.
   *
   * It used to set `overflow: hidden` on `<html>` for its own duration, so on a
   * slow first paint the visitor could see the finished page and still not be
   * able to scroll it. Nothing underneath needs a scroll lock — the overlay is
   * purely decorative and already lifts away on a timer — so it does not take
   * the document's scrolling away, and it never intercepts pointer events.
   */

  if (phase === "idle" || phase === "done") return null;

  const leaving = phase === "leaving";

  return (
    <div
      role="status"
      aria-label="Loading Rack &amp; Stack Storage Systems"
      className={`rs-loader-overlay pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 text-white ${leaving ? "rs-loader-leaving" : ""}`}
    >
      <div className="dark-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-zinc-950 to-transparent" />

      <div className="rs-loader-inner relative flex w-full max-w-md flex-col items-center px-6 text-center">
        <span className="rs-loader-logo grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-white shadow-[0_0_0_6px_rgba(209,31,47,.08)]">
          <Image src="/logo.png" alt="" width={128} height={128} sizes="64px" className="h-full w-full object-contain" draggable={false} />
        </span>

        <p aria-hidden="true" className="mt-6 flex items-baseline justify-center text-[1.6rem] font-extrabold tracking-[0.14em] sm:text-3xl">
          {LETTERS.map((ch, i) => (
            <span key={`${ch}-${i}`} className={`rs-loader-letter ${ch === "&" ? "text-red-500" : "text-zinc-100"}`} style={{ "--i": i } as CSSProperties}>
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </p>

        <div className="rs-loader-divider mt-4 flex items-center gap-3">
          <span className="rs-loader-rule-left h-px w-10 bg-red-600" />
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.34em] text-zinc-400">Storage Systems</span>
          <span className="rs-loader-rule-right h-px w-10 bg-red-600" />
        </div>

        <div className="rs-loader-rack mt-9">
          <RackVisual />
        </div>

        <div className="mt-9 flex w-60 flex-col items-center gap-3">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
            <div className="rs-loader-progress h-full rounded-full bg-red-600" />
          </div>
          <p className="rs-loader-caption text-[0.56rem] font-bold uppercase tracking-[0.3em] text-zinc-400">Smart Storage Systems</p>
        </div>
      </div>
    </div>
  );
}
