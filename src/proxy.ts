import { NextResponse, type NextRequest } from "next/server";
import { getCatalogueProductBySlug, getCatalogueProductHref } from "@/lib/catalogue";
const SESSION_COOKIE = "rackstack_admin_session";
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin") && request.nextUrl.pathname !== "/admin/login" && !request.cookies.get(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  const productMatch = request.nextUrl.pathname.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    const product = getCatalogueProductBySlug(productMatch[1]);
    if (product) return NextResponse.redirect(new URL(getCatalogueProductHref(product), request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/admin/:path*", "/products/:path*"] };
