"use server";

/**
 * Centralized API functions for client-side data fetching
 * Implements server actions with tag-based cache invalidation
 */

import { revalidateTag } from "next/cache";
import { API_ENDPOINTS, CACHE_TAGS } from "./constants";
import { Bookmark, BookmarkQueryOptions, CreateBookmarkInput } from "./schemas/bookmark.schema";
import { Category, CreateCategoryInput } from "./schemas/category.schema";
import { CreateTagInput, Tag } from "./schemas/tag.schema";
import { UpdateUserSettingsInput } from "./schemas/user-settings.schema";
import { UserSettings } from "./schemas/user.schema";

// SERVER ACTIONS WITH TAG-BASED CACHE INVALIDATION

/**
 * Cache tag invalidation functions
 */
export const invalidateBookmarksCache = () => {
  try {
    revalidateTag(CACHE_TAGS.BOOKMARKS);
    return true;
  } catch (error) {
    console.error("Failed to invalidate bookmarks cache:", error);
    return false;
  }
};

export const invalidateCategoriesCache = () => {
  try {
    revalidateTag(CACHE_TAGS.CATEGORIES);
    return true;
  } catch (error) {
    console.error("Failed to invalidate categories cache:", error);
    return false;
  }
};

export const invalidateTagsCache = () => {
  try {
    revalidateTag(CACHE_TAGS.TAGS);
    return true;
  } catch (error) {
    console.error("Failed to invalidate tags cache:", error);
    return false;
  }
};

export const invalidateUserSettingsCache = () => {
  try {
    revalidateTag(CACHE_TAGS.USER_SETTINGS);
    return true;
  } catch (error) {
    console.error("Failed to invalidate user settings cache:", error);
    return false;
  }
};

export const invalidateSearchIndexCache = () => {
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
  const params = new URLSearchParams();

  if (options.limit) params.append("limit", options.limit.toString());
  if (options.categoryId) params.append("category", options.categoryId);
  if (options.tagId) params.append("tag", options.tagId);
  if (options.isFavorite) params.append("favorite", "true");
  if (options.query) params.append("q", options.query);

  const url = `${API_ENDPOINTS.BOOKMARKS}?${params.toString()}`;
  const response = await fetch(url, {
    credentials: "include", // Include credentials for authentication
    next: { tags: [CACHE_TAGS.BOOKMARKS] }, // Add tag for cache invalidation
  });

  if (!response.ok) {
    throw new Error("Failed to fetch bookmarks");
  }

  return response.json();
};

// Get a single bookmark by ID
export const getBookmark = async (id: string): Promise<Bookmark> => {
  const response = await fetch(API_ENDPOINTS.BOOKMARK_BY_ID(id), {
    credentials: "include", // Include credentials for authentication
    next: { tags: [CACHE_TAGS.BOOKMARKS] },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch bookmark");
  }

  return response.json();
};

// Create a new bookmark
export const createBookmark = async (data: CreateBookmarkInput): Promise<Bookmark> => {
  const response = await fetch(API_ENDPOINTS.BOOKMARKS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // Include credentials for authentication
  });

  if (!response.ok) {
    throw new Error("Failed to create bookmark");
  }

  // Invalidate bookmarks cache after creating a new bookmark
  invalidateBookmarksCache();

  return response.json();
};

// Update an existing bookmark
export const updateBookmark = async (id: string, data: Partial<CreateBookmarkInput>): Promise<Bookmark> => {
  const response = await fetch(API_ENDPOINTS.BOOKMARK_BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // Include credentials for authentication
  });

  if (!response.ok) {
    throw new Error("Failed to update bookmark");
  }

  // Invalidate bookmarks cache after updating a bookmark
  invalidateBookmarksCache();

  return response.json();
};

// Delete a bookmark
export const deleteBookmark = async (id: string): Promise<void> => {
  const response = await fetch(API_ENDPOINTS.BOOKMARK_BY_ID(id), {
    method: "DELETE",
    credentials: "include", // Include credentials for authentication
  });

  if (!response.ok) {
    throw new Error("Failed to delete bookmark");
  }

  // Invalidate bookmarks cache after deleting a bookmark
  invalidateBookmarksCache();
};

// Toggle bookmark favorite status
export const toggleBookmarkFavorite = async (id: string, isFavorite: boolean): Promise<Bookmark> => {
  const response = await fetch(API_ENDPOINTS.BOOKMARK_BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isFavorite }),
    credentials: "include", // Include credentials for authentication
  });

  if (!response.ok) {
    throw new Error("Failed to update favorite status");
  }

  // Invalidate bookmarks cache after updating favorite status
  invalidateBookmarksCache();

  return response.json();
};

