"use server";

/**
 * Centralized API functions for server actions
 * Uses direct database calls and simple fetch for API routes
 */

import { revalidateTag } from "next/cache";
import { auth } from "./auth";
import { getUserBookmarks, searchBookmarks } from "./lib/dynamodb";
import { generateQueryTokens } from "./lib/metadata";
import { Bookmark, BookmarkQueryOptions, CreateBookmarkInput } from "./schemas/bookmark.schema";
import { Category, CreateCategoryInput } from "./schemas/category.schema";
import { CreateTagInput, Tag } from "./schemas/tag.schema";
import { UpdateUserSettingsInput } from "./schemas/user-settings.schema";
import { UserSettings } from "./schemas/user.schema";

/**
 * Cache tag invalidation functions
 */
export const invalidateBookmarksCache = async () => {
  revalidateTag("bookmarks");
};

export const invalidateCategoriesCache = async () => {
  revalidateTag("categories");
};

export const invalidateTagsCache = async () => {
  revalidateTag("tags");
};

export const invalidateUserSettingsCache = async () => {
  revalidateTag("user-settings");
};

export const invalidateSearchIndexCache = async () => {
  revalidateTag("search-index");
};

/**
 * Bookmark API Functions
 */

// Get bookmarks with optional filtering - using direct database calls for better performance
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
  const session = await auth();
  
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
  
  return {
    bookmarks: bookmarks as Bookmark[],
    pagination: {
      page: 1,
      limit: options.limit || 100,
      total: bookmarks.length,
      totalPages: 1,
    }
  };
};

// Get a single bookmark by ID
export const getBookmark = async (id: string): Promise<Bookmark> => {
  const response = await fetch(`/api/bookmarks/${id}`, {
    next: { tags: ["bookmarks"] },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bookmark: ${response.status}`);
  }

  return response.json();
};

// Create a new bookmark
export const createBookmark = async (data: CreateBookmarkInput): Promise<Bookmark> => {
  const response = await fetch("/api/bookmarks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create bookmark: ${response.status}`);
  }

  const result = await response.json();
  
  // Invalidate bookmarks cache after creating a new bookmark
  await invalidateBookmarksCache();

  return result;
};

// Update an existing bookmark
export const updateBookmark = async (id: string, data: Partial<CreateBookmarkInput>): Promise<Bookmark> => {
  const response = await fetch(`/api/bookmarks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update bookmark: ${response.status}`);
  }

  const result = await response.json();
  
  // Invalidate bookmarks cache after updating a bookmark
  await invalidateBookmarksCache();

  return result;
};

// Delete a bookmark
export const deleteBookmark = async (id: string): Promise<void> => {
  const response = await fetch(`/api/bookmarks/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete bookmark: ${response.status}`);
  }

  // Invalidate bookmarks cache after deleting a bookmark
  await invalidateBookmarksCache();
};

// Toggle bookmark favorite status
export const toggleBookmarkFavorite = async (id: string, isFavorite: boolean): Promise<Bookmark> => {
  const response = await fetch(`/api/bookmarks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isFavorite }),
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle bookmark favorite: ${response.status}`);
  }

  const result = await response.json();
  
  // Invalidate bookmarks cache after updating favorite status
  await invalidateBookmarksCache();

  return result;
};

/**
 * Category API Functions
 */

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  const response = await fetch("/api/categories", {
    next: { tags: ["categories"] },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }

  return response.json();
};

// Get a single category
export const getCategory = async (id: string): Promise<Category> => {
  const response = await fetch(`/api/categories/${id}`, {
    next: { tags: ["categories"] },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch category: ${response.status}`);
  }

  return response.json();
};

// Create a new category
export const createCategory = async (data: CreateCategoryInput): Promise<Category> => {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create category: ${response.status}`);
  }

  const result = await response.json();
  
  // Invalidate categories cache after creating a new category
  await invalidateCategoriesCache();
  // May affect bookmarks display that use categories
  await invalidateBookmarksCache();

  return result;
};

// Update an existing category
export const updateCategory = async (id: string, data: Partial<CreateCategoryInput>): Promise<Category> => {
  const response = await fetch(`/api/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update category: ${response.status}`);
  }

  const result = await response.json();
  
  // Invalidate categories cache after updating a category
  await invalidateCategoriesCache();
  // May affect bookmarks display that use this category
  await invalidateBookmarksCache();

  return result;
};

// Delete a category
export const deleteCategory = async (id: string): Promise<void> => {
  const response = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete category: ${response.status}`);
  }

  // Invalidate categories cache after deleting a category
  await invalidateCategoriesCache();
  // May affect bookmarks display that use this category
  await invalidateBookmarksCache();
};

/**
 * Tag API Functions
 */

// Get all tags
export const getTags = async (): Promise<Tag[]> => {
  const response = await fetch("/api/tags", {
    next: { tags: ["tags"] },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tags: ${response.status}`);
  }

  return response.json();
};

// Get a single tag
export const getTag = async (id: string): Promise<Tag> => {
  const response = await fetch(`/api/tags/${id}`, {
    next: { tags: ["tags"] },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tag: ${response.status}`);
  }

  return response.json();
};

// Create a new tag
export const createTag = async (data: CreateTagInput): Promise<Tag> => {
  const response = await fetch("/api/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create tag: ${response.status}`);
  }

  const result = await response.json();
  
  // Invalidate tags cache after creating a new tag
  await invalidateTagsCache();
  // May affect bookmarks display that use tags
  await invalidateBookmarksCache();

  return result;
};

// Update an existing tag
export const updateTag = async (id: string, data: Partial<CreateTagInput>): Promise<Tag> => {
  const response = await fetch(`/api/tags/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update tag: ${response.status}`);
  }

  const result = await response.json();
  
  // Invalidate tags cache after updating a tag
  await invalidateTagsCache();
  // May affect bookmarks display that use this tag
  await invalidateBookmarksCache();

  return result;
};

// Delete a tag
export const deleteTag = async (id: string): Promise<void> => {
  const response = await fetch(`/api/tags/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete tag: ${response.status}`);
  }

  // Invalidate tags cache after deleting a tag
  await invalidateTagsCache();
  // May affect bookmarks display that use this tag
  await invalidateBookmarksCache();
};

/**
 * User Settings API Functions
 */

// Get user settings
export const getUserSettings = async (): Promise<UserSettings> => {
  const response = await fetch("/api/user/settings", {
    next: { tags: ["user-settings"] },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user settings: ${response.status}`);
  }

  return response.json();
};

// Update user settings
export const updateUserSettings = async (data: UpdateUserSettingsInput): Promise<UserSettings> => {
  const response = await fetch("/api/user/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update user settings: ${response.status}`);
  }

  const result = await response.json();
  
  // Invalidate user settings cache after updating
  await invalidateUserSettingsCache();

  return result;
};

/**
 * Search Index API Functions
 */

// Rebuild the search index for the authenticated user
export const rebuildSearchIndex = async (): Promise<{ success: boolean; count: number; message: string }> => {
  const response = await fetch("/api/search-index/rebuild", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to rebuild search index: ${response.status}`);
  }

  const result = await response.json();
  
  // Invalidate bookmarks cache after rebuilding the search index
  await invalidateBookmarksCache();
  // Invalidate search index cache
  await invalidateSearchIndexCache();
  
  return result;
};
