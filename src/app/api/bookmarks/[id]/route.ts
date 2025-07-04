import { deleteBookmarkAction, updateBookmarkAction } from "@/actions";
import { getBookmarkById } from "@/lib/dynamodb";
import { decryptBookmarkData } from "@/lib/encryption";
import { updateBookmarkSchema } from "@/schemas/bookmark.schema";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bookmark = await getBookmarkById(id);

    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    // Decrypt sensitive data before returning
    const bookmarkData = bookmark as { url?: string; title?: string; description?: string };
    if (bookmarkData.url || bookmarkData.title || bookmarkData.description) {
      const decryptedData = decryptBookmarkData({
        url: bookmarkData.url || "",
        title: bookmarkData.title,
        description: bookmarkData.description,
      });

      return NextResponse.json({ ...bookmark, ...decryptedData });
    }

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error("Error fetching bookmark:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updateData = updateBookmarkSchema.parse(body);

    await updateBookmarkAction(id, updateData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating bookmark:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteBookmarkAction(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
