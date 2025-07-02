import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name too long"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().min(1, "Color is required"),
});

export type CategorySchemaData = z.infer<typeof categorySchema>;
