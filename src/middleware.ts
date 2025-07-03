import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // Get the pathname
  const path = req.nextUrl.pathname;
  
  // Public paths that don't require authentication
  const publicPaths = ["/api/auth", "/auth"];
  
  // Check if the path is public
  const isPublicPath = publicPaths.some(publicPath => 
    path.startsWith(publicPath)
  );

  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Get the token
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // If user is not authenticated and trying to access protected route, redirect to our custom auth page
  if (!token && !path.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  return NextResponse.next();
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
