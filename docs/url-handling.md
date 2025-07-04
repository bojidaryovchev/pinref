# URL Handling in Pinref

This document explains the URL handling approach used in Pinref, particularly in server actions and API routes.

## Problem

When using Next.js server actions, URL parsing issues can occur, especially in deployment environments.
This happens because server actions execute on the server and need to make fetch requests to API routes.

Common errors include:

- `TypeError: Failed to parse URL from /api/bookmarks`
- `TypeError: fetch failed` with `ECONNREFUSED 127.0.0.1:3000`

These errors occur because:

1. Relative URLs in server actions don't have a base URL to resolve against
2. In deployment environments, localhost URLs don't work

## Solution

We've implemented a comprehensive solution with these components:

### 1. Resilient URL Resolution

In `src/lib/env.ts`, we provide utilities for working with URLs:

- `getSiteUrl()`: Determines the base URL based on the current environment:

  - Falls back to environment-specific logic (dev vs production)
  - Properly handles different stages in the SST deployment

- `getAbsoluteUrl()`: Converts relative paths to absolute URLs when necessary:
  - Detects if the URL is already absolute
  - Uses the appropriate base URL for the current environment
  - Different behavior in server vs client contexts

### 2. Resilient Fetch Utility

In `src/API.ts`, we've created a `resilientFetch` utility:

- First tries with the provided URL (usually relative)
- If URL parsing fails, automatically retries with an absolute URL
- Handles error cases appropriately
- Provides type-safety with generics

### 3. Debugging Support

- Added `src/app/api/debug-url/route.ts` to diagnose URL issues
- Enhanced middleware with additional logging in development

## Environment Configuration

The URL handling respects the following environment variables:

- `NODE_ENV`: Development vs production
- `DEPLOYMENT_ENV`: The SST deployment stage (dev/prod)

## Troubleshooting

If URL issues persist:

1. Check the debug endpoint: `/api/debug-url`
2. Verify that environment variables are set correctly
3. Ensure domain names in SST config match those in the application
4. Check for middleware or routing conflicts

## Future Improvements

- Consider adding a fallback URL configuration in case all automatic resolution fails
- Add more comprehensive error logging
- Consider implementing circuit breakers for API calls
