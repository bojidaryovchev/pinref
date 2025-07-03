import { auth } from "@/auth";
import { DEFAULT_SIDEBAR_EXPANDED, DEFAULT_THEME } from "@/constants";
import { isRuntimeEnv } from "@/lib/env";
import { NextRequest, NextResponse } from "next/server";

const setPathnameHeader = (res: NextResponse, pathname: string) => {
  res.headers.set("x-pathname", pathname);
};

const setDefaultTheme = (req: NextRequest, res: NextResponse) => {
  const theme = req.cookies.get("theme");

  if (!theme) {
    res.cookies.set("theme", DEFAULT_THEME, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1y in seconds
      httpOnly: false,
      secure: isRuntimeEnv("production"),
      sameSite: "lax",
    });
  }
};

const setDefaultSidebarExpanded = (req: NextRequest, res: NextResponse) => {
  const sidebarExpanded = req.cookies.get("sidebarExpanded");

  if (!sidebarExpanded) {
    res.cookies.set("sidebarExpanded", DEFAULT_SIDEBAR_EXPANDED.toString(), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1y in seconds
      httpOnly: false,
      secure: isRuntimeEnv("production"),
      sameSite: "lax",
    });
  }
};

export default auth((req) => {
  try {
    const { pathname } = req.nextUrl;
    const res = NextResponse.next();

    setPathnameHeader(res, pathname);
    setDefaultTheme(req, res);
    setDefaultSidebarExpanded(req, res);

    // Public paths that don't require authentication
    const publicPaths = ["/api/auth", "/auth"];

    // Check if the path is public
    const isPublicPath = publicPaths.some((publicPath) => pathname.startsWith(publicPath));

    // If it's a public path, allow access
    if (isPublicPath) {
      return res;
    }

    // If user is not authenticated and trying to access protected route
    if (!req.auth) {
      // For API routes, return 401 instead of redirecting
      if (pathname.startsWith("/api/")) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      // Include the current path as returnUrl for post-login redirect
      const returnUrl = encodeURIComponent(pathname);
      const redirectUrl = new URL("/auth", req.nextUrl.origin);
      redirectUrl.searchParams.set("returnUrl", returnUrl);
      return NextResponse.redirect(redirectUrl);
    }

    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    // Return a basic response to prevent the entire request from failing
    return NextResponse.next();
  }
});

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Protected routes
    "/",
    "/api/:path*",
    // Exclude Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
