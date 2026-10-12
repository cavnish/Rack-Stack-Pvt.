import { ArrowUpRight } from "lucide-react";

import { SOCIAL_PROFILES } from "@/lib/social-links";

import { socialIcons } from "./social-icons";
import { SectionHeading } from "./ui";

/**
 * The single place the company's social profiles are rendered.
 *
 * Every link opens in a new tab and carries `rel="noopener noreferrer"`, a
 * visible platform name and an accessible label, so the same markup and the
 * same accessibility behaviour is guaranteed on the footer, the About page and
 * the Contact page.
 */
type RowProps = {
  tone?: "dark" | "light";
  size?: number;
  iconSize?: number;
  className?: string;
  /**
   * Per-platform URL overrides from `settings.socialLinks`. A blank or missing
   * value falls back to the canonical URL in `@/lib/social-links`, so the footer
   * always shows all four profiles even before the CMS has been filled in.
   */
  overrides?: Record<string, string> | null;
};

/** A compact, always-visible row of icon buttons. Used in the footer. */
export function SocialLinksRow({ tone = "dark", size = 40, iconSize = 18, className = "", overrides }: RowProps) {
  const dark = tone === "dark";

  return (
    <ul className={`flex flex-wrap items-center gap-2.5 ${className}`} aria-label="Rack & Stack on social media">
      {SOCIAL_PROFILES.map((profile) => {
        const Icon = socialIcons[profile.id];
        const href = (overrides?.[profile.id] ?? "").trim() || profile.href;

        return (
          <li key={profile.id}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={profile.label}
              style={{ width: size, height: size }}
              className={`group grid place-items-center rounded-full transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 ${
                dark
                  ? "bg-white shadow-[0_1px_3px_rgba(0,0,0,.45)] ring-1 ring-white/15 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-offset-zinc-950"
                  : "border border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md focus-visible:ring-offset-white"
              }`}
            >
              <Icon size={iconSize} className="transition-transform duration-200 group-hover:scale-110" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

type SectionProps = {
  eyebrow?: string;
  title: string;
  description?: string | null;
  /** Section background: `muted` for the warm off-white, `white` for plain. */
  tone?: "muted" | "white";
  /** Set false when the section above already ends with its own border. */
  divider?: boolean;
  className?: string;
};

/** The larger "follow us" band used on the About and Contact pages. */
export function SocialConnectSection({
  eyebrow,
  title,
  description,
  tone = "white",
  divider = true,
  className = "",
}: SectionProps) {
  return (
    <section
      className={`${divider ? "border-t border-zinc-200 " : ""}${
        tone === "muted" ? "bg-[#f8f8f6]" : "bg-white"
      } py-16 lg:py-20 ${className}`}
    >
      <div className="container-shell grid items-start gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />

        <ul className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_PROFILES.map((profile) => {
            const Icon = socialIcons[profile.id];

            return (
              <li key={profile.id}>
                <a
                  href={profile.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={profile.label}
                  className="group flex h-full items-center gap-4 border border-zinc-200 bg-white p-5 transition duration-300 hover:border-zinc-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-zinc-100 bg-white transition-transform duration-300 group-hover:scale-105">
                    <Icon size={24} />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-zinc-900">{profile.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-zinc-500">{profile.detail}</span>
                  </span>

                  <ArrowUpRight
                    size={18}
                    aria-hidden="true"
                    className="ml-auto shrink-0 text-zinc-300 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-red-600"
                  />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
