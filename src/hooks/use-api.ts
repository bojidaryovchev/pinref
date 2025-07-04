/**
 * SWR hooks for data fetching with automatic revalidation
 */

import {
  createBookmarkAction,
  createCategoryAction,
  createTagAction,
  deleteBookmarkAction,
  deleteCategoryAction,
  deleteTagAction,
  rebuildSearchIndexAction,
  updateBookmarkAction,
  updateCategoryAction,
  updateTagAction,
  updateUserSettingsAction,
} from "@/actions";
import { SWR_CONFIG } from "@/constants";
import type { Bookmark, BookmarkQueryOptions, CreateBookmarkInput } from "@/schemas/bookmark.schema";
import type { Category, CreateCategoryInput } from "@/schemas/category.schema";
import type { CreateTagInput, Tag } from "@/schemas/tag.schema";
import type { UpdateUserSettingsInput } from "@/schemas/user-settings.schema";
import type { UserSettings } from "@/schemas/user.schema";
import { fetcher } from "@/swr";
import useSWR from "swr";

/**
 * Hook for bookmark data with optional filtering
 */
export function useBookmarks(options: BookmarkQueryOptions = { limit: 20 }) {
  // Build query string for the SWR key
  const params = new URLSearchParams();
  if (options.limit) params.append("limit", options.limit.toString());
  if (options.categoryId) params.append("category", options.categoryId);
  if (options.tagId) params.append("tag", options.tagId);
  if (options.isFavorite) params.append("favorite", "true");
  if (options.query) params.append("q", options.query);

  const queryString = params.toString();
  const url = `/api/bookmarks${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<{
    bookmarks: Bookmark[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(url, fetcher, {
    refreshInterval: SWR_CONFIG.REFRESH_INTERVAL,
    revalidateOnFocus: SWR_CONFIG.REVALIDATE_ON_FOCUS,
    revalidateOnReconnect: SWR_CONFIG.REVALIDATE_ON_RECONNECT,
    dedupingInterval: SWR_CONFIG.DEDUPING_INTERVAL,
  });

  // Helper function to refresh data
  const refreshBookmarks = async () => {
    await mutate();
  };

  // Helper function to add a new bookmark
  const addBookmark = async (
    bookmarkData: CreateBookmarkInput & {
      metadata?: {
        title?: string;
        description?: string;
        image?: string;
        favicon?: string;
        domain?: string;
      };
    },
  ): Promise<Bookmark> => {
    const result = await createBookmarkAction(bookmarkData);
    await mutate();
    return result.bookmark;
  };

  // Helper function to update a bookmark
  const updateBookmarkItem = async (id: string, bookmarkData: Partial<CreateBookmarkInput>): Promise<void> => {
    await updateBookmarkAction(id, bookmarkData);
    await mutate();
  };

  // Helper function to delete a bookmark
  const removeBookmark = async (id: string): Promise<void> => {
    await deleteBookmarkAction(id);
    await mutate();
  };

  // Helper function to toggle favorite status
  const toggleFavorite = async (id: string, isFavorite: boolean): Promise<void> => {
    await updateBookmarkAction(id, { isFavorite });
    await mutate();
  };

  return {
    bookmarks: data?.bookmarks || [],
    pagination: data?.pagination || { page: 1, limit: options.limit || 20, total: 0, totalPages: 1 },
    isLoading,
    error,
    refreshBookmarks,
    addBookmark,
    updateBookmark: updateBookmarkItem,
    removeBookmark,
    toggleFavorite,
  };
}

/**
 * Hook for categories data
 */
export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR<Category[]>("/api/categories", fetcher, {
    refreshInterval: SWR_CONFIG.REFRESH_INTERVAL,
    revalidateOnFocus: SWR_CONFIG.REVALIDATE_ON_FOCUS,
    revalidateOnReconnect: SWR_CONFIG.REVALIDATE_ON_RECONNECT,
    dedupingInterval: SWR_CONFIG.DEDUPING_INTERVAL,
  });

  // Helper function to refresh data
  const refreshCategories = async () => {
    await mutate();
  };

  // Helper function to add a new category
  const addCategory = async (categoryData: CreateCategoryInput): Promise<Category> => {
    const result = await createCategoryAction(categoryData);
    await mutate();
    return result.category;
  };

  // Helper function to update a category
  const updateCategoryItem = async (id: string, categoryData: Partial<CreateCategoryInput>): Promise<void> => {
    await updateCategoryAction(id, categoryData);
    await mutate();
  };

  // Helper function to delete a category
  const removeCategory = async (id: string): Promise<void> => {
    await deleteCategoryAction(id);
    await mutate();
  };

  return {
    categories: data || [],
    isLoading,
    error,
    refreshCategories,
    addCategory,
    updateCategory: updateCategoryItem,
    removeCategory,
  };
}

/**
 * Hook for tags data
 */
export function useTags() {
  const { data, error, isLoading, mutate } = useSWR<Tag[]>("/api/tags", fetcher, {
    refreshInterval: SWR_CONFIG.REFRESH_INTERVAL,
    revalidateOnFocus: SWR_CONFIG.REVALIDATE_ON_FOCUS,
    revalidateOnReconnect: SWR_CONFIG.REVALIDATE_ON_RECONNECT,
    dedupingInterval: SWR_CONFIG.DEDUPING_INTERVAL,
  });

  // Helper function to refresh data
  const refreshTags = async () => {
    await mutate();
  };

  // Helper function to add a new tag
  const addTag = async (tagData: CreateTagInput): Promise<Tag> => {
    const result = await createTagAction(tagData);
    await mutate();
    return result.tag;
  };

  // Helper function to update a tag
  const updateTagItem = async (id: string, tagData: Partial<CreateTagInput>): Promise<void> => {
    await updateTagAction(id, tagData);
    await mutate();
  };

  // Helper function to delete a tag
  const removeTag = async (id: string): Promise<void> => {
    await deleteTagAction(id);
    await mutate();
  };

  return {
    tags: data || [],
    isLoading,
    error,
    refreshTags,
    addTag,
    updateTag: updateTagItem,
    removeTag,
  };
}

/**
 * Hook for user settings data
 */
export function useUserSettings() {
  const { data, error, isLoading, mutate } = useSWR<UserSettings>("/api/user/settings", fetcher, {
    refreshInterval: SWR_CONFIG.REFRESH_INTERVAL,
    revalidateOnFocus: SWR_CONFIG.REVALIDATE_ON_FOCUS,
    revalidateOnReconnect: SWR_CONFIG.REVALIDATE_ON_RECONNECT,
    dedupingInterval: SWR_CONFIG.DEDUPING_INTERVAL,
  });

  // Helper function to refresh data
  const refreshUserSettings = async () => {
    await mutate();
  };

  // Helper function to update settings
  const updateSettings = async (settingsData: UpdateUserSettingsInput): Promise<void> => {
    await updateUserSettingsAction(settingsData);
    await mutate();
  };

  return {
    settings: data || {
      theme: "system",
      defaultView: "grid",
      bookmarksPerPage: 20,
    },
    isLoading,
    error,
    refreshUserSettings,
    updateSettings,
  };
}

/**
 * Hook for rebuilding the search index
 */
export function useRebuildSearchIndex() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    count: number;
    message: string;
  } | null>(null, null);

  const rebuild = async () => {
    try {
      // Start loading
      mutate(undefined, false);

      // Call the API
      const result = await rebuildSearchIndexAction();

      // Update with the result
      mutate(result, false);

      return result;
    } catch (error) {
      // Update with the error
      mutate(null, false);
      throw error;
    }
  };

  return {
    result: data,
    error,
    isLoading,
    rebuild,
  };
}
