import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // Get the pathname
  const path = req.nextUrl.pathname;

  // Debug URLs (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Request URL: ${req.url}, Path: ${path}`);
  }

  // Public paths that don't require authentication
  const publicPaths = ["/api/auth", "/auth", "/api/debug-url"];

  // Check if the path is public
  const isPublicPath = publicPaths.some((publicPath) => path.startsWith(publicPath));

  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next();
  }

  try {
    // Get the token
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If user is not authenticated and trying to access protected route, redirect to sign-in
    if (!token && !path.startsWith("/api/auth")) {
      // For API routes, return 401 instead of redirecting
      if (path.startsWith("/api/")) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      // Include the current path as returnUrl for post-login redirect
      const returnUrl = encodeURIComponent(path);
      return NextResponse.redirect(new URL(`/auth?returnUrl=${returnUrl}`, req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Authentication error in middleware:", error);

    // If authentication fails due to an error, redirect to the auth page
    if (path.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ error: "Authentication error" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    return NextResponse.redirect(new URL("/auth?error=auth_error", req.url));
  }
}

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
