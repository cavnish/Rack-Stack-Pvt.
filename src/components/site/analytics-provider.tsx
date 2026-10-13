"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track, trackPageView, onConsentChange } from "@/lib/analytics";

/**
 * The single client component that observes the page.
 *
 * It is mounted once, in the public site layout, and does four things from
 * side effects rather than from markup — so tracking a new CTA does not mean
 * threading a handler through a server component tree:
 *
 *  1. emits one `page_view` per navigation, including the first paint and
 *     every App Router client transition;
 *  2. watches scroll and reports 25/50/75/90 % milestones, reset per page;
 *  3. classifies clicks on links and annotated CTAs by delegation, which is
 *     what catches the WhatsApp/phone/email links the site renders in a dozen
 *     different components;
 *  4. reports the first interaction with each form as `lead_form_start`.
 *
 * All of it is gated on consent inside `track()` / `trackPageView()`; this
 * component observes unconditionally but never emits without consent.
 */
export function AnalyticsProvider() {
  const pathname = usePathname();

  /**
   * The last fully-qualified address a `page_view` was sent for.
   *
   * The ref (not state) is what makes this safe under React Strict Mode's
   * deliberate double-invocation of effects: the second mount sees the same
   * path and stops, so the first page of a session is not counted twice.
   */
  const lastTrackedPath = useRef<string | null>(null);

  /** Scroll milestones already reported for the current page. */
  const scrollMilestones = useRef<Set<number>>(new Set());

  // (1) page_view on first paint and on every client-side navigation.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const current = `${window.location.pathname}${window.location.search}`;
    if (lastTrackedPath.current === current) return;
    lastTrackedPath.current = current;
    scrollMilestones.current = new Set();
    trackPageView();
  }, [pathname]);

  // (1b) A visitor who accepts the banner mid-session should still get the page
  // they are looking at counted, because their earlier views were gated out.
  useEffect(() => {
    return onConsentChange((value) => {
      if (value !== "all") return;
      lastTrackedPath.current = null;
      trackPageView();
    });
  }, []);

  // (2) Scroll depth, only for pages tall enough to scroll.
  useEffect(() => {
    const milestones = [25, 50, 75, 90];
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const percent = Math.round((window.scrollY / scrollable) * 100);
      for (const milestone of milestones) {
        if (percent >= milestone && !scrollMilestones.current.has(milestone)) {
          scrollMilestones.current.add(milestone);
          track("scroll_depth", {
            percent_scrolled: milestone,
            page_path: window.location.pathname,
          });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // (3) Click delegation.
  useEffect(() => {
    const classify = (element: Element): void => {
      // An explicit opt-in attribute wins, so a component can name its own
      // event without this switch growing a branch per feature.
      const annotated = element.closest<HTMLElement>("[data-analytics-event]");
      if (annotated?.dataset.analyticsEvent) {
        track(annotated.dataset.analyticsEvent as Parameters<typeof track>[0], {
          cta_label: (annotated.dataset.analyticsLabel ?? annotated.textContent ?? "").trim().slice(0, 120),
          page_path: window.location.pathname,
        });
        return;
      }

      const anchor = element.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.getAttribute("href") ?? "";
      const lower = href.toLowerCase();
      const linkText = (anchor.textContent ?? "").trim().slice(0, 120);
      const common = { link_url: href, link_text: linkText, page_path: window.location.pathname };

      if (lower.startsWith("tel:")) {
        track("phone_click", common);
        return;
      }
      if (lower.startsWith("mailto:")) {
        track("email_click", common);
        return;
      }
      if (lower.includes("wa.me") || lower.includes("api.whatsapp.com") || lower.includes("whatsapp")) {
        track("whatsapp_click", common);
        return;
      }
      if (lower.startsWith("/request-a-quote")) {
        track("quote_cta_click", common);
        return;
      }
      if (lower.includes(".pdf") || anchor.hasAttribute("download")) {
        const fileName = lower.split("?")[0].split("/").pop() || href;
        track("brochure_download", { file_name: fileName, link_url: href, page_path: window.location.pathname });
      }
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element) classify(target);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // (4) First interaction per form.
  useEffect(() => {
    const seen = new WeakSet<HTMLFormElement>();
    const onStart = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const form = target.closest("form");
      if (!form || seen.has(form)) return;
      seen.add(form);
      const formName =
        form.getAttribute("data-analytics-form") || form.getAttribute("name") || form.id || "form";
      track("lead_form_start", { form_name: formName, page_path: window.location.pathname });
    };

    document.addEventListener("focusin", onStart, true);
    document.addEventListener("input", onStart, true);
    return () => {
      document.removeEventListener("focusin", onStart, true);
      document.removeEventListener("input", onStart, true);
    };
  }, []);

  return null;
}
