"use server";

/**
 * Bookmark server actions
 */

import { revalidateTag } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { auth } from "../auth";
import { createBookmark, deleteBookmark, updateBookmark } from "../lib/dynamodb";
import { encryptBookmarkData } from "../lib/encryption";
import { extractMetadata, generateSearchTokens, type UrlMetadata } from "../lib/metadata";
import { CreateBookmarkInput } from "../schemas/bookmark.schema";

/**
 * Server action to extract metadata from a URL
 * This runs on the server to avoid CORS issues and German content problems
 */
export async function extractMetadataAction(url: string) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  try {
    const metadata = await extractMetadata(url);
    return { success: true, metadata };
  } catch (error) {
    console.error("Error extracting metadata:", error);
    throw new Error("Failed to extract metadata");
  }
}

export async function createBookmarkAction(
  data: CreateBookmarkInput,
  skipMetadataExtraction: boolean = false,
) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  try {
    // Extract metadata on the server side unless explicitly skipped
    let metadata: UrlMetadata = {};
    if (!skipMetadataExtraction) {
      try {
        metadata = await extractMetadata(data.url);
      } catch (error) {
        console.warn("Failed to extract metadata, using fallback:", error);
        // Use basic URL info as fallback
        try {
          const urlObj = new URL(data.url);
          metadata = {
            domain: urlObj.hostname,
            favicon: `https://${urlObj.hostname}/favicon.ico`,
            title: urlObj.hostname.replace(/^www\./, ""),
          };
        } catch {
          metadata = { domain: data.url };
        }
      }
    }

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
