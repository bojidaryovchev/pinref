"use server";

/**
 * Centralized API functions for client-side data fetching
 * Implements server actions with tag-based cache invalidation
 */

import { revalidateTag } from "next/cache";
import { API_ENDPOINTS, CACHE_TAGS } from "./constants";
import { getAbsoluteUrl } from "./lib/env";
import { Bookmark, BookmarkQueryOptions, CreateBookmarkInput } from "./schemas/bookmark.schema";
import { Category, CreateCategoryInput } from "./schemas/category.schema";
import { CreateTagInput, Tag } from "./schemas/tag.schema";
import { UpdateUserSettingsInput } from "./schemas/user-settings.schema";
import { UserSettings } from "./schemas/user.schema";

/**
 * Resilient fetch utility that handles URL parsing errors and authentication issues
 * 
 * This function:
 * 1. First tries with the provided URL
 * 2. If URL parsing fails, retries with absolute URL
 * 3. Handles 401 errors with more detailed error messages
 */
async function resilientFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    // Always ensure credentials are included
    const fetchOptions: RequestInit = {
      ...options,
      credentials: "include", // Always include credentials
    };

    // First try with the provided URL
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      // Special handling for authentication errors
      if (response.status === 401) {
        console.error(`[resilientFetch] Authentication error (401) for URL: ${url}`);
        throw new Error("Authentication failed - Please log in again");
      }
      
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // Handle URL parsing errors by retrying with absolute URL
    if (error instanceof TypeError && error.message.includes('Failed to parse URL')) {
      console.warn(`[resilientFetch] Retrying with absolute URL: ${url}`);
      const absoluteUrl = getAbsoluteUrl(url);
      
      // Ensure credentials are included in the retry
      const fetchOptions: RequestInit = {
        ...options,
        credentials: "include", // Always include credentials
      };
      
      const response = await fetch(absoluteUrl, fetchOptions);
      
      if (!response.ok) {
        // Special handling for authentication errors on retry
        if (response.status === 401) {
          console.error(`[resilientFetch] Authentication error (401) for absolute URL: ${absoluteUrl}`);
          throw new Error("Authentication failed - Please log in again");
        }
        
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    }
    
    // Re-throw other errors
    throw error;
  }
}

// SERVER ACTIONS WITH TAG-BASED CACHE INVALIDATION

/**
 * Cache tag invalidation functions
 */
export const invalidateBookmarksCache = async () => {
  try {
    revalidateTag(CACHE_TAGS.BOOKMARKS);
    return true;
  } catch (error) {
    console.error("Failed to invalidate bookmarks cache:", error);
    return false;
  }
};

export const invalidateCategoriesCache = async () => {
  try {
    revalidateTag(CACHE_TAGS.CATEGORIES);
    return true;
  } catch (error) {
    console.error("Failed to invalidate categories cache:", error);
    return false;
  }
};

export const invalidateTagsCache = async () => {
  try {
    revalidateTag(CACHE_TAGS.TAGS);
    return true;
  } catch (error) {
    console.error("Failed to invalidate tags cache:", error);
    return false;
  }
};

export const invalidateUserSettingsCache = async () => {
  try {
    revalidateTag(CACHE_TAGS.USER_SETTINGS);
    return true;
  } catch (error) {
    console.error("Failed to invalidate user settings cache:", error);
    return false;
  }
};

export const invalidateSearchIndexCache = async () => {
  try {
    revalidateTag(CACHE_TAGS.SEARCH_INDEX);
    return true;
  } catch (error) {
    console.error("Failed to invalidate search index cache:", error);
    return false;
  }
};

/**
 * Bookmark API Functions
 */

