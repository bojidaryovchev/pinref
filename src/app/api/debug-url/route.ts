import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/env";

/**
 * Debug route to check URL resolution in different environments
 */
export async function GET(request: NextRequest) {
  // Get request info
  const requestUrl = request.url;
  const headers = Object.fromEntries(request.headers.entries());
  
  // Get environment info
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    DEPLOYMENT_ENV: process.env.DEPLOYMENT_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_RUNTIME: process.env.NEXT_RUNTIME,
  };
  
  // Get resolved site URL
  const resolvedSiteUrl = getSiteUrl();
  
  return NextResponse.json({
    requestUrl,
    resolvedSiteUrl,
    headers,
    envInfo,
  });
}
