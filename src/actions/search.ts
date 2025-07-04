"use server";

/**
 * Search index server actions
 */

import { revalidateTag } from "next/cache";
import { auth } from "../auth";
import { rebuildSearchIndex } from "../lib/dynamodb";

export async function rebuildSearchIndexAction() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  try {
    const result = await rebuildSearchIndex(session.user.email);

    // Refresh cache
    revalidateTag("bookmarks");
    revalidateTag("search-index");

    return { success: true, count: result.count, message: "Search index rebuilt successfully" };
  } catch (error) {
    console.error("Error rebuilding search index:", error);
    throw new Error("Failed to rebuild search index");
  }
}
