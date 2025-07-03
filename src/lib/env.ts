export const getRuntimeEnv = () => {
  return process.env.NODE_ENV;
};

export const isRuntimeEnv = (env: typeof process.env.NODE_ENV) => {
  return env === process.env.NODE_ENV;
};

export const getDeploymentEnv = () => {
  return process.env.DEPLOYMENT_ENV ?? "dev";
};

export const isDeploymentEnv = (env: typeof process.env.DEPLOYMENT_ENV) => {
  return env === process.env.DEPLOYMENT_ENV;
};

/**
 * Get the site's base URL for absolute URL generation
 * 
 * In server-side contexts:
 * 1. First tries NEXTAUTH_URL (set in production via SST config)
 * 2. Falls back to environment-specific logic
 */
export const getSiteUrl = () => {
  // NEXTAUTH_URL is explicitly set in SST config for production
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // For server components in development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // For SST deployments
  const stage = getDeploymentEnv();
  if (stage === 'prod') {
    return 'https://pinref.com';
  } else if (stage) {
    return `https://${stage}.pinref.com`;
  }

  // Last resort fallback
  return 'http://localhost:3000';
};

/**
 * Convert a relative URL path to an absolute URL or return a relative URL
 * based on the current environment and context
 * 
 * In server-side code:
 * - For server actions: use absolute URLs to avoid URL parsing errors
 * - For API routes: relative URLs are fine and preferred
 */
export const getAbsoluteUrl = (path: string): string => {
  // If the path is already absolute, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // For server actions (running on server)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const siteUrl = getSiteUrl();
    return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
  
  // For client-side or middleware code, prefer relative URLs
  return path.startsWith('/') ? path : `/${path}`;
};
