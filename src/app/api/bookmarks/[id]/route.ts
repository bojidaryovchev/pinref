import { authOptions } from "@/lib/auth";
import { deleteBookmark, getBookmarkById, updateBookmark } from "@/lib/dynamodb";
import { decryptBookmarkData } from "@/lib/encryption";
import { updateBookmarkSchema } from "@/schemas/bookmark.schema";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookmark = await getBookmarkById(id);

    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    // Verify the bookmark belongs to the current user
    const bookmarkData = bookmark as { userId?: string; url?: string; title?: string; description?: string };
    if (bookmarkData.userId !== session.user.email) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    // Decrypt sensitive data before returning
    if (bookmarkData.url || bookmarkData.title || bookmarkData.description) {
      const decryptedData = decryptBookmarkData({
        url: bookmarkData.url || "",
        title: bookmarkData.title,
        description: bookmarkData.description,
      });

      bookmarkData.url = decryptedData.url;
      bookmarkData.title = decryptedData.title;
      bookmarkData.description = decryptedData.description;
    }

    return NextResponse.json(bookmarkData);
  } catch (error) {
    console.error("Error fetching bookmark:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the bookmark exists and belongs to the current user
    const existingBookmark = await getBookmarkById(id);
    if (!existingBookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    const bookmarkData = existingBookmark as { userId?: string };
    if (bookmarkData.userId !== session.user.email) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData = updateBookmarkSchema.parse(body);

    const updatedBookmark = await updateBookmark(id, updateData);

    // Decrypt sensitive data before returning
    const responseData = updatedBookmark as { url?: string; title?: string; description?: string };
    if (responseData.url || responseData.title || responseData.description) {
      const decryptedData = decryptBookmarkData({
        url: responseData.url || "",
        title: responseData.title,
        description: responseData.description,
      });

      responseData.url = decryptedData.url;
      responseData.title = decryptedData.title;
      responseData.description = decryptedData.description;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error updating bookmark:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the bookmark exists and belongs to the current user
    const existingBookmark = await getBookmarkById(id);
    if (!existingBookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    const bookmarkData = existingBookmark as { userId?: string };
    if (bookmarkData.userId !== session.user.email) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    await deleteBookmark(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
