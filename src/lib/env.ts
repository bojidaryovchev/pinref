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
 */
export const getSiteUrl = () => {
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const host = (process.env.VERCEL_URL || process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3000') as string;
  return `${protocol}://${host}`;
};

/**
 * Convert a relative URL path to an absolute URL
 */
export const getAbsoluteUrl = (path: string): string => {
  const siteUrl = getSiteUrl();
  // If the path is already absolute, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Otherwise, prepend the site URL
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
};
