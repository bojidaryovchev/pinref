/**
 * Bookmark-related schemas for validation and typing
 */
import { z } from "zod";

/**
 * Schema for creating a new bookmark
 */
export const createBookmarkSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;

/**
 * Schema for updating an existing bookmark
 */
export const updateBookmarkSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional(),
});

export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;

/**
 * Schema for bookmark data returned from API
 */
export const bookmarkSchema = z.object({
  id: z.string(),
  userId: z.string(),
  url: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  favicon: z.string().optional(),
  domain: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type Bookmark = z.infer<typeof bookmarkSchema>;

/**
 * Schema for bookmark query options
 */
export const bookmarkQuerySchema = z.object({
  limit: z.number().default(20),
  categoryId: z.string().optional(),
  tagId: z.string().optional(),
  isFavorite: z.boolean().optional(),
  query: z.string().optional(),
});

export type BookmarkQueryOptions = z.infer<typeof bookmarkQuerySchema>;

// Legacy type for backward compatibility
export type BookmarkSchemaData = CreateBookmarkInput;
