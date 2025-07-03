import { SEARCH_RESULTS_LIMIT } from "@/constants";
import { authOptions } from "@/lib/auth";
import { createBookmark, getUserBookmarks, searchBookmarks } from "@/lib/dynamodb";
import { decryptBookmarkData, encryptBookmarkData } from "@/lib/encryption";
import { extractMetadata, generateQueryTokens, generateSearchTokens } from "@/lib/metadata";
import { createBookmarkSchema } from "@/schemas/bookmark.schema";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const categoryId = searchParams.get("category");
    const tagId = searchParams.get("tag");
    const favorite = searchParams.get("favorite");
    const limit = parseInt(searchParams.get("limit") || SEARCH_RESULTS_LIMIT.toString());

    let bookmarks;

    if (query) {
      // Enhanced n-gram search functionality
      const searchTokens = generateQueryTokens(query);
      bookmarks = await searchBookmarks(session.user.email, searchTokens);
    } else {
      // Regular listing with filters
      const options: { limit: number; categoryId?: string; isFavorite?: boolean } = { limit };

      if (categoryId) options.categoryId = categoryId;
      if (favorite === "true") options.isFavorite = true;

      const result = await getUserBookmarks(session.user.email, options);
      bookmarks = result.items;
    }

    // Filter by tag if specified (client-side filtering for simplicity)
    if (tagId) {
      bookmarks = bookmarks.filter((bookmark: unknown) => {
        const bookmarkObj = bookmark as { tagIds?: string[] };
        return bookmarkObj.tagIds && bookmarkObj.tagIds.includes(tagId);
      });
    }

    // Decrypt sensitive data before returning
    const decryptedBookmarks = bookmarks.map((bookmark) => {
      const typedBookmark = bookmark as {
        url?: string;
        title?: string;
        description?: string;
        [key: string]: unknown;
      };
      
      if (typedBookmark.url || typedBookmark.title || typedBookmark.description) {
        const decryptedData = decryptBookmarkData({
          url: typedBookmark.url || "",
          title: typedBookmark.title,
          description: typedBookmark.description,
        });
        
        return {
          ...typedBookmark,
          url: decryptedData.url,
          title: decryptedData.title,
          description: decryptedData.description,
        };
      }
      return typedBookmark;
    });
    
    return NextResponse.json({
      bookmarks: decryptedBookmarks,
      pagination: {
        page: 1,
        limit,
        total: decryptedBookmarks.length,
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
    if (!session?.user?.email) {
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
      userId: session.user.email,
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
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
