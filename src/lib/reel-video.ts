/**
 * The shape the public site consumes for a Reel.
 *
 * A Reel is delivered by Instagram's official embed, so the only field that
 * matters for playback is `instagramUrl`. The rest is kept because it still
 * describes the stored row: the placement flags, the ordering, the product and
 * service relations, and the legacy media columns a row created before the move
 * to Instagram embeds may still hold.
 *
 * Declared here rather than inferred so a client component never has to import
 * anything server-only, and so the site keeps a single name for the record.
 */

export type ReelSource = "CLOUDINARY" | "INSTAGRAM";

export type ReelVideoItem = {
  id: number;
  title: string;
  category: string;
  description: string | null;
  /** Only meaningful when `source` is `INSTAGRAM`. */
  instagramUrl?: string | null;
  /** Where a hosted copy would live. Mirrors `instagramUrl` for Instagram Reels. */
  videoUrl: string;
  posterUrl: string | null;
  cloudinaryPublicId: string | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  ctaText: string | null;
  ctaUrl: string | null;
  href: string | null;
  showOnHome: boolean;
  showOnProducts: boolean;
  showOnServices: boolean;
  isActive?: boolean;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  displayOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  /** ISO string from the static layer, `Date` when resolved live from Postgres. */
  createdAt?: string | Date | null;
  productSlugs: string[];
  serviceSlugs: string[];
};
