import { authOptions } from "@/lib/auth";
import { deleteTag, getTagById, updateTag } from "@/lib/dynamodb";
import { decryptTagData, encryptTagData } from "@/lib/encryption";
import { updateTagSchema } from "@/schemas/tag.schema";
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

    const tag = await getTagById(id);

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Verify the tag belongs to the current user
    const tagData = tag as { userId?: string; name?: string };
    if (tagData.userId !== session.user.email) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Decrypt sensitive data before returning
    if (tagData.name) {
      tagData.name = decryptTagData({ name: tagData.name }).name;
    }

    return NextResponse.json(tagData);
  } catch (error) {
    console.error("Error fetching tag:", error);
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

    // Check if the tag exists and belongs to the current user
    const existingTag = await getTagById(id);
    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const tagData = existingTag as { userId?: string };
    if (tagData.userId !== session.user.email) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData = updateTagSchema.parse(body);

    // Encrypt sensitive data if name is being updated
    const processedData = updateData.name
      ? { ...updateData, name: encryptTagData({ name: updateData.name }).name }
      : updateData;

    const updatedTag = await updateTag(id, processedData);

    // Decrypt name before returning response
    const responseData = { ...updatedTag } as { name?: string };
    if (responseData.name) {
      responseData.name = decryptTagData({ name: responseData.name }).name;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error updating tag:", error);
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

    // Check if the tag exists and belongs to the current user
    const existingTag = await getTagById(id);
    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const tagData = existingTag as { userId?: string };
    if (tagData.userId !== session.user.email) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    await deleteTag(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
