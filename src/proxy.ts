import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Optimistic gate for app pages: no session cookie, straight to sign-in.
 * Each page and action still checks the session for real (requireUser).
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/today/:path*", "/agenda/:path*", "/lists/:path*", "/tasks/:path*", "/settings/:path*", "/onboarding/:path*"],
};
