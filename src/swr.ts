/**
 * SWR Configuration and fetcher function for the application
 */

/**
 * Default fetcher function for SWR to handle API responses and errors
 * @param url The URL to fetch from
 * @returns The parsed JSON response
 * @throws Error with message from API if response is not ok
 */
export const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    credentials: "include", // Always include credentials for API requests
  });

  // If the status code is not ok, handle the error
  if (!response.ok) {
    // For authentication errors, redirect to the login page
    if (response.status === 401 || response.status === 403) {
      // Add current URL as redirect param so user can return to the same page
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/auth?returnUrl=${returnUrl}`;
      throw new Error("Authentication required");
    }

    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || response.statusText || "An error occurred";
    throw new Error(errorMessage);
  }

  // Return the parsed JSON
  return response.json();
};

/**
 * Default configuration for SWR hooks
 */
export const defaultSWRConfig = {
  revalidateOnFocus: false, // Prevent revalidation when window gains focus
  revalidateOnReconnect: true,
  errorRetryCount: 3,
  shouldRetryOnError: true,
  refreshWhenHidden: false,
  dedupingInterval: 5000, // 5 seconds deduping interval
};
