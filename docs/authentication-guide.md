# Authentication Implementation Guide

## Overview

This document describes the implementation of authentication in the Pinref application using NextAuth.js.

## Architecture

The authentication system is built with the following components:

1. **NextAuth.js** - For managing authentication flows with Google OAuth provider
2. **DynamoDB Adapter** - For storing user accounts in DynamoDB
3. **JWT Strategy** - For maintaining session state without database access
4. **Middleware** - For protecting routes and redirecting unauthenticated users

## Key Files

- `src/auth.config.ts` - Core authentication configuration for NextAuth.js
- `src/lib/auth.ts` - NextAuth setup with DynamoDB adapter
- `src/middleware.ts` - Route protection middleware
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API routes
- `src/app/auth/page.tsx` - Sign-in page UI
- `src/swr.ts` - SWR configuration with authentication error handling

## Authentication Flow

1. User visits a protected page
2. Middleware checks for authentication token
3. If no token, user is redirected to `/auth`
4. User signs in with Google
5. NextAuth creates a JWT session
6. User is redirected to the original destination

## Debugging

For debugging authentication issues:

1. Check AWS CloudWatch logs for detailed error information
2. Look for errors in the browser console related to authentication
3. Inspect the NextAuth session cookie in the browser developer tools
4. Enable debug mode in development by setting `debug: true` in `authOptions`
5. Check network requests for 401/403 responses that may indicate auth failures

## Common Issues and Solutions

### Invalid Token Errors

If you see "The security token included in the request is invalid" errors:

1. Ensure the Lambda function has the correct IAM permissions
2. Verify the DynamoDB table exists and is accessible
3. Check the DynamoDB configuration in `sst.config.ts`

### NextAuth Adapter Errors

For issues with the DynamoDB adapter:

1. Check that the table schema matches NextAuth's requirements
2. Verify `tableName`, `partitionKey`, and `sortKey` settings
3. Make sure AWS credentials are correctly configured

### JWT Session Issues

If JWT sessions aren't persisting:

1. Verify `NEXTAUTH_SECRET` is set correctly
2. Check that the session strategy is set to "jwt"
3. Ensure cookies are properly set and not blocked

## Configuration

The authentication system is configured with:

- JWT sessions (30 day expiry)
- Google OAuth provider
- Custom sign-in page at `/auth`
- Route protection via middleware
- SWR authentication error handling with automatic redirects
- Return URL preservation for seamless post-login navigation

### Environment Variables

The following environment variables must be set for authentication to work properly:

```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=https://your-domain.com (production only)
```

For development, `NEXTAUTH_URL` is optional. For production, it must be set to your domain.

## API Credential Handling

All API functions in `src/API.ts` include `credentials: 'include'` in fetch options to ensure authentication cookies are sent with each request. The SWR fetcher in `src/swr.ts` similarly includes credentials in all requests.

When authentication fails:

- API routes return 401/403 status codes
- SWR fetcher detects these errors and redirects to the auth page
- The current URL is preserved as a returnUrl parameter for post-login redirection
- After successful login, the user is returned to their original location

## Testing Authentication

To verify authentication is working:

1. Visit any protected page while logged out
2. Should redirect to `/auth` with the current path preserved in the `returnUrl` parameter
3. Sign in with Google
4. Should redirect back to the original page after successful authentication
5. Confirm you can access protected API routes without 401 errors
6. Test SWR fetches to ensure they include credentials and handle auth errors properly
7. Verify user session information is properly available in components
