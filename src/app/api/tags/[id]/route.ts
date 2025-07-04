import { deleteTagAction, updateTagAction } from "@/actions";
import { getTagById } from "@/lib/dynamodb";
import { decryptTagData } from "@/lib/encryption";
import { updateTagSchema } from "@/schemas/tag.schema";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tag = await getTagById(id);

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Decrypt sensitive data before returning
    const tagData = tag as { name?: string };
    if (tagData.name) {
      const decryptedData = decryptTagData({ name: tagData.name });
      return NextResponse.json({ ...tag, ...decryptedData });
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error fetching tag:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updateData = updateTagSchema.parse(body);

    await updateTagAction(id, updateData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating tag:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteTagAction(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
