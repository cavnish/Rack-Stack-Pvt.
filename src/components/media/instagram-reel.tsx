"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { parseInstagramUrl } from "@/lib/instagram";

/**
 * One official Instagram embed, rendered as a full-bleed 9:16 frame.
 *
 * Instagram owns the player completely: nothing is downloaded, rehosted or
 * proxied. Our job is to give their script a correctly sized box, to keep the
 * card visually dominant, and to stay out of the way once the iframe exists.
 *
 * The three problems this component exists to solve:
 *
 * 1. `embeds.js` is a single global. A section with six Reels must request it
 *    once, so one shared promise backs every mount on the page.
 * 2. `Embeds.process()` replaces the blockquote asynchronously, so the card
 *    has to wait for the iframe before it can claim to be ready — and fall
 *    back to a real "View Reel on Instagram" link if it never arrives.
 * 3. The embed does not autoplay reliably while the card is far below the
 *    fold, so the markup is not even created until the card is near the
 *    viewport. That keeps Instagram's bundle off the critical path entirely.
 */

/** Instagram's official embed script. */
const EMBEDS_SCRIPT = "https://platform.instagram.com/en_US/embeds.js";
const SCRIPT_ID = "instagram-embeds-script";

/** How long to wait for Instagram to create its iframe before showing the fallback. */
const EMBED_TIMEOUT_MS = 12000;

/** How close to the viewport a card must be before Instagram is asked for it. */
const ARM_MARGIN = "300px 0px";

let scriptPromise: Promise<void> | null = null;

/**
 * Loads `embeds.js` at most once per document.
 *
 * A rejected load is not cached, so a card that mounts later on a flaky
 * connection can retry instead of inheriting the first failure for the
 * lifetime of the page.
 */
function loadInstagramEmbeds(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  if (window.instgrm) return Promise.resolve();

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      // Requested by an earlier mount that is still in flight.
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("embeds script failed")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = EMBEDS_SCRIPT;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("embeds script failed")), { once: true });
    document.head.appendChild(script);
  });

  scriptPromise.catch(() => {
    scriptPromise = null;
  });

  return scriptPromise;
}

/**
 * Instagram renders its own sound control as a real element in *our* document,
 * next to the iframe, rather than inside it. That is what makes a real
 * mute/unmute possible without faking one: we find their control, hide it, and
 * drive it from our own button with a genuine click.
 *
 * `~=` rather than `*=` on purpose — `*=` also matches `ig-muted`, which is the
 * embed's outer wrapper and must stay visible.
 */
const IG_SOUND_SELECTOR = [
  ".ig-mute",
  '[class~="ig-mute"]',
  ".ig-muted [role='button']",
  ".ig-muted button",
].join(",");

type EmbedStatus = "idle" | "loading" | "ready" | "error";

export type InstagramEmbedProps = {
  /** The Reel permalink as stored in the CMS. Invalid values render the fallback. */
  permalink: string | null | undefined;
  title: string;
  className?: string;
};

/**
 * A single Reel, filling its container edge to edge.
 *
 * Height comes from the card's own `aspect-[9/16]`, never from the embed, so a
 * row of cards is always the same size regardless of what Instagram decides to
 * render inside.
 */
