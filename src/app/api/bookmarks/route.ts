import { authOptions } from "@/lib/auth";
import { createBookmark, getUserBookmarks, searchBookmarks } from "@/lib/dynamodb";
import { encryptBookmarkData } from "@/lib/encryption";
import { extractMetadata, generateQueryTokens, generateSearchTokens } from "@/lib/metadata";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const createBookmarkSchema = z.object({
  url: z.string().url(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const categoryId = searchParams.get("category");
    const tagId = searchParams.get("tag");
    const favorite = searchParams.get("favorite");
    const limit = parseInt(searchParams.get("limit") || "20");

    let bookmarks;

    if (query) {
      // Enhanced n-gram search functionality
      const searchTokens = generateQueryTokens(query);
      bookmarks = await searchBookmarks(session.user.id, searchTokens);
    } else {
      // Regular listing with filters
      const options: any = { limit };

      if (categoryId) options.categoryId = categoryId;
      if (favorite === "true") options.isFavorite = true;

      const result = await getUserBookmarks(session.user.id, options);
      bookmarks = result.items;
    }

    // Filter by tag if specified (client-side filtering for simplicity)
    if (tagId) {
      bookmarks = bookmarks.filter((bookmark: any) => bookmark.tagIds && bookmark.tagIds.includes(tagId));
    }

    return NextResponse.json({
      bookmarks,
      pagination: {
        page: 1,
        limit,
        total: bookmarks.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url, categoryId, tagIds } = createBookmarkSchema.parse(body);

    // Extract metadata
    const metadata = await extractMetadata(url);

    // Encrypt sensitive data
    const encryptedData = encryptBookmarkData({
      url,
      title: metadata.title,
      description: metadata.description,
    });

    // Generate comprehensive n-gram search tokens from unencrypted data
    const searchText = [metadata.title, metadata.description, metadata.domain, url].filter(Boolean).join(" ");

    const searchTokens = generateSearchTokens(searchText);

    const bookmarkId = uuidv4();

    const bookmark = await createBookmark({
      id: bookmarkId,
      userId: session.user.id,
      url: encryptedData.url,
      title: encryptedData.title,
      description: encryptedData.description,
      image: metadata.image,
      favicon: metadata.favicon,
      domain: metadata.domain,
      categoryId,
      tagIds: tagIds || [],
      searchTokens,
    });

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    console.error("Error creating bookmark:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
