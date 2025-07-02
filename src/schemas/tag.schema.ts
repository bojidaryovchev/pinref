import { z } from "zod";

export const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(30, "Tag name too long"),
  icon: z.string().optional(),
});

export type TagSchemaData = z.infer<typeof tagSchema>;