// Get bookmarks with optional filtering
export const getBookmarks = async (
  options: BookmarkQueryOptions,
): Promise<{
  bookmarks: Bookmark[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  // In server actions, we need to pass auth cookies
  const params = new URLSearchParams();

  if (options.limit) params.append("limit", options.limit.toString());
  if (options.categoryId) params.append("category", options.categoryId);
  if (options.tagId) params.append("tag", options.tagId);
  if (options.isFavorite) params.append("favorite", "true");
  if (options.query) params.append("q", options.query);

  // First try direct import from server components
  try {
    // Import server-side functions directly
    // This approach avoids the need for fetch and authentication issues
    const { getUserBookmarks, searchBookmarks } = await import('./lib/dynamodb');
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('./lib/auth');
    const { generateQueryTokens } = await import('./lib/metadata');
    
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      throw new Error("Authentication required");
    }
    
    let bookmarks;
    
    if (options.query) {
      // Enhanced n-gram search functionality
      const searchTokens = generateQueryTokens(options.query);
      bookmarks = await searchBookmarks(session.user.email, searchTokens);
    } else {
      // Regular listing with filters
      const queryOptions: { limit: number; categoryId?: string; isFavorite?: boolean } = { 
        limit: options.limit || 100 
      };

      if (options.categoryId) queryOptions.categoryId = options.categoryId;
      if (options.isFavorite) queryOptions.isFavorite = true;

      const result = await getUserBookmarks(session.user.email, queryOptions);
      bookmarks = result.items;
    }
    
    // Filter by tag if specified (client-side filtering for simplicity)
    if (options.tagId) {
      bookmarks = bookmarks.filter((bookmark: unknown) => {
        const bookmarkObj = bookmark as { tagIds?: string[] };
        return bookmarkObj.tagIds && bookmarkObj.tagIds.includes(options.tagId!);
      });
    }
    
    // Return in the same format as the API would
    return {
      bookmarks: bookmarks as Bookmark[],
      pagination: {
        page: 1,
        limit: options.limit || 100,
        total: bookmarks.length,
        totalPages: 1,
      }
    };
  } catch (directError) {
    console.error("Direct import method failed:", directError);
    
    // Fall back to resilient fetch if direct method fails
    const url = `${API_ENDPOINTS.BOOKMARKS}?${params.toString()}`;
    return resilientFetch<{
      bookmarks: Bookmark[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(url, {
      credentials: "include", // Include credentials for authentication
      next: { tags: [CACHE_TAGS.BOOKMARKS] }, // Add tag for cache invalidation
    });
  }
};

// Get a single bookmark by ID
export const getBookmark = async (id: string): Promise<Bookmark> => {
  return resilientFetch<Bookmark>(API_ENDPOINTS.BOOKMARK_BY_ID(id), {
    credentials: "include", // Include credentials for authentication
    next: { tags: [CACHE_TAGS.BOOKMARKS] },
  });
};

// Create a new bookmark
export const createBookmark = async (data: CreateBookmarkInput): Promise<Bookmark> => {
  const result = await resilientFetch<Bookmark>(API_ENDPOINTS.BOOKMARKS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // Include credentials for authentication
  });

  // Invalidate bookmarks cache after creating a new bookmark
  invalidateBookmarksCache();

  return result;
};

// Update an existing bookmark
export const updateBookmark = async (id: string, data: Partial<CreateBookmarkInput>): Promise<Bookmark> => {
  const result = await resilientFetch<Bookmark>(API_ENDPOINTS.BOOKMARK_BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // Include credentials for authentication
  });

  // Invalidate bookmarks cache after updating a bookmark
  invalidateBookmarksCache();

  return result;
};

// Delete a bookmark
export const deleteBookmark = async (id: string): Promise<void> => {
  await resilientFetch<void>(API_ENDPOINTS.BOOKMARK_BY_ID(id), {
    method: "DELETE",
    credentials: "include", // Include credentials for authentication
  });

  // Invalidate bookmarks cache after deleting a bookmark
  invalidateBookmarksCache();
};

// Toggle bookmark favorite status
export const toggleBookmarkFavorite = async (id: string, isFavorite: boolean): Promise<Bookmark> => {
  const result = await resilientFetch<Bookmark>(API_ENDPOINTS.BOOKMARK_BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isFavorite }),
    credentials: "include", // Include credentials for authentication
  });

  // Invalidate bookmarks cache after updating favorite status
  invalidateBookmarksCache();

  return result;
};

/**
 * Category API Functions
 */

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  return resilientFetch<Category[]>(API_ENDPOINTS.CATEGORIES, {
    credentials: "include", // Include credentials for authentication
    next: { tags: [CACHE_TAGS.CATEGORIES] },
  });
};

// Get a single category
export const getCategory = async (id: string): Promise<Category> => {
  return resilientFetch<Category>(API_ENDPOINTS.CATEGORY_BY_ID(id), {
    credentials: "include", // Include credentials for authentication
    next: { tags: [CACHE_TAGS.CATEGORIES] },
  });
};

// Create a new category
export const createCategory = async (data: CreateCategoryInput): Promise<Category> => {
  const result = await resilientFetch<Category>(API_ENDPOINTS.CATEGORIES, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // Include credentials for authentication
  });

  // Invalidate categories cache after creating a new category
  invalidateCategoriesCache();
  // May affect bookmarks display that use categories
  invalidateBookmarksCache();

  return result;
};

