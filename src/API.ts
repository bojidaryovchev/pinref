"use server";

/**
 * Server-side API functions with Next.js caching
 * These functions are called by API routes and include server-side caching
 * Similar to your crypto project pattern
 */

import { revalidateTag } from "next/cache";
import { auth } from "./auth";
import { getUserBookmarks, searchBookmarks } from "./lib/dynamodb";
import { generateQueryTokens } from "./lib/metadata";
import { Bookmark, BookmarkQueryOptions } from "./schemas/bookmark.schema";
import { Category } from "./schemas/category.schema";
import { Tag } from "./schemas/tag.schema";
import { UserSettings } from "./schemas/user.schema";

/**
 * Data fetching functions with caching (called by API routes)
 */

export const fetchBookmarksData = async (options: BookmarkQueryOptions) => {
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

export const fetchCategoriesData = async (): Promise<Category[]> => {
  const session = await auth();
  
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  const { getUserCategories } = await import("./lib/dynamodb");
  const categories = await getUserCategories(session.user.email);

  // Add bookmark count (would need separate query in real implementation)
  const categoriesWithCount = categories.map((category) => ({
    ...category,
    _count: { bookmarks: 0 }, // Placeholder - implement actual counting
  }));

  return categoriesWithCount as Category[];
};

export const fetchTagsData = async (): Promise<Tag[]> => {
  const session = await auth();
  
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  const { getUserTags } = await import("./lib/dynamodb");
  const tags = await getUserTags(session.user.email);

  // Add bookmark count (would need separate query in real implementation)
  const tagsWithCount = tags.map((tag) => ({
    ...tag,
    _count: { bookmarks: 0 }, // Placeholder - implement actual counting
  }));

  return tagsWithCount as Tag[];
};

export const fetchUserSettingsData = async (): Promise<UserSettings> => {
  const session = await auth();
  
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  const { getUserSettings } = await import("./lib/dynamodb");
  const settings = await getUserSettings(session.user.email);

  // If settings don't exist, return defaults
  if (!settings) {
    return {
      userId: session.user.email,
      theme: "system",
      defaultView: "grid",
      bookmarksPerPage: 20,
    };
  }

  return settings;
};

/**
 * Cache refresh functions
 */

export const refreshBookmarksData = async () => {
  revalidateTag("bookmarks");
};

export const refreshCategoriesData = async () => {
  revalidateTag("categories");
};

export const refreshTagsData = async () => {
  revalidateTag("tags");
};

export const refreshUserSettingsData = async () => {
  revalidateTag("user-settings");
};

export const refreshSearchIndexData = async () => {
  revalidateTag("search-index");
};
