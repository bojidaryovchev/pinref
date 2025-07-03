/**
 * SWR hooks for data fetching with automatic revalidation
 */

import { 
  API_ENDPOINTS, 
  SWR_CONFIG
} from "@/constants";
import { fetcher } from "@/swr";
import useSWR from "swr";
import { 
  createBookmark,
  updateBookmark,
  deleteBookmark,
  toggleBookmarkFavorite,
  createCategory,
  updateCategory,
  deleteCategory,
  createTag,
  updateTag,
  deleteTag
} from "@/API";
import type { BookmarkQueryOptions, Bookmark, CreateBookmarkInput } from "@/schemas/bookmark.schema";
import type { Category, CreateCategoryInput } from "@/schemas/category.schema";
import type { Tag, CreateTagInput } from "@/schemas/tag.schema";

/**
 * Hook for bookmark data with optional filtering
 */
export function useBookmarks(options: BookmarkQueryOptions = { limit: 20 }) {
  // Build query string for the SWR key
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.categoryId) params.append('category', options.categoryId);
  if (options.tagId) params.append('tag', options.tagId);
  if (options.isFavorite) params.append('favorite', 'true');
  if (options.query) params.append('q', options.query);
  
  const queryString = params.toString();
  const url = `${API_ENDPOINTS.BOOKMARKS}${queryString ? `?${queryString}` : ''}`;
  
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
  });
  
  // Helper function to refresh data
  const refreshBookmarks = async () => {
    await mutate();
  };
  
  // Helper function to add a new bookmark
  const addBookmark = async (bookmarkData: CreateBookmarkInput): Promise<Bookmark> => {
    const newBookmark = await createBookmark(bookmarkData);
    await mutate();
    return newBookmark;
  };
  
  // Helper function to update a bookmark
  const updateBookmarkItem = async (id: string, bookmarkData: Partial<CreateBookmarkInput>): Promise<Bookmark> => {
    const updatedBookmark = await updateBookmark(id, bookmarkData);
    await mutate();
    return updatedBookmark;
  };
  
  // Helper function to delete a bookmark
  const removeBookmark = async (id: string): Promise<void> => {
    await deleteBookmark(id);
    await mutate();
  };
  
  // Helper function to toggle favorite status
  const toggleFavorite = async (id: string, isFavorite: boolean): Promise<Bookmark> => {
    const updatedBookmark = await toggleBookmarkFavorite(id, isFavorite);
    await mutate();
    return updatedBookmark;
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
  const { data, error, isLoading, mutate } = useSWR<Category[]>(API_ENDPOINTS.CATEGORIES, fetcher, {
    refreshInterval: SWR_CONFIG.REFRESH_INTERVAL,
  });
  
  // Helper function to refresh data
  const refreshCategories = async () => {
    await mutate();
  };
  
  // Helper function to add a new category
  const addCategory = async (categoryData: CreateCategoryInput): Promise<Category> => {
    const newCategory = await createCategory(categoryData);
    await mutate();
    return newCategory;
  };
  
  // Helper function to update a category
  const updateCategoryItem = async (id: string, categoryData: Partial<CreateCategoryInput>): Promise<Category> => {
    const updatedCategory = await updateCategory(id, categoryData);
    await mutate();
    return updatedCategory;
  };
  
  // Helper function to delete a category
  const removeCategory = async (id: string): Promise<void> => {
    await deleteCategory(id);
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
  const { data, error, isLoading, mutate } = useSWR<Tag[]>(API_ENDPOINTS.TAGS, fetcher, {
    refreshInterval: SWR_CONFIG.REFRESH_INTERVAL,
  });
  
  // Helper function to refresh data
  const refreshTags = async () => {
    await mutate();
  };
  
  // Helper function to add a new tag
  const addTag = async (tagData: CreateTagInput): Promise<Tag> => {
    const newTag = await createTag(tagData);
    await mutate();
    return newTag;
  };
  
  // Helper function to update a tag
  const updateTagItem = async (id: string, tagData: Partial<CreateTagInput>): Promise<Tag> => {
    const updatedTag = await updateTag(id, tagData);
    await mutate();
    return updatedTag;
  };
  
  // Helper function to delete a tag
  const removeTag = async (id: string): Promise<void> => {
    await deleteTag(id);
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
