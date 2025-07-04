"use server";

/**
 * Server-side API functions with Next.js caching
 * These functions are called by API routes and include server-side caching
 * Similar to your crypto project pattern
 */

import { revalidateTag } from "next/cache";
import { auth } from "./auth";
import {
  getCategoriesWithCounts,
  getTagsWithCounts,
  getUserBookmarks,
  getUserSettings,
  searchBookmarks,
} from "./lib/dynamodb";
import { decryptBookmarkData } from "./lib/encryption";
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
      limit: options.limit || 100,
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

  // Decrypt sensitive data before returning
  const decryptedBookmarks = bookmarks.map((bookmark: unknown) => {
    const bookmarkObj = bookmark as Record<string, unknown>;
    if (
      bookmarkObj.url ||
      bookmarkObj.title ||
      bookmarkObj.description ||
      bookmarkObj.image ||
      bookmarkObj.favicon ||
      bookmarkObj.domain
    ) {
      const decryptedData = decryptBookmarkData({
        url: (bookmarkObj.url as string) || "",
        title: bookmarkObj.title as string,
        description: bookmarkObj.description as string,
        image: bookmarkObj.image as string,
        favicon: bookmarkObj.favicon as string,
        domain: bookmarkObj.domain as string,
      });
      return {
        ...bookmarkObj,
        url: decryptedData.url,
        title: decryptedData.title,
        description: decryptedData.description,
        image: decryptedData.image,
        favicon: decryptedData.favicon,
        domain: decryptedData.domain,
      };
    }
    return bookmarkObj;
  });

  return {
    bookmarks: decryptedBookmarks as Bookmark[],
    pagination: {
      page: 1,
      limit: options.limit || 100,
      total: bookmarks.length,
      totalPages: 1,
    },
  };
};

export const fetchCategoriesData = async (): Promise<Category[]> => {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  const categories = await getCategoriesWithCounts(session.user.email);
  return categories as Category[];
};

export const fetchTagsData = async (): Promise<Tag[]> => {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  const tags = await getTagsWithCounts(session.user.email);
  return tags as Tag[];
};

export const fetchUserSettingsData = async (): Promise<UserSettings> => {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

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
