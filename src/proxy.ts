import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "rackstack_admin_session";

/**
 * Edge guard for the admin area.
 *
 * Product URLs are deliberately *not* handled here. This runs before any page
 * and cannot read the database, so the only product slugs it can know are the
 * code-defined catalogue ones — and `mezzanine-floor`, `slotted-angle-racks` and
 * `mobile-compactor-storage-system` exist in the catalogue *and* as CMS rows.
 * Redirecting on that knowledge sent every `/products/<shared-slug>` request to
 * the catalogue page, so the CMS product those slugs actually name became
 * unreachable and a card built from the CMS row opened a different product.
 *
 * The product routes now resolve themselves: `/products/[category]` serves a CMS
 * product when one owns the slug, and redirects to the catalogue only when
 * nothing else does. That decision needs the product data, so it belongs in the
 * page, not here.
 */
export function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    request.nextUrl.pathname !== "/admin/login" &&
    !request.cookies.get(SESSION_COOKIE)
  ) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
