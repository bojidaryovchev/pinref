import { z } from "zod";

export const bookmarkSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
});

export type BookmarkSchemaData = z.infer<typeof bookmarkSchema>;
