/**
 * Category-related schemas for validation and typing
 */
import { z } from "zod";

/**
 * Schema for creating or updating a category
 */
export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name too long"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().min(1, "Color is required"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

/**
 * Schema for updating an existing category
 */
export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

/**
 * Schema for category data returned from API
 */
export const categorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  _count: z.object({ bookmarks: z.number() }).optional(),
});

export type Category = z.infer<typeof categorySchema>;

// Legacy type for backward compatibility
export type CategorySchemaData = CreateCategoryInput;
