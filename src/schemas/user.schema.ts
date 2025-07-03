/**
 * User-related schemas for validation and typing
 */
import { z } from "zod";

/**
 * Schema for user data
 */
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type User = z.infer<typeof userSchema>;

/**
 * Schema for user settings
 */
export const userSettingsSchema = z.object({
  userId: z.string(),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  defaultView: z.enum(["grid", "list"]).default("grid"),
  bookmarksPerPage: z.number().int().positive().default(20),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;
