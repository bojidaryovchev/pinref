/**
 * User settings API endpoint schemas
 */
import { z } from "zod";
import { userSettingsSchema } from "./user.schema";

/**
 * Schema for updating user settings
 */
export const updateUserSettingsSchema = userSettingsSchema
  .pick({
    theme: true,
    defaultView: true,
    bookmarksPerPage: true,
  })
  .partial();

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
