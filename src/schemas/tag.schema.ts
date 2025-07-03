/**
 * Tag-related schemas for validation and typing
 */
import { z } from "zod";

/**
 * Schema for creating or updating a tag
 */
export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(30, "Tag name too long"),
  icon: z.string().optional(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

/**
 * Schema for updating an existing tag
 */
export const updateTagSchema = z.object({
  name: z.string().min(1).max(30).optional(),
  icon: z.string().optional(),
});

export type UpdateTagInput = z.infer<typeof updateTagSchema>;

/**
 * Schema for tag data returned from API
 */
export const tagSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  _count: z.object({ bookmarks: z.number() }).optional(),
});

export type Tag = z.infer<typeof tagSchema>;

// Legacy type for backward compatibility
export type TagSchemaData = CreateTagInput;
