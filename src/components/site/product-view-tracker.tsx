"use client";

import { useEffect } from "react";
import { trackViewItem } from "@/lib/analytics";

/**
 * Emits the GA4 `view_item` event for a product page.
 *
 * A client component rather than a call in the server view, because the
 * `dataLayer` only exists in the browser. It is rendered by
 * `ProductSectionsLayout`, which both product addresses (`/products/<slug>`
 * and `/products/<category>/<slug>`) share, so the event fires once whichever
 * URL the visitor landed on. The dependency list is the product identity, so a
 * soft navigation between two products fires once for each rather than once
 * for the first one.
 */
export function ProductViewTracker({
  id,
  name,
  category,
  slug,
}: {
  id?: string | number;
  name: string;
  category?: string;
  slug?: string;
}) {
  useEffect(() => {
    trackViewItem({ id, name, category, slug });
  }, [id, name, category, slug]);

  return null;
}