export function InstagramEmbed({ permalink, title, className }: InstagramEmbedProps) {
  const parsed = parseInstagramUrl(permalink);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const soundRef = useRef<HTMLElement | null>(null);
  const [armed, setArmed] = useState(false);
  const [status, setStatus] = useState<EmbedStatus>(parsed.ok ? "idle" : "error");
  const [muted, setMuted] = useState(true);
  const [canToggleSound, setCanToggleSound] = useState(false);

  // Only build Instagram's markup once the card is close to the viewport.
  useEffect(() => {
    if (armed) return;
    const node = frameRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setArmed(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setArmed(true);
        observer.disconnect();
      },
      { rootMargin: ARM_MARGIN },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [armed]);

  useEffect(() => {
    // An unusable permalink is already in its final state from the state
    // initialiser, so it renders the fallback and needs no work here.
    if (!parsed.ok || !armed) return;
    const frame = frameRef.current;
    if (!frame) return;

    let cancelled = false;
    setStatus("loading");

    loadInstagramEmbeds()
      .then(() => {
        if (cancelled) return;
        // Reels that mount after the script has loaded still need converting,
        // so the documented hook runs after every successful mount.
        window.instgrm?.Embeds.process();
        return waitForEmbedFrame(frame, EMBED_TIMEOUT_MS, () => cancelled);
      })
      .then((ready) => {
        if (cancelled) return;
        if (!ready) {
          setStatus("error");
          return;
        }
        // Take over Instagram's sound control only if one is really there, so
        // our button is never a promise the embed cannot keep.
        const sound = frame.querySelector<HTMLElement>(IG_SOUND_SELECTOR);
        if (sound) {
          soundRef.current = sound;
          sound.style.display = "none";
          setCanToggleSound(true);
        }
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [armed, parsed.ok]);

  function toggleSound() {
    soundRef.current?.click();
    setMuted((current) => !current);
  }

  return (
    <div
      ref={frameRef}
      className={`rk-instagram-embed aspect-[9/16] w-full overflow-hidden ${className ?? ""}`}
    >
      {parsed.ok ? (
        <>
          {/*
            Instagram's documented embed markup. `data-instgrm-permalink` is
            built from the validated shortcode, never from raw CMS text, so
            there is no HTML-injection path through this component.
            `data-instgrm-captioned` is deliberately omitted: the Reel's own
            caption is not needed inside a card that already carries a title,
            and leaving it out keeps the frame to the video.
          */}
          <blockquote
            className="instagram-media"
            data-instgrm-permalink={parsed.ref.permalink}
            data-instgrm-version="14"
          >
            <a href={parsed.ref.permalink} target="_blank" rel="noopener noreferrer">
              {title}
            </a>
          </blockquote>

          {status === "ready" ? null : (
            <>
              <InstagramFallback title={title} permalink={parsed.ref.permalink} state={status} />
              {status === "idle" || status === "loading" ? <span role="status" className="sr-only">Loading Reel</span> : null}
            </>
          )}

          {status === "ready" && canToggleSound ? (
            <button
              type="button"
              onClick={toggleSound}
              aria-label={muted ? `Unmute ${title}` : `Mute ${title}`}
              aria-pressed={!muted}
              className="rk-embed-chrome absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-zinc-950/60 text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-zinc-950/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {muted ? <VolumeX size={14} aria-hidden /> : <Volume2 size={14} aria-hidden />}
            </button>
          ) : null}
        </>
      ) : (
        <InstagramFallback title={title} permalink={null} state="error" invalid />
      )}
    </div>
  );
}

/**
 * Waits for Instagram to swap our blockquote for its own iframe.
 *
 * `Embeds.process()` returns immediately and the replacement happens later, so
 * checking for an iframe straight after the call reports a failure for almost
 * every healthy embed. Polling is the documented-safe way to notice the swap
 * without reimplementing any part of Instagram's player.
 */
function waitForEmbedFrame(frame: HTMLElement, timeoutMs: number, isCancelled: () => boolean): Promise<boolean> {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      if (isCancelled()) {
        resolve(false);
        return;
      }
      if (frame.querySelector("iframe")) {
        resolve(true);
        return;
      }
      if (Date.now() >= deadline) {
        resolve(false);
        return;
      }
      window.setTimeout(check, 120);
    };
    check();
  });
}

/**
 * Shown until Instagram's iframe exists, and permanently if it never does.
 *
 * While it is only a placeholder the whole overlay is hidden from assistive
 * tech — Instagram's own iframe brings its own accessible player, and reading
 * the Reel name twice is worse than reading it once. Once the embed has failed
 * for good it becomes real content again, because the call to action is then the
 * only way to reach the Reel, and it doubles as the no-JavaScript path.
 */
function InstagramFallback({
  title,
  permalink,
  state,
  invalid = false,
}: {
  title: string;
  permalink: string | null;
  state: EmbedStatus;
  invalid?: boolean;
}) {
  const failed = state === "error";

  return (
    <div
      className="rk-embed-chrome absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-zinc-950 p-6 text-center"
      aria-hidden={failed ? undefined : true}
    >
      {/*
        A quiet shimmer, not a play button. Instagram's own controls appear as
        soon as its iframe does, and a fake control in front of them would be
        worse than none at all.
      */}
      {failed ? null : <span aria-hidden className="h-9 w-9 animate-pulse rounded-full border border-white/15 bg-white/5" />}

      <p className="line-clamp-3 text-sm font-semibold leading-snug text-white">{title}</p>

      {failed ? (
        <a
          href={permalink ?? "https://www.instagram.com/"}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${title} on Instagram`}
          className="mt-1 inline-flex items-center gap-1.5 text-[.65rem] font-bold uppercase tracking-[.14em] text-white underline decoration-white/40 underline-offset-4 transition hover:decoration-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {invalid ? "This Reel link is not valid" : "View Reel on Instagram"}
        </a>
      ) : (
        <span aria-hidden className="text-[.65rem] font-semibold uppercase tracking-[.14em] text-zinc-500">
          Loading Reel
        </span>
      )}
    </div>
  );
}

declare global {
  interface Window {
    instgrm?: {
      Embeds: { process: () => void };
    };
  }
}
