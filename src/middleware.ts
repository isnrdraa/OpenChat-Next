import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow these paths without any checks
  if (
    pathname.startsWith("/setup") ||
    pathname.startsWith("/api/setup") ||
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/sessions") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/models") ||
    pathname.startsWith("/api/test-provider") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/chat" ||
    pathname === "/login" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Check if setup is completed
  const setupCompleted = request.cookies.get("setup_completed")?.value;

  if (!setupCompleted) {
    const setupCheckUrl = new URL("/api/setup/check", request.url);
    try {
      const res = await fetch(setupCheckUrl.toString());
      const data = await res.json();

      if (!data.completed) {
        return NextResponse.redirect(new URL("/setup", request.url));
      }
    } catch {
      return NextResponse.next();
    }
  }

  // Auth check for settings/admin routes
  if (pathname.startsWith("/settings") || pathname.startsWith("/api/settings")) {
    const session = request.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Set setup_completed cookie if not present
  if (!setupCompleted) {
    const response = NextResponse.next();
    response.cookies.set("setup_completed", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
