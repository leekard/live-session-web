import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const cookieName = process.env.COOKIE_NAME || "livesession_auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith("/account") || pathname.startsWith("/admin");
  if (!isProtected) return NextResponse.next();

  const hasCookie = request.cookies.get(cookieName)?.value;
  if (!hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("back", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