/**
 * Category API Functions
 */

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  const response = await fetch(API_ENDPOINTS.CATEGORIES, {
    credentials: "include", // Include credentials for authentication
    next: { tags: [CACHE_TAGS.CATEGORIES] },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  return response.json();
};

// Get a single category
export const getCategory = async (id: string): Promise<Category> => {
  const response = await fetch(API_ENDPOINTS.CATEGORY_BY_ID(id), {
    credentials: "include", // Include credentials for authentication
    next: { tags: [CACHE_TAGS.CATEGORIES] },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch category");
  }

  return response.json();
};

// Create a new category
export const createCategory = async (data: CreateCategoryInput): Promise<Category> => {
  const response = await fetch(API_ENDPOINTS.CATEGORIES, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // Include credentials for authentication
  });

  if (!response.ok) {
    throw new Error("Failed to create category");
  }

  // Invalidate categories cache after creating a new category
  invalidateCategoriesCache();
  // May affect bookmarks display that use categories
  invalidateBookmarksCache();

  return response.json();
};

// Update an existing category
export const updateCategory = async (id: string, data: Partial<CreateCategoryInput>): Promise<Category> => {
  const response = await fetch(API_ENDPOINTS.CATEGORY_BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // Include credentials for authentication
  });

  if (!response.ok) {
    throw new Error("Failed to update category");
  }

  // Invalidate categories cache after updating a category
  invalidateCategoriesCache();
  // May affect bookmarks display that use this category
  invalidateBookmarksCache();

  return response.json();
};

// Delete a category
export const deleteCategory = async (id: string): Promise<void> => {
  const response = await fetch(API_ENDPOINTS.CATEGORY_BY_ID(id), {
    method: "DELETE",
    credentials: "include", // Include credentials for authentication
  });

  if (!response.ok) {
    throw new Error("Failed to delete category");
  }

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
  const response = await fetch(API_ENDPOINTS.TAGS, {
    credentials: "include", // Include credentials for authentication
    next: { tags: [CACHE_TAGS.TAGS] },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch tags");
  }

  return response.json();
};

// Get a single tag
export const getTag = async (id: string): Promise<Tag> => {
  const response = await fetch(API_ENDPOINTS.TAG_BY_ID(id), {
    credentials: "include", // Include credentials for authentication
    next: { tags: [CACHE_TAGS.TAGS] },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch tag");
  }

  return response.json();
};

// Create a new tag
export const createTag = async (data: CreateTagInput): Promise<Tag> => {
  const response = await fetch(API_ENDPOINTS.TAGS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // Include credentials for authentication
  });

  if (!response.ok) {
    throw new Error("Failed to create tag");
  }

  // Invalidate tags cache after creating a new tag
  invalidateTagsCache();
  // May affect bookmarks display that use tags
  invalidateBookmarksCache();

  return response.json();
};

// Update an existing tag
export const updateTag = async (id: string, data: Partial<CreateTagInput>): Promise<Tag> => {
  const response = await fetch(API_ENDPOINTS.TAG_BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // Include credentials for authentication
  });

  if (!response.ok) {
    throw new Error("Failed to update tag");
  }

  // Invalidate tags cache after updating a tag
  invalidateTagsCache();
  // May affect bookmarks display that use this tag
  invalidateBookmarksCache();

  return response.json();
};

// Delete a tag
export const deleteTag = async (id: string): Promise<void> => {
  const response = await fetch(API_ENDPOINTS.TAG_BY_ID(id), {
    method: "DELETE",
    credentials: "include", // Include credentials for authentication
  });

  if (!response.ok) {
    throw new Error("Failed to delete tag");
  }

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
  const response = await fetch(API_ENDPOINTS.USER_SETTINGS, {
    credentials: "include", // Include credentials for authentication
    next: { tags: [CACHE_TAGS.USER_SETTINGS] },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user settings");
  }

  return response.json();
};

// Update user settings
export const updateUserSettings = async (data: UpdateUserSettingsInput): Promise<UserSettings> => {
  const response = await fetch(API_ENDPOINTS.USER_SETTINGS, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include", // Include credentials for authentication
  });

  if (!response.ok) {
    throw new Error("Failed to update user settings");
  }

  // Invalidate user settings cache after updating
  invalidateUserSettingsCache();

  return response.json();
};

/**
 * Search Index API Functions
 */

// Rebuild the search index for the authenticated user
export const rebuildSearchIndex = async (): Promise<{ success: boolean; count: number; message: string }> => {
  const response = await fetch(API_ENDPOINTS.REBUILD_SEARCH_INDEX, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to rebuild search index");
  }

  // Invalidate bookmarks cache after rebuilding the search index
  invalidateBookmarksCache();
  // Invalidate search index cache
  invalidateSearchIndexCache();

  return await response.json();
};
