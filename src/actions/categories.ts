"use server";

/**
 * Category server actions
 */

import { revalidateTag } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { auth } from "../auth";
import { createCategory, deleteCategory, updateCategory } from "../lib/dynamodb";
import { CreateCategoryInput } from "../schemas/category.schema";

export async function createCategoryAction(data: CreateCategoryInput) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  try {
    const categoryData = {
      id: uuidv4(),
      userId: session.user.email,
      name: data.name,
      icon: data.icon,
      color: data.color,
      createdAt: new Date().toISOString(),
    };

    await createCategory(categoryData);

    // Refresh cache
    revalidateTag("categories");
    revalidateTag("bookmarks"); // Categories affect bookmark display

    return { success: true, category: categoryData };
  } catch (error) {
    console.error("Error creating category:", error);
    throw new Error("Failed to create category");
  }
}

export async function updateCategoryAction(id: string, data: Partial<CreateCategoryInput>) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  try {
    await updateCategory(id, data);

    // Refresh cache
    revalidateTag("categories");
    revalidateTag("bookmarks");

    return { success: true };
  } catch (error) {
    console.error("Error updating category:", error);
    throw new Error("Failed to update category");
  }
}

export async function deleteCategoryAction(id: string) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  try {
    await deleteCategory(id);

    // Refresh cache
    revalidateTag("categories");
    revalidateTag("bookmarks");

    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    throw new Error("Failed to delete category");
  }
}
