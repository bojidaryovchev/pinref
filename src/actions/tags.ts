"use server";

/**
 * Tag server actions
 */

import { revalidateTag } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { auth } from "../auth";
import { createTag, deleteTag, updateTag } from "../lib/dynamodb";
import { CreateTagInput } from "../schemas/tag.schema";

export async function createTagAction(data: CreateTagInput) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  try {
    const tagData = {
      id: uuidv4(),
      userId: session.user.email,
      name: data.name,
      icon: data.icon || "🏷️",
      createdAt: new Date().toISOString(),
    };

    await createTag(tagData);

    // Refresh cache
    revalidateTag("tags");
    revalidateTag("bookmarks"); // Tags affect bookmark display

    return { success: true, tag: tagData };
  } catch (error) {
    console.error("Error creating tag:", error);
    throw new Error("Failed to create tag");
  }
}

export async function updateTagAction(id: string, data: Partial<CreateTagInput>) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  try {
    await updateTag(id, data);

    // Refresh cache
    revalidateTag("tags");
    revalidateTag("bookmarks");

    return { success: true };
  } catch (error) {
    console.error("Error updating tag:", error);
    throw new Error("Failed to update tag");
  }
}

export async function deleteTagAction(id: string) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  try {
    await deleteTag(id);

    // Refresh cache
    revalidateTag("tags");
    revalidateTag("bookmarks");

    return { success: true };
  } catch (error) {
    console.error("Error deleting tag:", error);
    throw new Error("Failed to delete tag");
  }
}
