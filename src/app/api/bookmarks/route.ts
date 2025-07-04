import { fetchBookmarksData } from "@/API";
import { createBookmarkAction } from "@/actions";
import { createBookmarkSchema } from "@/schemas/bookmark.schema";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const categoryId = searchParams.get("category");
    const tagId = searchParams.get("tag");
    const favorite = searchParams.get("favorite");
    const limit = parseInt(searchParams.get("limit") || "100");

    const options = {
      query: query || undefined,
      categoryId: categoryId || undefined,
      tagId: tagId || undefined,
      isFavorite: favorite === "true" ? true : undefined,
      limit,
    };

    const result = await fetchBookmarksData(options);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createBookmarkSchema.parse(body);

    const result = await createBookmarkAction(data);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating bookmark:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create bookmark" }, { status: 500 });
  }
}
