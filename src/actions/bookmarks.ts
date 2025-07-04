"use server";

/**
 * Bookmark server actions
 */

import { revalidateTag } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { auth } from "../auth";
import { createBookmark, deleteBookmark, updateBookmark } from "../lib/dynamodb";
import { encryptBookmarkData } from "../lib/encryption";
import { generateSearchTokens } from "../lib/metadata";
import { CreateBookmarkInput } from "../schemas/bookmark.schema";

export async function createBookmarkAction(
  data: CreateBookmarkInput & {
    metadata?: {
      title?: string;
      description?: string;
      image?: string;
      favicon?: string;
      domain?: string;
    };
  },
) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  try {
    // Use client-provided metadata or fallback to basic URL info
    const metadata = data.metadata || {};

    // Extract domain from URL if not provided
    if (!metadata.domain) {
      try {
        const urlObj = new URL(data.url);
        metadata.domain = urlObj.hostname;
      } catch {
        metadata.domain = data.url;
      }
    }

    // Create bookmark with metadata
    const bookmarkData = {
      id: uuidv4(),
      userId: session.user.email,
      url: data.url,
      title: data.title || metadata.title || data.url,
      description: data.description || metadata.description,
      image: metadata.image,
      favicon: metadata.favicon,
      domain: metadata.domain,
      categoryId: data.categoryId,
      tagIds: data.tagIds || [],
      isFavorite: data.isFavorite || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Encrypt sensitive data
    const encryptedData = encryptBookmarkData(bookmarkData);

    // Generate search tokens
    const searchTokens = generateSearchTokens(
      `${bookmarkData.title} ${bookmarkData.description} ${bookmarkData.domain} ${bookmarkData.url}`,
    );

    // Save to database
    const completeBookmarkData = {
      ...encryptedData,
      id: bookmarkData.id,
      userId: bookmarkData.userId,
      searchTokens,
    };
    await createBookmark(completeBookmarkData);

    // Refresh cache
    revalidateTag("bookmarks");

    return { success: true, bookmark: bookmarkData };
  } catch (error) {
    console.error("Error creating bookmark:", error);
    throw new Error("Failed to create bookmark");
  }
}

export async function updateBookmarkAction(id: string, data: Partial<CreateBookmarkInput>) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  try {
    await updateBookmark(id, data);

    // Refresh cache
    revalidateTag("bookmarks");

    return { success: true };
  } catch (error) {
    console.error("Error updating bookmark:", error);
    throw new Error("Failed to update bookmark");
  }
}

export async function deleteBookmarkAction(id: string) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  try {
    await deleteBookmark(id);

    // Refresh cache
    revalidateTag("bookmarks");

    return { success: true };
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    throw new Error("Failed to delete bookmark");
  }
}
