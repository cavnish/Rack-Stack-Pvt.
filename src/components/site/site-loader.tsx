"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;
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

function RackVisual() {
  return (
    <svg viewBox="0 0 320 150" fill="none" aria-hidden="true" className="h-auto w-[300px] sm:w-[340px]">
      <motion.g
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.13, delayChildren: 0.1 } } }}
      >
        {BAY.posts.map((x) => (
          <motion.line
            key={`post-${x}`}
            x1={x}
            x2={x}
            y1={132}
            y2={132}
            stroke="#40454a"
            strokeWidth={5}
            strokeLinecap="round"
            variants={{ hidden: { y1: 132 }, show: { y1: 18, transition: { duration: 0.55, ease: EASE } } }}
          />
        ))}
        {BAY.beams.map((y) => (
          <motion.line
            key={`beam-${y}`}
            x1={45}
            x2={45}
            y1={y}
            y2={y}
            stroke="#34383c"
            strokeWidth={6}
            strokeLinecap="round"
            variants={{ hidden: { x2: 45 }, show: { x2: 275, transition: { duration: 0.5, ease: EASE } } }}
          />
        ))}
        <line x1={45} y1={132} x2={275} y2={132} stroke="#282b2e" strokeWidth={3} />
        {BAY.beams.map((y, i) =>
          BAY.palletX.map((cx, j) => (
            <motion.rect
              key={`pallet-${i}-${j}`}
              x={cx - 15}
              y={y - 18}
              width={30}
              height={14}
              rx={2}
              fill={j === 1 ? "#d11f2f" : "#26292c"}
              stroke={j === 1 ? "#e54452" : "rgba(255,255,255,0.14)"}
              strokeWidth={1}
              variants={{
                hidden: { opacity: 0, y: y - 34 },
                show: { opacity: 1, y: y - 18, transition: { type: "spring", stiffness: 280, damping: 17 } },
              }}
            />
          ))
        )}
      </motion.g>
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
    <motion.div
      role="status"
      aria-label="Loading Rack &amp; Stack Storage Systems"
      className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 text-white"
      initial={false}
      animate={leaving ? { y: "-100%" } : { y: 0 }}
      transition={leaving ? { duration: EXIT / 1000, ease: [0.76, 0, 0.24, 1] } : { duration: 0 }}
    >
      <div className="dark-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-zinc-950 to-transparent" />

      <motion.div
        className="relative flex w-full max-w-md flex-col items-center px-6 text-center"
        initial={false}
        animate={leaving ? { opacity: 0, scale: 0.96, transition: { duration: 0.28, ease: "easeIn" } } : {}}
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.72 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
          className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-white shadow-[0_0_0_6px_rgba(209,31,47,.08)]"
        >
          <Image src="/logo.png" alt="" width={700} height={700} priority unoptimized className="h-full w-full object-contain" draggable={false} />
        </motion.span>

        <motion.p
          aria-hidden="true"
          className="mt-6 flex items-baseline justify-center text-[1.6rem] font-extrabold tracking-[0.14em] sm:text-3xl"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.18 } } }}
        >
          {LETTERS.map((ch, i) => (
            <motion.span
              key={`${ch}-${i}`}
              className={ch === "&" ? "text-red-500" : "text-zinc-100"}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
            >
              {ch === " " ? "\u00A0" : ch}
            </motion.span>
          ))}
        </motion.p>

        <motion.div
          className="mt-4 flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.72, ease: EASE }}
        >
          <motion.span
            className="h-px w-10 origin-right bg-red-600"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.72, ease: EASE }}
          />
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.34em] text-zinc-400">Storage Systems</span>
          <motion.span
            className="h-px w-10 origin-left bg-red-600"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.72, ease: EASE }}
          />
        </motion.div>

        <motion.div
          className="mt-9"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85, ease: EASE }}
        >
          <RackVisual />
        </motion.div>

        <div className="mt-9 flex w-60 flex-col items-center gap-3">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full origin-left rounded-full bg-red-600"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2, delay: 0.15, ease: EASE }}
            />
          </div>
          <motion.p
            className="text-[0.56rem] font-bold uppercase tracking-[0.3em] text-zinc-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Smart Storage Systems
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}