// Update an existing category
export const updateCategory = async (id: string, data: Partial<CreateCategoryInput>): Promise<Category> => {
  const result = await resilientFetch<Category>(API_ENDPOINTS.CATEGORY_BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // Include credentials for authentication
  });

  // Invalidate categories cache after updating a category
  invalidateCategoriesCache();
  // May affect bookmarks display that use this category
  invalidateBookmarksCache();

  return result;
};

// Delete a category
export const deleteCategory = async (id: string): Promise<void> => {
  await resilientFetch<void>(API_ENDPOINTS.CATEGORY_BY_ID(id), {
    method: "DELETE",
    credentials: "include", // Include credentials for authentication
  });

  // Invalidate categories cache after deleting a category
  invalidateCategoriesCache();
  // May affect bookmarks display that use this category
  invalidateBookmarksCache();
};

/**
 * Tag API Functions
 */

// Get all tags
export const getTags = async (): Promise<Tag[]> => {
  return resilientFetch<Tag[]>(API_ENDPOINTS.TAGS, {
    credentials: "include", // Include credentials for authentication
    next: { tags: [CACHE_TAGS.TAGS] },
  });
};

// Get a single tag
export const getTag = async (id: string): Promise<Tag> => {
  return resilientFetch<Tag>(API_ENDPOINTS.TAG_BY_ID(id), {
    credentials: "include", // Include credentials for authentication
    next: { tags: [CACHE_TAGS.TAGS] },
  });
};

// Create a new tag
export const createTag = async (data: CreateTagInput): Promise<Tag> => {
  const result = await resilientFetch<Tag>(API_ENDPOINTS.TAGS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // Include credentials for authentication
  });

  // Invalidate tags cache after creating a new tag
  invalidateTagsCache();
  // May affect bookmarks display that use tags
  invalidateBookmarksCache();

  return result;
};

// Update an existing tag
export const updateTag = async (id: string, data: Partial<CreateTagInput>): Promise<Tag> => {
  const result = await resilientFetch<Tag>(API_ENDPOINTS.TAG_BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // Include credentials for authentication
  });

  // Invalidate tags cache after updating a tag
  invalidateTagsCache();
  // May affect bookmarks display that use this tag
  invalidateBookmarksCache();

  return result;
};

// Delete a tag
export const deleteTag = async (id: string): Promise<void> => {
  await resilientFetch<void>(API_ENDPOINTS.TAG_BY_ID(id), {
    method: "DELETE",
    credentials: "include", // Include credentials for authentication
  });

  // Invalidate tags cache after deleting a tag
  invalidateTagsCache();
  // May affect bookmarks display that use this tag
  invalidateBookmarksCache();
};

/**
 * User Settings API Functions
 */

// Get user settings
export const getUserSettings = async (): Promise<UserSettings> => {
  return resilientFetch<UserSettings>(API_ENDPOINTS.USER_SETTINGS, {
    credentials: "include", // Include credentials for authentication
    next: { tags: [CACHE_TAGS.USER_SETTINGS] },
  });
};

// Update user settings
export const updateUserSettings = async (data: UpdateUserSettingsInput): Promise<UserSettings> => {
  const result = await resilientFetch<UserSettings>(API_ENDPOINTS.USER_SETTINGS, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // Include credentials for authentication
  });

  // Invalidate user settings cache after updating
  invalidateUserSettingsCache();

  return result;
};

/**
 * Search Index API Functions
 */

// Rebuild the search index for the authenticated user
export const rebuildSearchIndex = async (): Promise<{ success: boolean; count: number; message: string }> => {
  try {
    const result = await resilientFetch<{ success: boolean; count: number; message: string }>(API_ENDPOINTS.REBUILD_SEARCH_INDEX, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    
    // Invalidate bookmarks cache after rebuilding the search index
    invalidateBookmarksCache();
    // Invalidate search index cache
    invalidateSearchIndexCache();
    
    return result;
  } catch (error) {
    // Special handling for the search index errors to provide better error messages
    if (error instanceof Error) {
      try {
        const errorMessage = error.message;
        const errorObj = JSON.parse(errorMessage);
        throw new Error(errorObj.error || "Failed to rebuild search index");
      } catch {
        throw error;
      }
    }
    throw error;
  }
};
