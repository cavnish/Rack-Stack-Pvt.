import { NextResponse, type NextRequest } from "next/server";
const SESSION_COOKIE = "rackstack_admin_session";
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin") && request.nextUrl.pathname !== "/admin/login" && !request.cookies.get(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/admin/:path*"] };
